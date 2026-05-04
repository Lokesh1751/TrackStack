import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    const user = await this.authService.signup(dto);
    return { success: true, data: user };
  }

  @Post('login')
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const user = await this.authService.validateUser(dto);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    req.session.userId = user.id;

    return {
      success: true,
      data: {
        id: user.id,
        email: user.email,
      },
    };
  }

  @Get('me')
  async me(@Req() req: Request) {
    if (!req.session.userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    const user = await this.authService.me(req.session.userId);

    if (!user) {
      throw new UnauthorizedException('Session user not found');
    }

    return { success: true, data: user };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) {
          reject(
            err instanceof Error ? err : new Error('Failed to destroy session'),
          );
          return;
        }
        resolve();
      });
    });

    res.clearCookie('connect.sid');

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  @Post('forgot-password')
  forgot(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  reset(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
