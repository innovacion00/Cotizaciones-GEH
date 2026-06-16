import Joi from 'joi';

export const createProductSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).allow('').default(''),
  sku: Joi.string().max(100).allow(''),
  basePrice: Joi.number().min(0).required(),
  unit: Joi.string().max(20).default('pza'),
  variants: Joi.array().items(
    Joi.object({ name: Joi.string().required(), priceDelta: Joi.number().default(0) })
  ).default([]),
  stock: Joi.number().min(0).default(0),
  active: Joi.boolean().default(true),
});

export const updateProductSchema = Joi.object({
  name: Joi.string().min(1).max(200),
  description: Joi.string().max(1000).allow(''),
  sku: Joi.string().max(100).allow(''),
  basePrice: Joi.number().min(0),
  unit: Joi.string().max(20),
  variants: Joi.array().items(
    Joi.object({ name: Joi.string().required(), priceDelta: Joi.number().default(0) })
  ),
  stock: Joi.number().min(0),
  active: Joi.boolean(),
});

export const autocoreQuerySchema = Joi.object({
  search: Joi.string().max(200).allow('').default(''),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
