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
  constructor(private readonly db: DatabaseService) {}

  async signup(dto: SignupDto) {
    const existing = await this.db.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await argon2.hash(dto.password);

    return this.db.user.create({
      data: {
        email: dto.email,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
  }

  async validateUser(dto: LoginDto) {
    const user = await this.db.user.findUnique({
      where: { email: dto.email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async me(userId: string) {
    const user = await this.db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        createdAt: true,
      },
    });
    return user;
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.db.user.findUnique({
      where: { email: dto.email },
    });
    console.log('user=====>', user);
    // Always return success (security)
    if (!user) {
      return { message: 'If email exists, reset link sent' };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');

    const hashedToken = await argon2.hash(rawToken);

    await this.db.user.update({
      where: { email: dto.email },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const resetLink = `http://localhost:3001/reset-password?token=${rawToken}`;

    return { message: 'Reset link sent', resetLink };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const { token, newPassword } = dto;

    const users = await this.db.user.findMany({
      where: {
        resetToken: { not: null },
      },
    });

    let matchedUser: any = null;

    for (const user of users) {
      const isMatch = await argon2.verify(user.resetToken!, token);
      if (isMatch) {
        matchedUser = user;
        break;
      }
    }

    if (!matchedUser) {
      throw new BadRequestException('Invalid or expired token');
    }

    if (
      !matchedUser.resetTokenExpiry ||
      matchedUser.resetTokenExpiry < new Date()
    ) {
      throw new BadRequestException('Token expired');
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.db.user.update({
      where: { id: matchedUser.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password reset successful' };
  }
}
