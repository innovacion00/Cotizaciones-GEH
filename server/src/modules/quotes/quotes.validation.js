import Joi from 'joi';

const bookingSchema = Joi.object({
  city: Joi.string(),
  hotelId: Joi.string(),
  hotelName: Joi.string(),
  roomId: Joi.string().allow(null),
  roomName: Joi.string(),
  checkin: Joi.string(),
  checkout: Joi.string(),
  nights: Joi.number(),
  adults: Joi.number(),
  childrenAges: Joi.array().items(Joi.number()),
  boardTypeDescription: Joi.string().allow('', null),
  refundable: Joi.string().allow('', null),
  cancellationPolicy: Joi.string().allow('', null),
  currency: Joi.string(),
  trm: Joi.number().allow(null),
  bankAccountKey: Joi.string().allow('', null),
}).unknown(true);

const itemSchema = Joi.object({
  product: Joi.string().hex().length(24).allow(null),
  name: Joi.string().min(1).max(200).required(),
  qty: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().min(0).required(),
  discount: Joi.number().min(0).max(100).default(0),
  booking: bookingSchema.optional(),
});

export const createQuoteSchema = Joi.object({
  client: Joi.object({
    name: Joi.string().min(1).max(200).required(),
    email: Joi.string().email().allow('', null),
    phone: Joi.string().max(30).allow('', null),
    company: Joi.string().max(200).allow('', null),
  }).required(),
  items: Joi.array().items(itemSchema).default([]),
  notes: Joi.string().max(2000).allow('').default(''),
  taxRate: Joi.number().min(0).max(1).default(0.16),
  expiresAt: Joi.date().iso().allow(null),
});

export const updateQuoteSchema = Joi.object({
  client: Joi.object({
    name: Joi.string().min(1).max(200),
    email: Joi.string().email().allow('', null),
    phone: Joi.string().max(30).allow('', null),
    company: Joi.string().max(200).allow('', null),
  }),
  items: Joi.array().items(itemSchema),
  notes: Joi.string().max(2000).allow(''),
  taxRate: Joi.number().min(0).max(1),
  expiresAt: Joi.date().iso().allow(null),
  status: Joi.string().valid('draft', 'sent', 'viewed', 'accepted', 'rejected', 'expired', 'archived'),
});

export const updateItemsSchema = Joi.object({
  items: Joi.array().items(itemSchema).required(),
});
