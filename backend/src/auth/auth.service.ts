import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { DatabaseService } from 'src/database/database.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import * as crypto from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@Injectable()
export class AuthService {
  constructor(private readonly databaseService: DatabaseService) {}

  // ================== HELPERS ==================
  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private generateResetToken() {
    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedToken = crypto.createHash('sha256').update(otp).digest('hex');
    return { otp, hashedToken };
  }

  private sendResetOtpEmail(email: string, otp: string) {
    // TODO: Replace with your actual mail provider integration.
    console.log(`[auth] OTP for ${email}: ${otp}`);
  }

  // ================== SIGNUP ==================
  async signup(dto: SignupDto) {
    const email = this.normalizeEmail(dto.email);

    if (!dto.password || dto.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const existing = await this.databaseService.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.databaseService.user.create({
      data: {
        email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      message: 'User created successfully',
      data: user,
    };
  }

  // ================== LOGIN ==================
  async validateUser(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);

    const user = await this.databaseService.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await argon2.verify(user.passwordHash, dto.password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  // ================== ME ==================
  async me(userId: string) {
    const user = await this.databaseService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });

    return {
      success: true,
      data: user,
    };
  }

  // ================== FORGOT PASSWORD ==================
  async forgotPassword(dto: ForgotPasswordDto) {
    const email = this.normalizeEmail(dto.email);

    const user = await this.databaseService.user.findUnique({
      where: { email },
    });

    // Always return success (avoid email enumeration)
    if (!user) {
      return {
        success: true,
        message: 'If email exists, reset link sent',
      };
    }

    // Basic rate limit to avoid OTP spam.
    if (
      user.resetTokenExpiry &&
      new Date(user.resetTokenExpiry).getTime() - Date.now() > 9 * 60 * 1000
    ) {
      throw new BadRequestException(
        'Please wait before requesting another OTP',
      );
    }

    const { otp, hashedToken } = this.generateResetToken();

    await this.databaseService.user.update({
      where: { email },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    this.sendResetOtpEmail(email, otp);

    return {
      success: true,
      message: 'OTP sent to your email',
    };
  }

  // ================== RESET PASSWORD ==================
  async resetPassword(dto: ResetPasswordDto) {
    const email = this.normalizeEmail(dto.email);
    const hashedToken = crypto
      .createHash('sha256')
      .update(dto.otp)
      .digest('hex');

    const user = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (!user.passwordHash) {
      throw new BadRequestException('Invalid user state');
    }

    if (user.resetToken !== hashedToken) {
      throw new BadRequestException('Invalid OTP');
    }

    if (user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    const isSamePassword = await argon2.verify(
      user.passwordHash,
      dto.newPassword,
    );

    if (isSamePassword) {
      throw new BadRequestException(
        'New password must be different from old password',
      );
    }

    const passwordHash = await argon2.hash(dto.newPassword);

    await this.databaseService.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return {
      success: true,
      message: 'Password reset successful',
    };
  }
}
