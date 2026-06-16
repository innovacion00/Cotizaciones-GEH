import { ValidationError } from '../errors/AppError.js';

export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const data = source === 'params' ? req.params : source === 'query' ? req.query : req.body;
    const { error, value } = schema.validate(data, { abortEarly: false, stripUnknown: true });
    if (error) {
      const message = error.details.map((d) => d.message).join('; ');
      return next(new ValidationError(message));
    }
    if (source === 'body') req.body = value;
    if (source === 'params') req.params = value;
    if (source === 'query') req.query = value;
    return next();
  };
}
