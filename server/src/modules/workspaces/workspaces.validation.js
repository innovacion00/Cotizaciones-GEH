import Joi from 'joi';

export const createWorkspaceSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  slug: Joi.string()
    .min(2)
    .max(60)
    .lowercase()
    .pattern(/^[a-z0-9-]+$/)
    .required(),
  settings: Joi.object({
    currency: Joi.string().max(10),
    locale: Joi.string().max(10),
    branding: Joi.object({
      logo: Joi.string().uri().allow(''),
      primaryColor: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/),
      companyName: Joi.string().max(100),
    }),
  }),
});

export const updateWorkspaceSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  settings: Joi.object({
    currency: Joi.string().max(10),
    locale: Joi.string().max(10),
    branding: Joi.object({
      logo: Joi.string().uri().allow(''),
      primaryColor: Joi.string().pattern(/^#[0-9a-fA-F]{6}$/),
      companyName: Joi.string().max(100),
    }),
  }),
});

export const addMemberSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  role: Joi.string().valid('admin', 'manager', 'sales').default('sales'),
});
