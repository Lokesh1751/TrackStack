import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import * as argon2 from 'argon2';
import { DatabaseService } from 'src/database/database.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import * as crypto from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ValidateResetOtpDto } from './dto/validate-reset-otp.dto';
import { otpEmailTemplate } from 'src/mail/templates/otp-email.template';
import { Resend } from 'resend';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private generateResetToken() {
    const otp = crypto.randomInt(100000, 1000000).toString();
    const hashedToken = crypto.createHash('sha256').update(otp).digest('hex');
    return { otp, hashedToken };
  }

  private async sendResetOtpEmail(email: string, otp: string) {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      this.logger.error('RESEND_API_KEY is missing');
      throw new InternalServerErrorException('Email service is not configured');
    }

    const resend = new Resend(resendApiKey);
    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'TrackStack Password Reset OTP',
      html: otpEmailTemplate(otp),
    });

    if (error) {
      this.logger.error(`Failed to send OTP email: ${error.message}`);
      throw new InternalServerErrorException('Failed to send OTP email');
    }
  }

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

  async validateUser(dto: LoginDto) {
    const email = this.normalizeEmail(dto.email);

    const user = await this.databaseService.user.findUnique({
      where: { email },

      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
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

  async forgotPassword(dto: ForgotPasswordDto) {
    const email = this.normalizeEmail(dto.email);

    const user = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: true,
        message: 'If email exists, verification is accepted',
      };
    }

    return {
      success: true,
      message: 'Verification accepted',
    };
  }

  async generateResetOtp(dto: ForgotPasswordDto) {
    const email = this.normalizeEmail(dto.email);

    const user = await this.databaseService.user.findUnique({
      where: { email },
    });

    if (!user) {
      return {
        success: true,
        message: 'If email exists, OTP sent',
      };
    }

    if (
      user.resetTokenExpiry &&
      new Date(user.resetTokenExpiry).getTime() - Date.now() > 9 * 60 * 1000
    ) {
      throw new BadRequestException(
        'Please wait before requesting another OTP',
      );
    }

    const { otp, hashedToken } = this.generateResetToken();

    const expiryTime = Number(process.env.OTP_EXPIRY_TIME);

    await this.databaseService.user.update({
      where: { email },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + expiryTime),
      },
    });

    await this.sendResetOtpEmail(email, otp);

    return {
      success: true,
      message: 'OTP sent to your email',
      resetTokenExpiry: new Date(Date.now() + expiryTime),
    };
  }

  async validateResetOtp(dto: ValidateResetOtpDto) {
    const email = this.normalizeEmail(dto.email);

    const hashedToken = crypto
      .createHash('sha256')
      .update(dto.otp)
      .digest('hex');

    const user = await this.databaseService.user.findUnique({
      where: { email },
      select: {
        id: true,
        resetToken: true,
        resetTokenExpiry: true,
      },
    });

    if (!user || !user.resetToken || !user.resetTokenExpiry) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    if (user.resetToken !== hashedToken) {
      throw new BadRequestException('Invalid OTP');
    }

    if (user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('OTP expired');
    }

    const remainingMs = user.resetTokenExpiry.getTime() - Date.now();

    const remainingSeconds = Math.max(0, Math.floor(remainingMs / 1000));

    return {
      success: true,
      message: 'OTP verified',
      expiresIn: remainingSeconds, // ⏱ send to FE
    };
  }

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

  // ✅ FIXED: ROLE FROM MEMBERSHIP ONLY
  async getAllUsers(currentUserId: string) {
    const users = await this.databaseService.user.findMany({
      where: {
        id: { not: currentUserId },
      },

      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      users,
    };
  }

  async updateUserRole(
    dto: { userId: string; role: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER' },
    currentUserId: string,
  ) {
    // 1. Get current user (actor)
    const currentUser = await this.databaseService.user.findUnique({
      where: { id: currentUserId },
    });

    if (!currentUser) {
      throw new BadRequestException('User not found');
    }

    // 2. ONLY SUPER_ADMIN can update roles
    if (currentUser.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only SUPER_ADMIN can update user roles');
    }

    // 3. Get target user
    const targetUser = await this.databaseService.user.findUnique({
      where: { id: dto.userId },
    });

    if (!targetUser) {
      throw new BadRequestException('Target user not found');
    }

    // 4. Prevent demoting last super admin (optional safety)
    if (targetUser.id === currentUserId && dto.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('You cannot demote yourself');
    }

    // 5. Update role
    await this.databaseService.user.update({
      where: { id: dto.userId },
      data: {
        role: dto.role,
      },
    });

    return {
      message: 'User role updated successfully',
    };
  }
}
