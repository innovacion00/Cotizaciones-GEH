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

export async function joinWorkspace(workspaceId, userId, role = 'sales') {
  const ws = await Workspace.findById(workspaceId);
  if (!ws) throw new NotFoundError('Workspace');

  const alreadyMember = ws.members.some((m) => m.user.toString() === userId);
  if (!alreadyMember) {
    ws.members.push({ user: userId, role });
    await ws.save();
  }
  await User.findByIdAndUpdate(userId, { $addToSet: { workspaces: ws._id } });
  return ws;
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

export async function listMembers(workspaceId, userId) {
  const ws = await Workspace.findById(workspaceId).populate('members.user', 'name email').lean();
  if (!ws) throw new NotFoundError('Workspace');
  const isMember = ws.members.some((m) => m.user._id.toString() === userId);
  if (!isMember) throw new ForbiddenError('No eres miembro de este workspace');
  return ws.members;
}

export async function updateMemberRole(workspaceId, requesterId, targetId, role) {
  const ws = await Workspace.findById(workspaceId);
  if (!ws) throw new NotFoundError('Workspace');
  assertAdmin(ws, requesterId);

  const member = ws.members.find((m) => m.user.toString() === targetId);
  if (!member) throw new NotFoundError('Miembro');

  if (ws.owner.toString() === targetId && role !== 'admin') {
    throw new ForbiddenError('El propietario del workspace debe mantener el rol admin');
  }

  if (member.role === 'admin' && role !== 'admin') {
    const otherAdmins = ws.members.some((m) => m.role === 'admin' && m.user.toString() !== targetId);
    if (!otherAdmins) throw new ForbiddenError('Debe quedar al menos un admin en el workspace');
  }

  member.role = role;
  await ws.save();
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
