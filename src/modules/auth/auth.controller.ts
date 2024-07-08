import { Controller, Get, Post, Query, Body, Req, Res, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { Response, Request } from 'express';
import axios from 'axios';
import { SupabaseService } from '../../common/supabase.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly authService: AuthService,
  ) {}

  @Get('google')
  async signInWithGoogle(@Res() res: Response) {
    const { data, error } = await this.supabaseService.getClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: process.env.GOOGLE_REDIRECT_URL,
      },
    });

    if (error) {
      console.error('Error initiating OAuth:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('Redirecting to Google consent page:', data.url);
    res.redirect(data.url);
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      console.error('Authorization code is missing');
      throw new BadRequestException('Code must be provided');
    }

    try {
      const { data } = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URL,
        grant_type: 'authorization_code',
      });

      console.log('Token response from Google:', data);

      const { access_token, id_token } = data;

      // Verify the id_token with Supabase
      const { data: userData, error } = await this.supabaseService.getClient().auth.getUser(id_token);

      if (error) {
        console.error('Error verifying id_token with Supabase:', error);
        return res.status(400).json({ error: error.message });
      }

      console.log('User data from Supabase:', userData);
      res.json(userData);
    } catch (error) {
      console.error('Error handling OAuth callback:', error);
      return res.status(400).json({ error: error.message });
    }
  }

  @Post('generate_token')
  async generateToken(@Body('userId') userId: string, @Res() res: Response) {
    try {
      const result = await this.authService.generateToken(userId, res);
      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  @Post('refresh_token')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    try {
      const result = await this.authService.refreshToken(req, res);
      res.status(200).json(result);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  }

  @Post('logout')
  clearToken(@Res() res: Response) {
    const result = this.authService.clearToken(res);
    res.status(200).json(result);
  }
}
