// src/modules/auth/services/user-token.service.ts

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { SupabaseService } from '../../common/supabase.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UserTokenService {
  private readonly accessSecretKey: string;
  private readonly refreshSecretKey: string;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecretKey = this.configService.get<string>('JWT_ACCESS_SECRET_KEY');
    this.refreshSecretKey = this.configService.get<string>('JWT_REFRESH_SECRET_KEY');
  }

  async generateToken(userId: string | undefined, res: Response): Promise<{ message: string; cartId: string }> {
    let cartId: string;

    if (userId) {
      const { data: activeCart, error } = await this.supabaseService.getClient()
        .from('cart')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        throw new Error('Unable to fetch active cart');
      }

      cartId = activeCart ? activeCart.id : uuidv4();

      if (!activeCart) {
        const { error: insertError } = await this.supabaseService.getClient()
          .from('cart')
          .insert([{ id: cartId, user_id: userId, is_active: true, status: 'active' }]);

        if (insertError) {
          throw new Error('Unable to create a new cart');
        }
      }
    } else {
      cartId = uuidv4();
    }

    const accessToken = this.jwtService.sign({ cartId, userId }, { secret: this.accessSecretKey, expiresIn: '15m' });
    const refreshToken = this.jwtService.sign({ cartId, userId }, { secret: this.refreshSecretKey, expiresIn: '30d' });

    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 15 * 60 * 1000, // 15 minutes
      sameSite: 'strict',
      path: '/',
    });

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: 'strict',
      path: '/',
    });

    return { message: 'Tokens generated', cartId };
  }

  async refreshToken(req: any, res: Response): Promise<string> {
    const cookies = req.cookies;
    const refreshToken = cookies.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    try {
      const { cartId, userId } = this.jwtService.verify(refreshToken, { secret: this.refreshSecretKey });

      const newAccessToken = this.jwtService.sign({ cartId, userId }, { secret: this.accessSecretKey, expiresIn: '15m' });

      res.cookie('access_token', newAccessToken, {
        httpOnly: true,
        secure: true,
        maxAge: 15 * 60 * 1000, // 15 minutes
        sameSite: 'strict',
        path: '/',
      });

      return newAccessToken;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  clearToken(res: Response): { message: string } {
    res.cookie('access_token', '', {
      httpOnly: true,
      secure: true,
      expires: new Date(0),
      sameSite: 'strict',
      path: '/',
    });

    res.cookie('refresh_token', '', {
      httpOnly: true,
      secure: true,
      expires: new Date(0),
      sameSite: 'strict',
      path: '/',
    });

    return { message: 'Logged out' };
  }
}
