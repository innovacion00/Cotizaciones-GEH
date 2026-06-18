import { jest } from '@jest/globals';

const sendQuoteEmailMock = jest.fn().mockResolvedValue(undefined);

jest.unstable_mockModule('../shared/mail/mail.service.js', () => ({
  sendQuoteEmail: sendQuoteEmailMock,
}));

const { default: request } = await import('supertest');
const { default: app } = await import('../app.js');
const { setupTestDB, teardownTestDB, clearCollections } = await import('./setup.js');

let token;
let workspaceId;

beforeAll(async () => {
  await setupTestDB();
}, 120000);

afterAll(async () => {
  await teardownTestDB();
});

beforeEach(async () => {
  await clearCollections();
  sendQuoteEmailMock.mockClear();

  const reg = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Vendedor', email: 'vendedor@test.com', password: 'pass1234', role: 'admin' });

  token = reg.body.data.accessToken;

  const wsRes = await request(app)
    .post('/api/v1/workspaces')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Mi Empresa', slug: 'mi-empresa' });

  workspaceId = wsRes.body.data.workspace._id;
});

describe('POST /api/v1/quotes', () => {
  it('crea una cotización en estado draft', async () => {
    const res = await request(app)
      .post('/api/v1/quotes')
      .query({ workspaceId })
      .set('Authorization', `Bearer ${token}`)
      .send({
        client: { name: 'Cliente Uno', email: 'cliente@test.com' },
        items: [{ name: 'Producto A', qty: 2, unitPrice: 100, discount: 10 }],
        taxRate: 0.16,
      });

    expect(res.status).toBe(201);
    expect(res.body.data.quote.status).toBe('draft');
    expect(res.body.data.quote.totals.total).toBeGreaterThan(0);
    expect(res.body.data.quote.publicToken).toBeUndefined();
  });

  it('rechaza cotización sin cliente con 422', async () => {
    const res = await request(app)
      .post('/api/v1/quotes')
      .query({ workspaceId })
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [] });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/quotes/:id/send', () => {
  it('genera publicToken, cambia estado a sent y envía correo', async () => {
    const create = await request(app)
      .post('/api/v1/quotes')
      .query({ workspaceId })
      .set('Authorization', `Bearer ${token}`)
      .send({ client: { name: 'Cliente B', email: 'cliente-b@test.com' }, items: [], taxRate: 0.16 });

    const quoteId = create.body.data.quote._id;

    const send = await request(app)
      .post(`/api/v1/quotes/${quoteId}/send`)
      .query({ workspaceId })
      .set('Authorization', `Bearer ${token}`);

    expect(send.status).toBe(200);
    expect(send.body.data.quote.status).toBe('sent');
    expect(send.body.data.quote.publicToken).toBeTruthy();
    expect(sendQuoteEmailMock).toHaveBeenCalledTimes(1);
  });

  it('rechaza envío si el cliente no tiene email', async () => {
    const create = await request(app)
      .post('/api/v1/quotes')
      .query({ workspaceId })
      .set('Authorization', `Bearer ${token}`)
      .send({ client: { name: 'Sin Email' }, items: [], taxRate: 0.16 });

    const quoteId = create.body.data.quote._id;

    const send = await request(app)
      .post(`/api/v1/quotes/${quoteId}/send`)
      .query({ workspaceId })
      .set('Authorization', `Bearer ${token}`);

    expect(send.status).toBe(422);
    expect(send.body.error).toMatch(/email/i);
    expect(sendQuoteEmailMock).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/v1/quotes/:id', () => {
  it('elimina la cotización', async () => {
    const create = await request(app)
      .post('/api/v1/quotes')
      .query({ workspaceId })
      .set('Authorization', `Bearer ${token}`)
      .send({ client: { name: 'Cliente D', email: 'd@test.com' }, items: [], taxRate: 0.16 });

    const quoteId = create.body.data.quote._id;

    const del = await request(app)
      .delete(`/api/v1/quotes/${quoteId}`)
      .query({ workspaceId })
      .set('Authorization', `Bearer ${token}`);

    expect(del.status).toBe(200);

    const get = await request(app)
      .get(`/api/v1/quotes/${quoteId}`)
      .query({ workspaceId })
      .set('Authorization', `Bearer ${token}`);

    expect(get.status).toBe(404);
  });
});

describe('GET /api/v1/public/quotes/:token', () => {
  it('devuelve datos de presentación sin información interna', async () => {
    const create = await request(app)
      .post('/api/v1/quotes')
      .query({ workspaceId })
      .set('Authorization', `Bearer ${token}`)
      .send({
        client: { name: 'Cliente Público', company: 'ACME', email: 'publico@test.com' },
        items: [{ name: 'Servicio', qty: 1, unitPrice: 500 }],
        taxRate: 0.16,
      });

    const quoteId = create.body.data.quote._id;

    const send = await request(app)
      .post(`/api/v1/quotes/${quoteId}/send`)
      .query({ workspaceId })
      .set('Authorization', `Bearer ${token}`);

    const publicToken = send.body.data.quote.publicToken;

    const pub = await request(app).get(`/api/v1/public/quotes/${publicToken}`);

    expect(pub.status).toBe(200);
    expect(pub.body.data.client.name).toBe('Cliente Público');
    expect(pub.body.data.workspace.name).toBeDefined();
    expect(pub.body.data._id).toBeUndefined();
  });

  it('devuelve 404 para token inexistente', async () => {
    const res = await request(app).get('/api/v1/public/quotes/token-que-no-existe-12345');
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/quotes/:id/items', () => {
  it('recalcula totales al actualizar líneas', async () => {
    const create = await request(app)
      .post('/api/v1/quotes')
      .query({ workspaceId })
      .set('Authorization', `Bearer ${token}`)
      .send({ client: { name: 'Cliente C' }, items: [], taxRate: 0.16 });

    const quoteId = create.body.data.quote._id;

    const update = await request(app)
      .patch(`/api/v1/quotes/${quoteId}/items`)
      .query({ workspaceId })
      .set('Authorization', `Bearer ${token}`)
      .send({ items: [{ name: 'Producto X', qty: 3, unitPrice: 200, discount: 0 }] });

    expect(update.status).toBe(200);
    expect(update.body.data.quote.totals.subtotal).toBe(600);
    expect(update.body.data.quote.totals.tax).toBeCloseTo(96, 0);
    expect(update.body.data.quote.totals.total).toBeCloseTo(696, 0);
  });
});
