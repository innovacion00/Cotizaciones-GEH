export class AppError extends Error {
  constructor(message, statusCode = 500, code = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} no encontrado`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message) {
    super(message, 422, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'No autorizado') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Acceso denegado') {
    super(message, 403, 'FORBIDDEN');
  }
}
