import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from '../../common/supabase.service';
import { AdminAuthDto } from '../dto/admin-auth.dto';

@Injectable()
export class AdminAuthService {
  private readonly accessSecretKey: string;

  constructor(
    private readonly supabaseService: SupabaseService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.accessSecretKey = this.configService.get<string>('JWT_ACCESS_SECRET_KEY');
  }

  async validateUser(adminAuthDto: AdminAuthDto): Promise<string> {
    const { username, password } = adminAuthDto;

    // Verify username and password against Supabase profiles table
    const { data: profiles, error } = await this.supabaseService
      .getClient()
      .from('profiles')
      .select('*')
      .eq('username', username)
      .eq('password', password)
      .single();

    if (error || !profiles) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = profiles;

    // Generate JWT token with the admin role
    const payload = { userId: user.id, roles: ['admin'] };
    return this.jwtService.sign(payload, {
      secret: this.accessSecretKey,
      expiresIn: '1h',
    });
  }
}
