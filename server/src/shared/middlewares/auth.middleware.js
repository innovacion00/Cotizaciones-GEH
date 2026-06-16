import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { UnauthorizedError, ForbiddenError } from '../errors/AppError.js';

export function requireAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de acceso requerido'));
  }
  const token = authHeader.slice(7);
  try {
    req.user = jwt.verify(token, env.JWT_SECRET);
    return next();
  } catch {
    return next(new UnauthorizedError('Token inválido o expirado'));
  }
}

export function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new UnauthorizedError());
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError(`Se requiere rol: ${roles.join(' o ')}`));
    }
    return next();
  };
}
