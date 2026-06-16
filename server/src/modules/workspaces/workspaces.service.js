import Workspace from './workspace.model.js';
import User from '../auth/user.model.js';
import { AppError, NotFoundError, ForbiddenError } from '../../shared/errors/AppError.js';

export async function createWorkspace({ name, slug, settings }, ownerId) {
  const existing = await Workspace.findOne({ slug });
  if (existing) throw new AppError('El slug ya está en uso', 409, 'DUPLICATE_SLUG');

  const workspace = await Workspace.create({
    name,
    slug,
    owner: ownerId,
    members: [{ user: ownerId, role: 'admin' }],
    settings,
  });

  await User.findByIdAndUpdate(ownerId, { $addToSet: { workspaces: workspace._id } });
  return workspace;
}

export async function listUserWorkspaces(userId) {
  return Workspace.find({ 'members.user': userId }).lean();
}

export async function getWorkspaceById(id, userId) {
  const ws = await Workspace.findById(id).lean();
  if (!ws) throw new NotFoundError('Workspace');
  assertMember(ws, userId);
  return ws;
}

export async function updateWorkspace(id, userId, data) {
  const ws = await Workspace.findById(id);
  if (!ws) throw new NotFoundError('Workspace');
  assertAdmin(ws, userId);
  Object.assign(ws, data);
  return ws.save();
}

export async function deleteWorkspace(id, userId) {
  const ws = await Workspace.findById(id);
  if (!ws) throw new NotFoundError('Workspace');
  if (ws.owner.toString() !== userId) throw new ForbiddenError('Solo el propietario puede eliminar el workspace');
  await ws.deleteOne();
}

export async function addMember(workspaceId, userId, { userId: targetId, role }) {
  const ws = await Workspace.findById(workspaceId);
  if (!ws) throw new NotFoundError('Workspace');
  assertAdmin(ws, userId);

  const targetUser = await User.findById(targetId);
  if (!targetUser) throw new NotFoundError('Usuario');

  const alreadyMember = ws.members.some((m) => m.user.toString() === targetId);
  if (alreadyMember) throw new AppError('El usuario ya es miembro', 409, 'ALREADY_MEMBER');

  ws.members.push({ user: targetId, role });
  await ws.save();
  await User.findByIdAndUpdate(targetId, { $addToSet: { workspaces: ws._id } });
  return ws;
}

export async function removeMember(workspaceId, requesterId, targetId) {
  const ws = await Workspace.findById(workspaceId);
  if (!ws) throw new NotFoundError('Workspace');
  assertAdmin(ws, requesterId);
  if (ws.owner.toString() === targetId) throw new ForbiddenError('No se puede eliminar al propietario');

  ws.members = ws.members.filter((m) => m.user.toString() !== targetId);
  await ws.save();
  await User.findByIdAndUpdate(targetId, { $pull: { workspaces: ws._id } });
  return ws;
}

function assertMember(ws, userId) {
  const isMember = ws.members.some((m) => m.user.toString() === userId);
  if (!isMember) throw new ForbiddenError('No eres miembro de este workspace');
}

function assertAdmin(ws, userId) {
  const member = ws.members.find((m) => m.user.toString() === userId);
  if (!member || member.role !== 'admin') {
    throw new ForbiddenError('Se requiere rol de admin en el workspace');
  }
}
