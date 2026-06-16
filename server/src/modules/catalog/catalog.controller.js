import * as catalogService from './catalog.service.js';
import { okResponse } from '../../shared/utils/index.js';

export async function listProducts(req, res, next) {
  try {
    const { page, limit, search } = req.query;
    const data = await catalogService.listProducts(req.params.workspaceId, req.user.sub, {
      page: parseInt(page || 1, 10),
      limit: parseInt(limit || 20, 10),
      search: search || '',
    });
    return okResponse(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getProduct(req, res, next) {
  try {
    const product = await catalogService.getProduct(
      req.params.productId,
      req.params.workspaceId,
      req.user.sub
    );
    return okResponse(res, { product });
  } catch (err) {
    return next(err);
  }
}

export async function createProduct(req, res, next) {
  try {
    const product = await catalogService.createProduct(
      req.params.workspaceId,
      req.user.sub,
      req.body
    );
    return okResponse(res, { product }, 201);
  } catch (err) {
    return next(err);
  }
}

export async function updateProduct(req, res, next) {
  try {
    const product = await catalogService.updateProduct(
      req.params.productId,
      req.params.workspaceId,
      req.user.sub,
      req.body
    );
    return okResponse(res, { product });
  } catch (err) {
    return next(err);
  }
}

export async function deleteProduct(req, res, next) {
  try {
    await catalogService.deleteProduct(req.params.productId, req.params.workspaceId, req.user.sub);
    return okResponse(res, { message: 'Producto desactivado' });
  } catch (err) {
    return next(err);
  }
}

export async function searchAutocore(req, res, next) {
  try {
    const { search, page, limit } = req.query;
    const data = await catalogService.searchAutocoreProducts(
      req.params.workspaceId,
      req.user.sub,
      { search, page: parseInt(page || 1, 10), limit: parseInt(limit || 20, 10) }
    );
    return okResponse(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function syncAutocore(req, res, next) {
  try {
    const product = await catalogService.syncAutocoreProduct(
      req.params.workspaceId,
      req.user.sub,
      req.body
    );
    return okResponse(res, { product }, 201);
  } catch (err) {
    return next(err);
  }
}
