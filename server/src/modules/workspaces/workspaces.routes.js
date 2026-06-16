import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { createWorkspaceSchema, updateWorkspaceSchema, addMemberSchema } from './workspaces.validation.js';
import * as workspacesController from './workspaces.controller.js';

const router = Router();

router.use(requireAuth);

router.get('/', workspacesController.list);
router.post('/', validate(createWorkspaceSchema), workspacesController.create);
router.get('/:id', workspacesController.getOne);
router.patch('/:id', validate(updateWorkspaceSchema), workspacesController.update);
router.delete('/:id', workspacesController.remove);
router.post('/:id/members', validate(addMemberSchema), workspacesController.addMember);
router.delete('/:id/members/:memberId', workspacesController.removeMember);

export default router;
