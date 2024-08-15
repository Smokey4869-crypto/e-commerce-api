// src/modules/auth/services/user-auth.service.ts

import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../../common/supabase.service';
import { UserTokenService } from './user-token.service';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class UserAuthService {
  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly userTokenService: UserTokenService,
    private readonly configService: ConfigService,
  ) {}

  async signInWithGoogle(res: any) {
    const { data, error } = await this.supabaseService.getClient().auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: this.configService.get<string>('GOOGLE_REDIRECT_URL'),
      },
    });

    if (error) {
      throw new Error(`Google OAuth failed: ${error.message}`);
    }

    res.redirect(data.url); // Redirect the user to the Google consent page
  }

  async handleGoogleCallback(code: string, res: any) {
    const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
    const googleClientSecret = this.configService.get<string>('GOOGLE_CLIENT_SECRET');
    const googleRedirectUri = this.configService.get<string>('GOOGLE_REDIRECT_URL');

    const { data } = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: googleClientId,
      client_secret: googleClientSecret,
      redirect_uri: googleRedirectUri,
      grant_type: 'authorization_code',
    });

    const { id_token } = data;

    // Verify the id_token with Supabase
    const { data: userData, error } = await this.supabaseService.getClient().auth.getUser(id_token);

    if (error || !userData?.user?.id) {
      throw new Error(`Verification failed: ${error ? error.message : 'No user data found'}`);
    }

    // Now that the user is verified, generate tokens
    const result = await this.userTokenService.generateToken(userData.user.id, res);
    return result;
  }
}
