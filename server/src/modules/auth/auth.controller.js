import * as authService from './auth.service.js';
import { okResponse } from '../../shared/utils/index.js';

const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth/refresh',
};

export async function register(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.registerUser(req.body);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    return okResponse(res, { user, accessToken }, 201);
  } catch (err) {
    return next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.loginUser(req.body);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    return okResponse(res, { user, accessToken });
  } catch (err) {
    return next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ success: false, error: 'Refresh token no encontrado', code: 'UNAUTHORIZED' });
    }
    const { user, accessToken, refreshToken } = await authService.refreshAccessToken(token);
    res.cookie('refreshToken', refreshToken, REFRESH_COOKIE_OPTS);
    return okResponse(res, { user, accessToken });
  } catch (err) {
    return next(err);
  }
}

export async function me(req, res, next) {
  try {
    const user = await authService.getUserById(req.user.sub);
    return okResponse(res, { user });
  } catch (err) {
    return next(err);
  }
}

export function logout(_req, res) {
  res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
  return okResponse(res, { message: 'Sesión cerrada' });
}
