import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from './config/env.js';
import User from './modules/auth/user.model.js';
import Workspace from './modules/workspaces/workspace.model.js';
import Product from './modules/catalog/product.model.js';
import Quote from './modules/quotes/quote.model.js';

async function seed() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Conectado a MongoDB. Limpiando datos previos del seed...');

  await User.deleteMany({ email: 'demo@cotizador.com' });

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const user = await User.create({
    name: 'Usuario Demo',
    email: 'demo@cotizador.com',
    passwordHash,
    role: 'admin',
  });

  const workspace = await Workspace.create({
    name: 'Empresa Demo',
    slug: 'empresa-demo',
    owner: user._id,
    members: [{ user: user._id, role: 'admin' }],
    settings: { currency: 'MXN', locale: 'es-MX', branding: { companyName: 'Empresa Demo' } },
  });

  user.workspaces.push(workspace._id);
  await user.save();

  const productsData = [
    { name: 'Aceite de Motor 5W-30', sku: 'ACE-5W30', basePrice: 250, unit: 'lt', description: 'Aceite sintético para motor', stock: 50 },
    { name: 'Filtro de Aceite Estándar', sku: 'FIL-ACE-01', basePrice: 80, unit: 'pza', description: 'Filtro compatible con vehículos estándar', stock: 100 },
    { name: 'Pastillas de Freno Delanteras', sku: 'PAS-FRE-DEL', basePrice: 420, unit: 'juego', description: 'Juego de 4 pastillas delanteras', stock: 30 },
    { name: 'Batería 45Ah', sku: 'BAT-45AH', basePrice: 1200, unit: 'pza', description: 'Batería libre de mantenimiento', stock: 15 },
    { name: 'Limpiaparabrisas 600mm', sku: 'LIM-600', basePrice: 150, unit: 'par', description: 'Par de plumas limpiaparabrisas', stock: 40 },
  ];

  const products = await Product.insertMany(
    productsData.map((p) => ({ ...p, workspace: workspace._id, source: 'manual', active: true }))
  );

  function makeItem(product, qty, discount = 0) {
    const subtotal = product.basePrice * qty * (1 - discount / 100);
    return {
      product: product._id,
      name: product.name,
      qty,
      unitPrice: product.basePrice,
      discount,
      subtotal: Math.round(subtotal * 100) / 100,
    };
  }

  function makeTotals(items, taxRate = 0.16) {
    const sub = items.reduce((a, i) => a + i.unitPrice * i.qty, 0);
    const disc = items.reduce((a, i) => a + i.unitPrice * i.qty * (i.discount / 100), 0);
    const net = sub - disc;
    const tax = net * taxRate;
    return {
      subtotal: Math.round(sub * 100) / 100,
      discount: Math.round(disc * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round((net + tax) * 100) / 100,
    };
  }

  const items1 = [makeItem(products[0], 4), makeItem(products[1], 2)];
  const items2 = [makeItem(products[2], 1), makeItem(products[3], 1, 5), makeItem(products[4], 2)];

  await Quote.insertMany([
    {
      workspace: workspace._id,
      owner: user._id,
      client: { name: 'Taller Rápido SA', email: 'compras@tallerrapido.com', phone: '55-1234-5678', company: 'Taller Rápido SA de CV' },
      status: 'sent',
      publicToken: 'demo-token-taller-rapido-abc123',
      items: items1,
      totals: makeTotals(items1),
      taxRate: 0.16,
      notes: 'Cotización mensual de consumibles',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      workspace: workspace._id,
      owner: user._id,
      client: { name: 'Flota Ejecutiva', email: 'flotaejecutiva@corp.mx', company: 'Corp Ejecutiva SA' },
      status: 'draft',
      items: items2,
      totals: makeTotals(items2),
      taxRate: 0.16,
      notes: 'Revisión de frenos y batería para flotilla',
    },
  ]);

  console.log('\n✅ Seed completado:');
  console.log(`   Usuario: demo@cotizador.com / demo1234`);
  console.log(`   Workspace: empresa-demo (${workspace._id})`);
  console.log(`   Productos: ${products.length}`);
  console.log(`   Cotizaciones: 2 (1 enviada, 1 borrador)`);
  console.log(`   Vista pública demo: http://localhost:3000/api/v1/public/quotes/demo-token-taller-rapido-abc123`);

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('Error en seed:', err);
  process.exit(1);
});
