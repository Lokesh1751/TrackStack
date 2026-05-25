import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
  Session,
  Patch,
} from '@nestjs/common';

import type { Request, Response } from 'express';

import { AuthService } from './auth.service';

import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ValidateResetOtpDto } from './dto/validate-reset-otp.dto';

import { SessionAuthGuard } from '../database/session-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // =========================
  // SIGNUP
  // =========================
  @Post('signup')
  async signup(@Body(ValidationPipe) dto: SignupDto) {
    return this.authService.signup(dto);
  }

  // =========================
  // LOGIN
  // =========================
  @Post('login')
  async login(
    @Body(ValidationPipe) dto: LoginDto,
    @Session() session: Record<string, string | undefined>,
  ) {
    const user = await this.authService.validateUser(dto);

    session.userId = user?.id;

    return {
      success: true,

      data: {
        id: user?.id,
        email: user?.email,

        // ✅ global role
        isSuperAdmin: user?.isSuperAdmin,
      },
    };
  }

  // =========================
  // ME
  // =========================
  @UseGuards(SessionAuthGuard)
  @Get('me')
  async me(@Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return this.authService.me(userId);
  }

  @Patch('me')
  async updateProfile(@Req() req: Request, @Body() dto: UpdateProfileDto) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return this.authService.updateProfile(userId, dto);
  }

  // =========================
  // LOGOUT
  // =========================
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    await new Promise<void>((resolve, reject) => {
      req.session.destroy((err: Error | null) => {
        if (err) {
          return reject(err);
        }

        resolve();
      });
    });

    res.clearCookie('sid');

    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  // =========================
  // FORGOT PASSWORD
  // =========================
  @Post('forgot-password')
  forgotPassword(@Body(ValidationPipe) dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  // =========================
  // GENERATE RESET OTP
  // =========================
  @Post('generate-reset-otp')
  generateResetOtp(@Body(ValidationPipe) dto: ForgotPasswordDto) {
    return this.authService.generateResetOtp(dto);
  }

  // =========================
  // VALIDATE RESET OTP
  // =========================
  @Post('validate-reset-otp')
  validateResetOtp(@Body(ValidationPipe) dto: ValidateResetOtpDto) {
    return this.authService.validateResetOtp(dto);
  }

  // =========================
  // RESET PASSWORD
  // =========================
  @Post('reset-password')
  resetPassword(@Body(ValidationPipe) dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // =========================
  // GET ALL USERS
  // =========================
  @UseGuards(SessionAuthGuard)
  @Get('users')
  async getAllUsers(@Req() req: Request) {
    const currentUserId = req.session.userId;

    if (!currentUserId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return this.authService.getAllUsers(currentUserId);
  }

  // =========================
  // UPDATE USER ROLE
  // =========================
  @UseGuards(SessionAuthGuard)
  @Post('update-role')
  async updateRole(
    @Body(ValidationPipe)
    dto: {
      userId: string;
      isSuperAdmin: boolean;
    },

    @Req() req: Request,
  ) {
    const currentUserId = req.session.userId;

    if (!currentUserId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return this.authService.updateUserRole(dto, currentUserId);
  }
}
