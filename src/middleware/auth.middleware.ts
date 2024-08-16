import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { parse } from 'cookie';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly accessSecretKey: string;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecretKey = this.configService.get<string>(
      'JWT_ACCESS_SECRET_KEY',
    );
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const publicPaths = [
      '/user/auth/google',
      '/user/auth/google/callback',
      '/user/auth/refresh_token',
      '/user/auth/generate_token',
      '/admin/auth',
      '/user/webhook/stripe',
    ];

    const originalUrl = req.originalUrl;

    // Skip token validation for public paths
    if (publicPaths.some((p) => originalUrl.startsWith(p))) {
      return next();
    }

    const cookies = parse(req.headers.cookie || '');
    const accessToken = cookies.access_token;
    const refreshToken = cookies.refresh_token;

    if (!accessToken && !refreshToken) {
      if (originalUrl.startsWith('/admin')) {
        return res.status(401).json({
          message: 'Admin session expired, please log in again',
          requiresLogin: true, // Indicates the client should redirect to login
        });
      } else {
        throw new UnauthorizedException({
          message: 'User token missing, please generate a new token',
          requiresToken: true, // Indicates the client should handle token generation
        });
      }
    }

    try {
      const payload = this.jwtService.verify(accessToken, {
        secret: this.accessSecretKey,
      });

      // Attach user information to the request object
      req['user'] = {
        userId: payload.userId,
        roles: payload.roles || [], // If roles are present, attach them
        cartId: payload.cartId || undefined, // Attach cartId if it's a normal user
      };

      next();
    } catch (error) {
      console.error('Access token expired or invalid: ', error);

      if (refreshToken && !originalUrl.startsWith('/admin')) {
        throw new UnauthorizedException({
          message: 'Access token expired, please refresh the token',
          requiresRefresh: true, // Indicates the client should handle token refresh
        });
      } else {
        if (originalUrl.startsWith('/admin')) {
          return res.status(401).json({
            message: 'Admin session expired, please log in again',
            requiresLogin: true,
          });
        } else {
          throw new UnauthorizedException({
            message: 'No valid tokens found, please generate a new token',
            requiresToken: true, // Indicates the client should handle token generation
          });
        }
      }
    }
  }
}
