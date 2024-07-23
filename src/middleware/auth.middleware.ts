import {
  HttpException,
  HttpStatus,
  Injectable,
  NestMiddleware,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { jwtVerify } from 'jose';
import { parse } from 'cookie';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly accessSecretKey: Uint8Array;
  constructor(private configService: ConfigService) {
    const secretKey = this.configService.get<string>('JWT_ACCESS_SECRET_KEY');
    if (!secretKey) {
      throw new HttpException(
        'JWT_ACCESS_SECRET_KEY is not defined',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
    this.accessSecretKey = new TextEncoder().encode(secretKey);
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const BASE_URL = this.configService.get<string>('BASE_URL'); // Use ConfigService to get BASE_URL

    const publicPaths = [
      '/user/auth/google',
      '/user/auth/google/callback',
      '/user/auth/refresh_token',
      '/user/auth/generate_token',
      '/user/webhook/stripe',
    ];

    const originalUrl = req.originalUrl;

    // console.log(`Original URL: ${originalUrl}`);
    // console.log(`BASE_URL: ${BASE_URL}`); // Debugging BASE_URL

    if (!BASE_URL) {
      console.error('BASE_URL is not defined');
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    // Skip token validation for public paths and static assets
    if (
      publicPaths.some((p) => originalUrl.startsWith(p)) ||
      originalUrl === '/' ||
      originalUrl.startsWith('/favicon.ico')
    ) {
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
      return res.redirect(
        `${BASE_URL}/user/auth/generate_token?redirectCount=${redirectCount + 1}`,
      );
    }

    try {
      const { payload: accessPayload } = await jwtVerify(
        accessToken,
        this.accessSecretKey,
      );
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
        return res.redirect(
          `${BASE_URL}/user/auth/refresh_token?redirectCount=${redirectCount + 1}`,
        );
      } else {
        console.log('No refresh token found, redirecting to generate token');
        return res.redirect(
          `${BASE_URL}/user/auth/generate_token?redirectCount=${redirectCount + 1}`,
        );
      }
    }
  }
}
