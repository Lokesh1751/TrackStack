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
import { ValidationPipe } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signup(@Body(ValidationPipe) dto: SignupDto, @Req() req: Request) {
    const user = await this.authService.signup(dto);
    return { user };
  }

  @Post('login')
  async login(@Body(ValidationPipe) dto: LoginDto, @Req() req: Request) {
    const user = await this.authService.validateUser(dto);

    req.session.userId = user.id;

    return {
      user: {
        id: user?.id,
        email: user?.email,
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

    return { user };
  }

  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err) => {
        if (err) return reject(new Error(err.message));
        resolve();
      });
    });

    res.clearCookie('sid');
    return { success: true };
  }
}
