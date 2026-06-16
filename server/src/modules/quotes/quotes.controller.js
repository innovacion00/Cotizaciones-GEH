import * as quotesService from './quotes.service.js';
import { okResponse } from '../../shared/utils/index.js';

export async function create(req, res, next) {
  try {
    const quote = await quotesService.createQuote(req.workspaceId, req.user.sub, req.body);
    return okResponse(res, { quote }, 201);
  } catch (err) {
    return next(err);
  }
}

export async function list(req, res, next) {
  try {
    const { page, limit, status } = req.query;
    const data = await quotesService.listQuotes(req.workspaceId, req.user.sub, {
      page: parseInt(page || 1, 10),
      limit: parseInt(limit || 20, 10),
      status,
    });
    return okResponse(res, data);
  } catch (err) {
    return next(err);
  }
}

export async function getOne(req, res, next) {
  try {
    const quote = await quotesService.getQuote(req.params.id, req.workspaceId, req.user.sub);
    return okResponse(res, { quote });
  } catch (err) {
    return next(err);
  }
}

export async function update(req, res, next) {
  try {
    const quote = await quotesService.updateQuote(req.params.id, req.workspaceId, req.user.sub, req.body);
    return okResponse(res, { quote });
  } catch (err) {
    return next(err);
  }
}

export async function updateItems(req, res, next) {
  try {
    const quote = await quotesService.updateItems(req.params.id, req.workspaceId, req.user.sub, req.body.items);
    return okResponse(res, { quote });
  } catch (err) {
    return next(err);
  }
}

export async function send(req, res, next) {
  try {
    const quote = await quotesService.sendQuote(req.params.id, req.workspaceId, req.user.sub);
    return okResponse(res, { quote });
  } catch (err) {
    return next(err);
  }
}

export async function remove(req, res, next) {
  try {
    await quotesService.deleteQuote(req.params.id, req.workspaceId, req.user.sub);
    return okResponse(res, { message: 'Cotización eliminada' });
  } catch (err) {
    return next(err);
  }
}
