import { Body, Controller, Post, Res, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { AdminAuthDto } from '../dto/admin-auth.dto';
import { AdminAuthService } from '../services/admin-auth.service';
import { Response } from 'express';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  async login(@Body() adminAuthDto: AdminAuthDto, @Res() res: Response) {
    try {
      const token = await this.adminAuthService.validateUser(adminAuthDto);
      res.cookie('access_token', token, { httpOnly: true, path: '/' });
      return res.status(HttpStatus.OK).json({ message: 'Login successful' });
    } catch (error) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }
}
