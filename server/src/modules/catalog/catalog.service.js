import Product from './product.model.js';
import Workspace from '../workspaces/workspace.model.js';
import { env } from '../../config/env.js';
import { NotFoundError, ForbiddenError, AppError } from '../../shared/errors/AppError.js';

// DECISION: La API de autocore no está documentada en los archivos de arquitectura.
// Se asume que expone un endpoint GET /availability?search=<query>&page=<n>&limit=<n>
// y retorna { items: [{ id, name, sku, price, stock, description }], total }.
// La URL y key se configuran por env AUTOCORE_API_URL y AUTOCORE_API_KEY.
// Si las variables no están configuradas se devuelve lista vacía sin error.

async function autocoreQuery({ search = '', page = 1, limit = 20 }) {
  if (!env.AUTOCORE_API_URL) return { items: [], total: 0 };

  const url = new URL('/availability', env.AUTOCORE_API_URL);
  url.searchParams.set('search', search);
  url.searchParams.set('page', page);
  url.searchParams.set('limit', limit);

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${env.AUTOCORE_API_KEY}` },
  });

  if (!res.ok) throw new AppError(`Error en API autocore: ${res.status}`, 502, 'UPSTREAM_ERROR');
  return res.json();
}

function mapAutocoreItem(item, workspaceId) {
  return {
    workspace: workspaceId,
    externalId: String(item.id),
    name: item.name || item.description || 'Sin nombre',
    description: item.description || '',
    sku: item.sku || item.part_number || '',
    basePrice: parseFloat(item.price || item.unitPrice || 0),
    unit: item.unit || 'pza',
    stock: parseInt(item.stock || item.availability || 0, 10),
    source: 'autocore',
    rawData: item,
    active: true,
  };
}

export async function searchAutocoreProducts(workspaceId, userId, query) {
  await assertWorkspaceMember(workspaceId, userId);
  const { items, total } = await autocoreQuery(query);
  return {
    products: items.map((i) => mapAutocoreItem(i, workspaceId)),
    total,
    source: 'autocore',
  };
}

export async function syncAutocoreProduct(workspaceId, userId, externalData) {
  await assertWorkspaceMember(workspaceId, userId);
  const data = mapAutocoreItem(externalData, workspaceId);
  const product = await Product.findOneAndUpdate(
    { workspace: workspaceId, externalId: data.externalId },
    { $set: data },
    { upsert: true, new: true }
  );
  return product;
}

export async function listProducts(workspaceId, userId, { page = 1, limit = 20, search = '' } = {}) {
  await assertWorkspaceMember(workspaceId, userId);
  const filter = { workspace: workspaceId, active: true };
  if (search) filter.name = { $regex: search, $options: 'i' };

  const [products, total] = await Promise.all([
    Product.find(filter)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Product.countDocuments(filter),
  ]);
  return { products, total, page, limit };
}

export async function getProduct(productId, workspaceId, userId) {
  await assertWorkspaceMember(workspaceId, userId);
  const product = await Product.findOne({ _id: productId, workspace: workspaceId }).lean();
  if (!product) throw new NotFoundError('Producto');
  return product;
}

export async function createProduct(workspaceId, userId, data) {
  await assertWorkspaceMember(workspaceId, userId);
  return Product.create({ ...data, workspace: workspaceId, source: 'manual' });
}

export async function updateProduct(productId, workspaceId, userId, data) {
  await assertWorkspaceMember(workspaceId, userId);
  const product = await Product.findOneAndUpdate(
    { _id: productId, workspace: workspaceId },
    { $set: data },
    { new: true }
  );
  if (!product) throw new NotFoundError('Producto');
  return product;
}

export async function deleteProduct(productId, workspaceId, userId) {
  await assertWorkspaceMember(workspaceId, userId);
  const product = await Product.findOneAndUpdate(
    { _id: productId, workspace: workspaceId },
    { $set: { active: false } },
    { new: true }
  );
  if (!product) throw new NotFoundError('Producto');
}

async function assertWorkspaceMember(workspaceId, userId) {
  const ws = await Workspace.findOne({ _id: workspaceId, 'members.user': userId }).lean();
  if (!ws) throw new ForbiddenError('No tienes acceso a este workspace');
}
