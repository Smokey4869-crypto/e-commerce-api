import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { jwtVerify } from 'jose';
import { parse } from 'cookie';

const ACCESS_SECRET_KEY = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET_KEY!);
const REFRESH_SECRET_KEY = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET_KEY!);
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const publicPaths = [
      '/auth/google',
      '/auth/google/callback',
      '/auth/refresh_token',
      '/auth/generate_token',
    ];

    const path = req.path;

    console.log('Request path:', path);

    if (publicPaths.some(p => path.startsWith(p))) {
      console.log('Public path, bypassing middleware:', path);
      return next();
    }

    const cookies = parse(req.headers.cookie || '');
    const accessToken = cookies.access_cookie;
    const refreshToken = cookies.refresh_cookie;

    console.log('Access Token:', accessToken);
    console.log('Refresh Token:', refreshToken);

    if (!accessToken && !refreshToken) {
      console.log('No tokens found, redirecting to generate token');
      return res.redirect(`${BASE_URL}/auth/generate_token`);
    }

    try {
      const { payload: accessPayload } = await jwtVerify(accessToken, ACCESS_SECRET_KEY);
      const { cartId, userId } = accessPayload as any;

      console.log('Access Token Valid:', accessPayload);

      if (userId) {
        req.headers['x-user-id'] = userId as string;
      }
      if (cartId) {
        req.headers['x-cart-id'] = cartId as string;
      }

      return next();
    } catch (accessError) {
      console.error('Access token expired or invalid:', accessError);

      if (!refreshToken) {
        console.log('No refresh token found, redirecting to generate token');
        return res.redirect(`${BASE_URL}/auth/generate_token`);
      }

      try {
        const { payload: refreshPayload } = await jwtVerify(refreshToken, REFRESH_SECRET_KEY);
        return next();
      } catch (refreshError) {
        console.error('Refresh token invalid:', refreshError);
        return res.redirect(`${BASE_URL}/auth/generate_token`);
      }
    }
  }
}
