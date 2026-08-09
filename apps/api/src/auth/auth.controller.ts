import { Controller, Post, Body, Res, UnauthorizedException, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { Response } from 'express';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from './decorators/current-user.decorator';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto.email, loginDto.password);
    
    if (!result) {
      throw new UnauthorizedException('Kredensial tidak valid');
    }

    if (result.type === 'handoff') {
      return result; // contains handoff_token
    }

    res.cookie('umrolink_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return result;
  }

  @Public()
  @Get('handoff')
  async handoff(@Query('code') code: string, @Res() res: Response) {
    if (!code) {
      return res.redirect('/login?error=expired');
    }

    try {
      const result = await this.authService.redeemHandoffToken(code);

      res.cookie('umrolink_token', result.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.redirect('/dashboard');
    } catch (e) {
      return res.redirect('/login?error=expired');
    }
  }

  @Get('me')
  async me(@CurrentUser() user: any) {
    return user;
  }

  @Post('logout')
  async logout(@Res({ passthrough: true }) res: Response) {
    res.cookie('umrolink_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
    return { success: true, message: 'Berhasil logout' };
  }
}
