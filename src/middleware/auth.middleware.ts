import {
    Injectable,
    NestMiddleware,
    UnauthorizedException,
    ForbiddenException,
  } from '@nestjs/common';
  import { NextFunction, Request, Response } from 'express';
  import { JwtService } from '@nestjs/jwt';
  import { ConfigService } from '@nestjs/config';
  
  @Injectable()
  export class AuthMiddleware implements NestMiddleware {
    private readonly accessSecretKey: string;
  
    constructor(
      private readonly jwtService: JwtService,
      private readonly configService: ConfigService,
    ) {
      this.accessSecretKey = this.configService.get<string>('JWT_ACCESS_SECRET_KEY');
    }
  
    async use(req: Request, res: Response, next: NextFunction) {
      const publicPaths = [
        '/user/auth/google',
        '/user/auth/google/callback',
        '/user/auth/refresh_token',
        '/user/auth/generate_token',
        '/user/webhook/stripe',
      ];
  
      const originalUrl = req.originalUrl;
  
      // Skip token validation for public paths
      if (publicPaths.some((p) => originalUrl.startsWith(p))) {
        return next();
      }
  
      const token = req.cookies['access_token'];
  
      if (!token) {
        throw new UnauthorizedException('No access token found');
      }
  
      try {
        const payload = this.jwtService.verify(token, { secret: this.accessSecretKey });
  
        // Attach user information to the request object
        req['user'] = {
          userId: payload.userId,
          roles: payload.roles || [], // If roles are present, attach them
          cartId: payload.cartId || undefined, // Attach cartId if it's a normal user
        };
  
        next();
      } catch (error) {
        throw new UnauthorizedException('Invalid or expired access token');
      }
    }
  }
  