import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './user.model.js';
import { env } from '../../config/env.js';
import { AppError, UnauthorizedError } from '../../shared/errors/AppError.js';

const ACCESS_EXPIRY = '15m';
const REFRESH_EXPIRY = '7d';
const BCRYPT_ROUNDS = 10;

function generateTokens(userId, role) {
  const payload = { sub: userId, role };
  const accessToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: ACCESS_EXPIRY });
  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });
  return { accessToken, refreshToken };
}

export async function registerUser({ name, email, password, role }) {
  const existing = await User.findOne({ email });
  if (existing) throw new AppError('El email ya está registrado', 409, 'DUPLICATE_EMAIL');

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role });

  const tokens = generateTokens(user._id.toString(), user.role);
  return { user: { id: user._id, name: user.name, email: user.email, role: user.role }, ...tokens };
}

export async function loginUser({ email, password }) {
  const user = await User.findOne({ email });
  if (!user) throw new UnauthorizedError('Credenciales inválidas');

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new UnauthorizedError('Credenciales inválidas');

  const tokens = generateTokens(user._id.toString(), user.role);
  return { user: { id: user._id, name: user.name, email: user.email, role: user.role }, ...tokens };
}

export async function refreshAccessToken(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new UnauthorizedError('Refresh token inválido o expirado');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw new UnauthorizedError('Usuario no encontrado');

  const tokens = generateTokens(user._id.toString(), user.role);
  return { user: { id: user._id, name: user.name, email: user.email, role: user.role }, ...tokens };
}

export async function getUserById(id) {
  const user = await User.findById(id).select('-passwordHash');
  if (!user) throw new UnauthorizedError('Usuario no encontrado');
  return user;
}
