import request from 'supertest';
import app from '../app.js';
import { setupTestDB, teardownTestDB, clearCollections } from './setup.js';

beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await teardownTestDB();
});

afterEach(async () => {
  await clearCollections();
});

describe('POST /api/v1/auth/register', () => {
  it('registra un usuario nuevo y devuelve accessToken', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana López', email: 'ana@test.com', password: 'segura123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.user.email).toBe('ana@test.com');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rechaza email duplicado con 409', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ana', email: 'dup@test.com', password: 'segura123' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Otro', email: 'dup@test.com', password: 'segura123' });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('rechaza payload inválido (sin nombre) con 422', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'bad@test.com', password: 'abc' });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/v1/auth/login', () => {
  it('devuelve accessToken con credenciales correctas', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Carlos', email: 'carlos@test.com', password: 'clave456' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'carlos@test.com', password: 'clave456' });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
  });

  it('rechaza credenciales incorrectas con 401', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Marta', email: 'marta@test.com', password: 'correcta' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'marta@test.com', password: 'incorrecta' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/v1/auth/me', () => {
  it('devuelve el usuario autenticado', async () => {
    const reg = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Luis', email: 'luis@test.com', password: 'pass123' });

    const token = reg.body.data.accessToken;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe('luis@test.com');
  });

  it('rechaza petición sin token con 401', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
  });
});
