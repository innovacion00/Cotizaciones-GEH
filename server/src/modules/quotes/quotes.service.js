import { nanoid } from 'nanoid';
import Quote from './quote.model.js';
import Workspace from '../workspaces/workspace.model.js';
import User from '../auth/user.model.js';
import { eventBus } from '../../shared/events/EventBus.js';
import { NotFoundError, ForbiddenError, AppError } from '../../shared/errors/AppError.js';
import { env } from '../../config/env.js';
import { sendQuoteEmail } from '../../shared/mail/mail.service.js';

function calculateTotals(items, taxRate = 0.16) {
  const subtotalBeforeDiscount = items.reduce((acc, item) => acc + item.unitPrice * item.qty, 0);
  const discountAmount = items.reduce(
    (acc, item) => acc + item.unitPrice * item.qty * (item.discount / 100),
    0
  );
  const subtotal = subtotalBeforeDiscount - discountAmount;
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return {
    subtotal: round2(subtotalBeforeDiscount),
    discount: round2(discountAmount),
    tax: round2(tax),
    total: round2(total),
  };
}

function computeItemSubtotals(items) {
  return items.map((item) => ({
    ...item,
    subtotal: round2(item.unitPrice * item.qty * (1 - item.discount / 100)),
  }));
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function assertWorkspaceMember(workspaceId, userId) {
  const ws = await Workspace.findOne({ _id: workspaceId, 'members.user': userId }).lean();
  if (!ws) throw new ForbiddenError('No tienes acceso a este workspace');
  return ws;
}

async function findQuote(quoteId, workspaceId, userId) {
  await assertWorkspaceMember(workspaceId, userId);
  const quote = await Quote.findOne({ _id: quoteId, workspace: workspaceId });
  if (!quote) throw new NotFoundError('Cotización');
  return quote;
}

export async function createQuote(workspaceId, userId, data) {
  await assertWorkspaceMember(workspaceId, userId);
  const items = computeItemSubtotals(data.items || []);
  const totals = calculateTotals(items, data.taxRate);
  return Quote.create({ ...data, workspace: workspaceId, owner: userId, items, totals });
}

export async function listQuotes(workspaceId, userId, { page = 1, limit = 20, status } = {}) {
  await assertWorkspaceMember(workspaceId, userId);
  const filter = { workspace: workspaceId };
  if (status) filter.status = status;

  const [quotes, total] = await Promise.all([
    Quote.find(filter)
      .populate('owner', 'name email')
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Quote.countDocuments(filter),
  ]);
  return { quotes, total, page, limit };
}

export async function getQuote(quoteId, workspaceId, userId) {
  return findQuote(quoteId, workspaceId, userId);
}

export async function updateQuote(quoteId, workspaceId, userId, data) {
  const quote = await findQuote(quoteId, workspaceId, userId);

  if (data.items !== undefined) {
    data.items = computeItemSubtotals(data.items);
    data.totals = calculateTotals(data.items, data.taxRate ?? quote.taxRate);
  }

  Object.assign(quote, data);
  quote.version += 1;
  return quote.save();
}

export async function updateItems(quoteId, workspaceId, userId, items) {
  const quote = await findQuote(quoteId, workspaceId, userId);
  const processedItems = computeItemSubtotals(items);
  quote.items = processedItems;
  quote.totals = calculateTotals(processedItems, quote.taxRate);
  quote.version += 1;
  return quote.save();
}

export async function sendQuote(quoteId, workspaceId, userId) {
  const quote = await findQuote(quoteId, workspaceId, userId);
  if (!['draft', 'rejected', 'expired', 'sent', 'viewed', 'accepted'].includes(quote.status)) {
    throw new AppError(`No se puede enviar una cotización con estado '${quote.status}'`, 422, 'INVALID_STATE');
  }

  if (!quote.client?.email?.trim()) {
    throw new AppError('El cliente no tiene email configurado', 422, 'NO_CLIENT_EMAIL');
  }

  if (!quote.publicToken) {
    quote.publicToken = nanoid(32);
  }

  const owner = await User.findById(userId).select('name').lean();
  const publicUrl = `${env.CLIENT_URL}/q/${quote.publicToken}`;

  await sendQuoteEmail({
    quote: quote.toObject(),
    publicUrl,
    senderName: owner?.name,
  });

  quote.status = 'sent';
  quote.version += 1;
  await quote.save();

  eventBus.emit('quote.sent', { quoteId: quote._id, workspaceId, ownerId: userId });
  return quote;
}

export async function deleteQuote(quoteId, workspaceId, userId) {
  const quote = await findQuote(quoteId, workspaceId, userId);
  await quote.deleteOne();
}

export async function getPublicQuote(publicToken) {
  const quote = await Quote.findOne({ publicToken })
    .populate('owner', 'name email')
    .populate('workspace', 'name settings')
    .lean();

  if (!quote) throw new NotFoundError('Cotización');

  if (quote.status === 'sent') {
    await Quote.updateOne({ _id: quote._id }, { $set: { status: 'viewed' } });
    eventBus.emit('quote.viewed', { quoteId: quote._id, workspaceId: quote.workspace._id, ownerId: quote.owner._id });
  }

  // Solo datos de presentación — nunca exponer costos internos ni IDs internos
  return {
    id: quote._id,
    status: quote.status,
    client: quote.client,
    items: quote.items.map((item) => ({
      _id: item._id,
      name: item.name,
      qty: item.qty,
      unitPrice: item.unitPrice,
      discount: item.discount,
      subtotal: item.subtotal,
      booking: item.booking || null,
    })),
    totals: quote.totals,
    notes: quote.notes,
    expiresAt: quote.expiresAt,
    createdAt: quote.createdAt,
    workspace: {
      name: quote.workspace?.name,
      branding: quote.workspace?.settings?.branding,
      currency: quote.workspace?.settings?.currency || 'MXN',
    },
    owner: { name: quote.owner?.name },
  };
}
