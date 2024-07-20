import { Injectable, UnauthorizedException } from '@nestjs/common';
import { jwtVerify, SignJWT } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { parse, serialize } from 'cookie';
import { SupabaseService } from '../../../common/supabase.service';

const ACCESS_SECRET_KEY = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET_KEY);
const REFRESH_SECRET_KEY = new TextEncoder().encode(process.env.JWT_REFRESH_SECRET_KEY);

@Injectable()
export class AuthService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async generateToken(userId: string | undefined, res: any) {
    let cartId: string;

    if (userId) {
      const { data: activeCart, error } = await this.supabaseService.getClient()
        .from('cart')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching active cart:', error);
        throw new Error('Unable to fetch active cart');
      }

      cartId = activeCart ? activeCart.id : uuidv4();

      if (!activeCart) {
        const { error: insertError } = await this.supabaseService.getClient()
          .from('cart')
          .insert([{ id: cartId, user_id: userId, is_active: true, status: 'active' }]);

        if (insertError) {
          console.error('Error creating new cart:', insertError);
          throw new Error('Unable to create a new cart');
        }
      }
    } else {
      cartId = uuidv4();
    }

    const accessToken = await new SignJWT({ cartId, userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('15m')
      .sign(ACCESS_SECRET_KEY);

    const refreshToken = await new SignJWT({ cartId, userId })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(REFRESH_SECRET_KEY);

    const accessSerializedCookie = serialize('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      maxAge: 15 * 60, // 15 mins
      sameSite: 'strict',
      path: '/',
    });

    const refreshSerializedCookie = serialize('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: 30 * 24 * 60 * 60, // 30 days
      sameSite: 'strict',
      path: '/',
    });

    res.setHeader('Set-Cookie', [accessSerializedCookie, refreshSerializedCookie]);
    return { message: 'Tokens generated', cartId };
  }

  async refreshToken(req: any, res: any) {
    const cookies = parse(req.headers.cookie || '');
    const refreshToken = cookies.refresh_token;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    try {
      const { payload } = await jwtVerify(refreshToken, REFRESH_SECRET_KEY);
      const cartId = payload.cartId as string;
      const userId = payload.userId as string;

      const newAccessToken = await new SignJWT({ cartId, userId })
        .setProtectedHeader({ alg: 'HS256' })
        .setExpirationTime('15m') // 15 minutes
        .sign(ACCESS_SECRET_KEY);

      res.setHeader('Set-Cookie', serialize('access_token', newAccessToken, {
        httpOnly: true,
        secure: true,
        maxAge: 15 * 60, // 15 mins
        sameSite: 'strict',
        path: '/',
      }));

      return { message: 'Access token refreshed' };
    } catch (error) {
      console.error('Invalid refresh token:', error);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  clearToken(res: any) {
    res.setHeader('Set-Cookie', [
      serialize('access_token', '', {
        httpOnly: true,
        secure: true,
        expires: new Date(0),
        sameSite: 'strict',
        path: '/',
      }),
      serialize('refresh_token', '', {
        httpOnly: true,
        secure: true,
        expires: new Date(0),
        sameSite: 'strict',
        path: '/',
      }),
    ]);

    return { message: 'Logged out' };
  }
}
