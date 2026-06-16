import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { createQuoteSchema, updateQuoteSchema, updateItemsSchema } from './quotes.validation.js';
import * as quotesController from './quotes.controller.js';

const router = Router();

router.use(requireAuth);

// DECISION: workspaceId se pasa como query param ?workspaceId=<id>.
// Se guarda en req.workspaceId para evitar conflictos con req.params (que Express resetea por ruta).
router.use((req, _res, next) => {
  req.workspaceId = req.query.workspaceId || req.body.workspaceId;
  next();
});

router.get('/', quotesController.list);
router.post('/', validate(createQuoteSchema), quotesController.create);
router.get('/:id', quotesController.getOne);
router.patch('/:id', validate(updateQuoteSchema), quotesController.update);
router.patch('/:id/items', validate(updateItemsSchema), quotesController.updateItems);
router.post('/:id/send', quotesController.send);
router.delete('/:id', quotesController.remove);

export default router;
