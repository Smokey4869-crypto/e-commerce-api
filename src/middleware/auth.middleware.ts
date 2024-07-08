import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { jwtVerify } from 'jose';
import { parse } from 'cookie';

const ACCESS_SECRET_KEY = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET_KEY!);
const BASE_URL = process.env.BASE_URL;

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const publicPaths = [
      '/auth/google',
      '/auth/google/callback',
      '/auth/refresh_token',
      '/auth/generate_token',
    ];

    const originalUrl = req.originalUrl;

    console.log(`Original URL: ${originalUrl}`);

    if (publicPaths.some(p => originalUrl.startsWith(p))) {
      return next();
    }

    const cookies = parse(req.headers.cookie || '');
    const accessToken = cookies.access_token;
    const refreshToken = cookies.refresh_token;

    const redirectCount = parseInt(req.query.redirectCount as string) || 0;
    if (redirectCount >= 3) {
      console.log('Too many redirects');
      return res.status(500).json({ error: 'Too many redirects' });
    }

    if (!accessToken && !refreshToken) {
      console.log('No tokens found, redirecting to generate token');
      return res.redirect(`${BASE_URL}/auth/generate_token?redirectCount=${redirectCount + 1}`);
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

      if (refreshToken) {
        console.log('Access token invalid, redirecting to refresh token');
        return res.redirect(`${BASE_URL}/auth/refresh_token?redirectCount=${redirectCount + 1}`);
      } else {
        console.log('No refresh token found, redirecting to generate token');
        return res.redirect(`${BASE_URL}/auth/generate_token?redirectCount=${redirectCount + 1}`);
      }
    }
  }
}
