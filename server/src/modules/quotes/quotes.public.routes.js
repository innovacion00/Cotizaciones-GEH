import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import * as quotesService from './quotes.service.js';
import { okResponse } from '../../shared/utils/index.js';

const router = Router();

const publicLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true });

router.get('/quotes/:token', publicLimiter, async (req, res, next) => {
  try {
    const data = await quotesService.getPublicQuote(req.params.token);
    return okResponse(res, data);
  } catch (err) {
    return next(err);
  }
});

export default router;
