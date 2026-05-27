// auth.service.ts

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
import { UpdateProfileDto } from './dto/update-profile.dto';
import { NotificationsService } from '@/notifications/notifications.service';
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

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
      select: {
        id: true,
      },
    });

    if (existing) {
      throw new BadRequestException('Email already in use');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.databaseService.user.create({
      data: {
        email,
        passwordHash,
        isSuperAdmin: false,
      },

      select: {
        id: true,
        email: true,
        isSuperAdmin: true,
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
        isSuperAdmin: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await argon2.verify(user.passwordHash, dto.password);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // ======================================================
    // CHECK DELAYED / AT RISK SPRINTS
    // ======================================================

    const sprints = await this.databaseService.sprint.findMany({
      where: {
        status: 'ACTIVE',
      },

      include: {
        project: true,

        tasks: true,
      },
    });

    for (const sprint of sprints) {
      const tasks = sprint.tasks || [];

      const totalEstimate = tasks.reduce(
        (acc, task) => acc + (task.estimateMinutes || 0),
        0,
      );

      const completedEstimate = tasks
        .filter((task) => task.status === 'DONE')
        .reduce((acc, task) => acc + (task.estimateMinutes || 0), 0);

      const sprintProgress =
        totalEstimate > 0
          ? Math.round((completedEstimate / totalEstimate) * 100)
          : 0;

      const now = new Date();

      const startDate = sprint.startDate ? new Date(sprint.startDate) : null;

      const endDate = sprint.endDate ? new Date(sprint.endDate) : null;

      let totalDays = 0;
      let daysLeft = 0;
      let daysPassed = 0;

      if (startDate && endDate) {
        totalDays = Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
        );

        daysLeft = Math.max(
          0,
          Math.ceil(
            (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          ),
        );

        daysPassed = Math.max(0, totalDays - daysLeft);
      }

      const timeProgress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

      let health = 'HEALTHY';

      if (daysPassed > 0) {
        if (sprintProgress + 10 < timeProgress) {
          health = 'DELAYED';
        } else if (
          sprintProgress < timeProgress &&
          Math.abs(sprintProgress - timeProgress) <= 10
        ) {
          health = 'AT_RISK';
        }
      }

      if (health !== 'HEALTHY') {
        await this.notificationsService.createNotification({
          title: health === 'DELAYED' ? 'Sprint Delayed' : 'Sprint At Risk',

          message:
            health === 'DELAYED'
              ? `Sprint "${sprint.name}" is getting delayed`
              : `Sprint "${sprint.name}" is at risk`,

          type: 'SPRINT_HEALTH',

          triggeredById: user.id,

          workspaceId: sprint.project.workspaceId,

          projectId: sprint.projectId,

          sprintId: sprint.id,

          userId: user.id,
        });
      }
    }

    return user;

    return user;
  }

  async me(userId: string) {
    const user = await this.databaseService.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        email: true,
        isSuperAdmin: true,

        // PROFILE
        name: true,
        bio: true,
        avatarUrl: true,
        designation: true,
        timezone: true,

        createdAt: true,

        // WORKSPACES
        memberships: {
          select: {
            id: true,
            role: true,

            workspace: {
              select: {
                id: true,
                name: true,
                slug: true,
                logoUrl: true,
              },
            },
          },
        },

        // PROJECT MEMBERS
        projectMembers: {
          select: {
            id: true,
            role: true,

            project: {
              select: {
                id: true,
                name: true,
                description: true,
                createdAt: true,

                workspace: {
                  select: {
                    id: true,
                    name: true,
                  },
                },

                sprints: {
                  where: {
                    status: 'ACTIVE',
                  },

                  select: {
                    id: true,
                    name: true,
                    status: true,
                    startDate: true,
                    endDate: true,
                  },

                  take: 1,
                },

                tasks: {
                  select: {
                    id: true,
                    status: true,
                    assigneeId: true,
                  },
                },
              },
            },
          },
        },

        // ASSIGNED TASKS
        assignedTasks: {
          take: 10,

          orderBy: {
            createdAt: 'desc',
          },

          select: {
            id: true,
            title: true,
            taskKey: true,
            status: true,
            priority: true,
            type: true,
            dueDate: true,
            estimateMinutes: true,

            project: {
              select: {
                id: true,
                name: true,
              },
            },

            sprint: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },

        // REPORTED TASKS
        reportedTasks: {
          take: 10,

          orderBy: {
            createdAt: 'desc',
          },

          select: {
            id: true,
            title: true,
            status: true,

            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        // COMMENTS
        taskComments: {
          take: 5,

          orderBy: {
            createdAt: 'desc',
          },

          select: {
            id: true,
            content: true,
            createdAt: true,

            task: {
              select: {
                id: true,
                title: true,
                taskKey: true,
              },
            },
          },
        },

        // CREATED SPRINTS
        sprints: {
          take: 5,

          orderBy: {
            createdAt: 'desc',
          },

          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            endDate: true,

            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        data: null,
      };
    }

    // =========================
    // PROJECTS
    // =========================

    const projects = user.projectMembers.map((member) => {
      return {
        id: member.project.id,
        name: member.project.name,
        description: member.project.description,
        createdAt: member.project.createdAt,

        role: member.role,

        workspace: member.project.workspace,

        activeSprint: member.project.sprints[0] || null,
      };
    });

    // =========================
    // STATS
    // =========================

    const totalProjects = user.projectMembers.length;

    const totalTasks = user.assignedTasks.length;

    const completedTasks = user.assignedTasks.filter(
      (task) => task.status === 'DONE',
    ).length;

    const activeSprints = user.projectMembers.filter(
      (member) => member.project.sprints.length > 0,
    ).length;

    const totalWorkspaces = user.memberships.length;

    return {
      success: true,

      data: {
        id: user.id,
        email: user.email,
        isSuperAdmin: user.isSuperAdmin,

        name: user.name,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        designation: user.designation,
        timezone: user.timezone,

        createdAt: user.createdAt,

        memberships: user.memberships,

        projects,

        assignedTasks: user.assignedTasks,

        reportedTasks: user.reportedTasks,

        taskComments: user.taskComments,

        sprints: user.sprints,

        stats: {
          totalProjects,
          totalTasks,
          completedTasks,
          activeSprints,
          totalWorkspaces,
        },
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updatedUser = await this.databaseService.user.update({
      where: {
        id: userId,
      },

      data: {
        name: dto.name,
        bio: dto.bio,
        avatarUrl: dto.avatarUrl,
        designation: dto.designation,
        timezone: dto.timezone,
      },

      select: {
        id: true,
        email: true,
        isSuperAdmin: true,

        name: true,
        bio: true,
        avatarUrl: true,
        designation: true,
        timezone: true,

        createdAt: true,
      },
    });

    return {
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
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
      expiresIn: remainingSeconds,
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

  async getAllUsers(currentUserId: string) {
    const users = await this.databaseService.user.findMany({
      where: {
        id: {
          not: currentUserId,
        },

        isSuperAdmin: false,
      },

      select: {
        id: true,
        email: true,
        isSuperAdmin: true,
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
    dto: {
      userId: string;
      isSuperAdmin: boolean;
    },
    currentUserId: string,
  ) {
    const currentUser = await this.databaseService.user.findUnique({
      where: {
        id: currentUserId,
      },

      select: {
        id: true,
        isSuperAdmin: true,
      },
    });

    if (!currentUser) {
      throw new BadRequestException('User not found');
    }

    if (!currentUser.isSuperAdmin) {
      throw new BadRequestException('Only SUPER_ADMIN can update user roles');
    }

    const targetUser = await this.databaseService.user.findUnique({
      where: {
        id: dto.userId,
      },
    });

    if (!targetUser) {
      throw new BadRequestException('Target user not found');
    }

    if (targetUser.id === currentUserId && dto.isSuperAdmin === false) {
      throw new BadRequestException(
        'You cannot remove yourself as super admin',
      );
    }

    await this.databaseService.user.update({
      where: {
        id: dto.userId,
      },

      data: {
        isSuperAdmin: dto.isSuperAdmin,
      },
    });

    return {
      message: 'User updated successfully',
    };
  }
}
