// src/modules/auth/controllers/user-auth.controller.ts

import { Controller, Get, Post, Query, Res, Body, Req } from '@nestjs/common';
import { UserAuthService } from '../services/user-auth.service';
import { UserTokenService } from '../services/user-token.service';
import { Response, Request } from 'express';

@Controller('user/auth')
export class UserAuthController {
  constructor(
    private readonly userAuthService: UserAuthService,
    private readonly userTokenService: UserTokenService,
  ) {}

  @Get('google')
  async signInWithGoogle(@Res() res: Response) {
    await this.userAuthService.signInWithGoogle(res);
  }

  @Get('google/callback')
  async googleCallback(@Query('code') code: string, @Res() res: Response) {
    const result = await this.userAuthService.handleGoogleCallback(code, res);
    return res.json(result);
  }

  @Post('generate_token')
  async generateToken(@Body('userId') userId: string, @Res() res: Response) {
    const result = await this.userTokenService.generateToken(userId, res);
    return res.status(200).json(result);
  }

  @Post('refresh_token')
  async refreshToken(@Req() req: Request, @Res() res: Response) {
    const newAccessToken = await this.userTokenService.refreshToken(req, res);
    return res.status(200).json({ accessToken: newAccessToken });
  }

  @Post('logout')
  clearToken(@Res() res: Response) {
    const result = this.userTokenService.clearToken(res);
    return res.status(200).json(result);
  }
}
