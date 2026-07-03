import * as workspacesService from './workspaces.service.js';
import { okResponse } from '../../shared/utils/index.js';

export async function create(req, res, next) {
  try {
    const ws = await workspacesService.createWorkspace(req.body, req.user.sub);
    return okResponse(res, { workspace: ws }, 201);
  } catch (err) {
    return next(err);
  }
}

export async function list(req, res, next) {
  try {
    const workspaces = await workspacesService.listUserWorkspaces(req.user.sub);
    return okResponse(res, { workspaces });
  } catch (err) {
    return next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const workspace = await workspacesService.getWorkspaceById(req.params.id, req.user.sub);
    return okResponse(res, { workspace });
  } catch (err) {
    return next(err);
  }
}

export async function update(req, res, next) {
  try {
    const workspace = await workspacesService.updateWorkspace(req.params.id, req.user.sub, req.body);
    return okResponse(res, { workspace });
  } catch (err) {
    return next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await workspacesService.deleteWorkspace(req.params.id, req.user.sub);
    return okResponse(res, { message: 'Workspace eliminado' });
  } catch (err) {
    return next(err);
  }
}

export async function addMember(req, res, next) {
  try {
    const ws = await workspacesService.addMember(req.params.id, req.user.sub, req.body);
    return okResponse(res, { workspace: ws });
  } catch (err) {
    return next(err);
  }
}

export async function listMembers(req, res, next) {
  try {
    const members = await workspacesService.listMembers(req.params.id, req.user.sub);
    return okResponse(res, { members });
  } catch (err) {
    return next(err);
  }
}

export async function updateMemberRole(req, res, next) {
  try {
    const ws = await workspacesService.updateMemberRole(req.params.id, req.user.sub, req.params.memberId, req.body.role);
    return okResponse(res, { workspace: ws });
  } catch (err) {
    return next(err);
  }
}

export async function removeMember(req, res, next) {
  try {
    const ws = await workspacesService.removeMember(req.params.id, req.user.sub, req.params.memberId);
    return okResponse(res, { workspace: ws });
  } catch (err) {
    return next(err);
  }
}
