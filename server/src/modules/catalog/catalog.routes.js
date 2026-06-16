import { Router } from 'express';
import { requireAuth } from '../../shared/middlewares/auth.middleware.js';
import { validate } from '../../shared/middlewares/validate.middleware.js';
import { createProductSchema, updateProductSchema, autocoreQuerySchema } from './catalog.validation.js';
import * as catalogController from './catalog.controller.js';

const router = Router({ mergeParams: true });

router.use(requireAuth);

// Rutas montadas bajo /api/v1/workspaces/:workspaceId/products
router.get('/:workspaceId/products', catalogController.listProducts);
router.post('/:workspaceId/products', validate(createProductSchema), catalogController.createProduct);
router.get('/:workspaceId/products/autocore', validate(autocoreQuerySchema, 'query'), catalogController.searchAutocore);
router.post('/:workspaceId/products/autocore/sync', catalogController.syncAutocore);
router.get('/:workspaceId/products/:productId', catalogController.getProduct);
router.patch('/:workspaceId/products/:productId', validate(updateProductSchema), catalogController.updateProduct);
router.delete('/:workspaceId/products/:productId', catalogController.deleteProduct);

export default router;
