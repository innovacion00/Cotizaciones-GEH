import { env } from '../../config/env.js';

export function errorMiddleware(err, _req, res, _next) {
  if (err.isOperational) {
    return res.status(err.statusCode).json({ success: false, error: err.message, code: err.code });
  }

  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
    return res.status(422).json({ success: false, error: message, code: 'VALIDATION_ERROR' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || {})[0] || 'campo';
    return res
      .status(409)
      .json({ success: false, error: `${field} ya existe`, code: 'DUPLICATE_KEY' });
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, error: 'Token inválido', code: 'UNAUTHORIZED' });
  }

  console.error('[Error no operacional]', err);
  const message = env.NODE_ENV === 'development' ? err.message : 'Error interno del servidor';
  return res.status(500).json({ success: false, error: message, code: 'INTERNAL_ERROR' });
}
