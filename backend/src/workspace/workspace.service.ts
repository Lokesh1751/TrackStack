// workspace.service.ts

import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';

import { DatabaseService } from 'src/database/database.service';

import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { WorkspaceQueryDto } from './dto/workspace-query.dto';
import { Resend } from 'resend';
import { randomUUID } from 'crypto';
import { workspaceInviteTemplate } from '@/mail/templates/workspace-invite.template';
import { NotificationsService } from '@/notifications/notifications.service';

@Injectable()
export class WorkspaceService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async sendWorkspaceInvitationEmail(
    email: string,
    workspaceName: string,
    inviteLink: string,
    invitedBy: string,
  ) {
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      throw new InternalServerErrorException('Email service is not configured');
    }

    const resend = new Resend(resendApiKey);

    const { error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: `Invitation to join ${workspaceName}`,
      html: workspaceInviteTemplate(invitedBy, workspaceName, inviteLink),
    });

    if (error) {
      throw new InternalServerErrorException('Failed to send invitation email');
    }
  }
  private async isSuperAdmin(userId: string) {
    const membership = await this.db.membership.findFirst({
      where: {
        userId,
        role: 'SUPER_ADMIN',
      },
    });

    return !!membership;
  }

  // =========================
  // CREATE WORKSPACE
  // =========================
  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    const user = await this.db.user.findUnique({
      where: { id: userId },

      select: {
        isSuperAdmin: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // ✅ only super admin can create workspace
    if (!user.isSuperAdmin) {
      throw new BadRequestException('Only super admin can create workspace');
    }

    const existingSlug = await this.db.workspace.findUnique({
      where: {
        slug: dto.slug,
      },
    });

    if (existingSlug) {
      throw new BadRequestException('Workspace slug already exists');
    }

    const workspace = await this.db.workspace.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        logoUrl: dto.logoUrl,
        ownerId: userId,

        members: {
          create: {
            userId,
            role: user.isSuperAdmin ? 'SUPER_ADMIN' : 'MEMBER',
          },
        },
      },
    });
    await this.notificationsService.createNotification({
      title: 'Workspace Created',

      message: `${workspace.name} workspace created`,

      type: 'WORKSPACE_CREATED',

      triggeredById: userId,

      workspaceId: workspace.id,
    });
    return {
      message: 'Workspace created successfully',
      workspace,
    };
  }

  // =========================
  // GET USER WORKSPACES
  // =========================
  async getUserWorkspaces(userId: string, query: WorkspaceQueryDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);

    const role = query.role?.toUpperCase() as
      | 'ADMIN'
      | 'MEMBER'
      | 'SUPER_ADMIN'
      | undefined;

    // =========================
    // CHECK SUPER ADMIN
    // =========================

    const superAdminMembership = await this.db.membership.findFirst({
      where: {
        userId,
        role: 'SUPER_ADMIN',
      },
    });

    const isSuperAdmin = !!superAdminMembership;

    // =========================
    // SUPER ADMIN -> ALL WORKSPACES
    // =========================

    if (isSuperAdmin) {
      const workspaces = await this.db.workspace.findMany({
        where: query.search
          ? {
              OR: [
                {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
                {
                  slug: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : undefined,

        orderBy: {
          createdAt: 'desc',
        },

        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        workspaces: workspaces.map((workspace) => ({
          id: workspace.id,
          name: workspace.name,
          slug: workspace.slug,
          description: workspace.description,
          logoUrl: workspace.logoUrl,
          ownerId: workspace.ownerId,
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
          role: 'SUPER_ADMIN',
        })),
      };
    }

    // =========================
    // NORMAL MEMBERSHIP FLOW
    // =========================

    const memberships = await this.db.membership.findMany({
      where: {
        userId,

        ...(role && { role }),

        workspace: query.search
          ? {
              OR: [
                {
                  name: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
                {
                  slug: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
                {
                  description: {
                    contains: query.search,
                    mode: 'insensitive',
                  },
                },
              ],
            }
          : undefined,
      },

      include: {
        workspace: true,
      },

      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      workspaces: memberships.map((m) => ({
        id: m.workspace.id,
        name: m.workspace.name,
        slug: m.workspace.slug,
        description: m.workspace.description,
        logoUrl: m.workspace.logoUrl,
        ownerId: m.workspace.ownerId,
        createdAt: m.workspace.createdAt,
        updatedAt: m.workspace.updatedAt,
        role: m.role,
      })),
    };
  }

  // =========================
  // GET WORKSPACE BY ID
  // =========================
  async getWorkspaceById(workspaceId: string, userId: string) {
    const workspace = await this.db.workspace.findUnique({
      where: {
        id: workspaceId,
      },
    });

    if (!workspace) {
      throw new BadRequestException('Workspace not found');
    }

    const isSuperAdmin = await this.isSuperAdmin(userId);

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: workspaceId,
        },
      },
    });

    if (!membership && !isSuperAdmin) {
      throw new UnauthorizedException('Access denied');
    }

    const user = await this.db.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        isSuperAdmin: true,
      },
    });

    return {
      workspace: {
        ...workspace,
        role: membership?.role,
        isSuperAdmin: user?.isSuperAdmin || false,
      },
    };
  }

  // =========================
  // UPDATE WORKSPACE
  // =========================
  async updateWorkspace(
    workspaceId: string,
    dto: UpdateWorkspaceDto,
    userId: string,
  ) {
    const isSuperAdmin = await this.isSuperAdmin(userId);

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: workspaceId,
        },
      },
    });

    if (!membership && !isSuperAdmin) {
      throw new UnauthorizedException('Access denied');
    }

    const user = await this.db.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        isSuperAdmin: true,
      },
    });

    // ✅ ADMIN of workspace OR SUPER_ADMIN
    if (membership?.role !== 'ADMIN' && !user?.isSuperAdmin) {
      throw new BadRequestException('Only admin can edit workspace');
    }

    const existingSlug = await this.db.workspace.findFirst({
      where: {
        slug: dto.slug,
        NOT: {
          id: workspaceId,
        },
      },
    });

    if (existingSlug) {
      throw new BadRequestException('Workspace slug already exists');
    }

    await this.db.workspace.update({
      where: {
        id: workspaceId,
      },

      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        logoUrl: dto.logoUrl,
      },
    });
    await this.notificationsService.createNotification({
      title: 'Workspace Updated',

      message: `${dto.name || 'Workspace'} updated`,

      type: 'WORKSPACE_UPDATED',

      triggeredById: userId,

      workspaceId,
    });
    return {
      message: 'Workspace updated',
    };
  }

  // =========================
  // DELETE WORKSPACE
  // =========================
  async deleteWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.db.workspace.findUnique({
      where: {
        id: workspaceId,
      },
    });

    if (!workspace) {
      throw new BadRequestException('Workspace not found');
    }

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    const user = await this.db.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        isSuperAdmin: true,
      },
    });

    // ✅ SUPER_ADMIN can delete any workspace
    // ✅ ADMIN can delete only if member of workspace
    if (!user?.isSuperAdmin) {
      if (!membership) {
        throw new BadRequestException('Access denied');
      }

      if (membership.role !== 'ADMIN') {
        throw new BadRequestException('Only admin can delete workspace');
      }
    }

    // ✅ delete memberships first
    await this.db.membership.deleteMany({
      where: {
        workspaceId,
      },
    });

    // ✅ delete workspace
    await this.db.workspace.delete({
      where: {
        id: workspaceId,
      },
    });
    await this.notificationsService.createNotification({
      title: 'Workspace Deleted',

      message: `${workspace.name} workspace deleted`,

      type: 'WORKSPACE_DELETED',

      triggeredById: userId,

      workspaceId,
    });
    return {
      message: 'Workspace deleted successfully',
    };
  }

  // =========================
  // ADD MEMBER
  // =========================
  async addMember(
    workspaceId: string,
    dto: AddMemberDto,
    currentUserId: string,
  ) {
    // =========================
    // CURRENT USER
    // =========================

    const currentUser = await this.db.user.findUnique({
      where: {
        id: currentUserId,
      },

      select: {
        id: true,
        email: true,
        isSuperAdmin: true,
      },
    });

    if (!currentUser) {
      throw new BadRequestException('User not found');
    }

    // =========================
    // WORKSPACE
    // =========================

    const workspace = await this.db.workspace.findUnique({
      where: {
        id: workspaceId,
      },
    });

    if (!workspace) {
      throw new BadRequestException('Workspace not found');
    }

    // =========================
    // CHECK ACCESS
    // =========================

    if (!currentUser.isSuperAdmin) {
      const currentMembership = await this.db.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId: currentUserId,
            workspaceId,
          },
        },
      });

      if (!currentMembership) {
        throw new BadRequestException('Access denied');
      }

      if (currentMembership.role !== 'ADMIN') {
        throw new BadRequestException(
          'Only workspace admin can invite members',
        );
      }
    }

    // =========================
    // FIND USER BY EMAIL
    // =========================

    const user = await this.db.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // =========================
    // ALREADY MEMBER
    // =========================

    const exists = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId,
        },
      },
    });

    if (exists) {
      throw new BadRequestException('User already a member');
    }

    // =========================
    // ONLY ONE ADMIN
    // =========================

    if (dto.role === 'ADMIN') {
      const existingAdmin = await this.db.membership.findFirst({
        where: {
          workspaceId,
          role: 'ADMIN',
        },
      });

      if (existingAdmin) {
        throw new BadRequestException('Workspace already has an admin');
      }
    }

    // =========================
    // CHECK PENDING INVITE
    // =========================

    const existingInvite = await this.db.workspaceInvite.findFirst({
      where: {
        workspaceId,
        email: dto.email,
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      throw new BadRequestException('Invitation already sent');
    }

    // =========================
    // CREATE INVITE
    // =========================

    const token = randomUUID();

    const invitation = await this.db.workspaceInvite.create({
      data: {
        workspaceId,
        email: dto.email,
        token,
        invitedById: currentUserId,
        role: dto.role,
        status: 'PENDING',

        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours
      },
    });

    // =========================
    // SEND EMAIL
    // =========================

    const inviteLink = `${process.env.FRONTEND_URL}/invite/${token}?workspaceName=${workspace.name}`;

    await this.sendWorkspaceInvitationEmail(
      dto.email,
      workspace.name,
      inviteLink,
      currentUser.email || 'TrackStack Admin',
    );
    await this.notificationsService.createNotification({
      title: 'Workspace Invitation Sent',

      message: `${dto.email} invited to workspace`,

      type: 'WORKSPACE_MEMBER_INVITED',

      triggeredById: currentUserId,

      workspaceId,

      userId: user.id,
    });
    return {
      message: 'Workspace invitation sent successfully',
      invitation,
    };
  }

  // =========================
  // GET MEMBERS
  // =========================
  async getWorkspaceMembers(workspaceId: string, userId: string) {
    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    const currentUser = await this.db.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        isSuperAdmin: true,
      },
    });

    // ✅ SUPER_ADMIN can access any workspace members
    if (!membership && !currentUser?.isSuperAdmin) {
      throw new BadRequestException('Access denied');
    }

    const members = await this.db.membership.findMany({
      where: {
        workspaceId,
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            isSuperAdmin: true,
          },
        },
      },
    });

    return {
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.user.email,
        role: m.role,
        isSuperAdmin: m.user.isSuperAdmin,
      })),
    };
  }

  // =========================
  // REMOVE MEMBER
  // =========================
  async removeMember(
    workspaceId: string,
    memberUserId: string,
    currentUserId: string,
  ) {
    const currentMembership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: currentUserId,
          workspaceId,
        },
      },
    });

    const currentUser = await this.db.user.findUnique({
      where: {
        id: currentUserId,
      },

      select: {
        isSuperAdmin: true,
      },
    });

    const memberUser = await this.db.user.findUnique({
      where: {
        id: memberUserId,
      },
    });

    // ✅ SUPER_ADMIN bypass
    if (!currentUser?.isSuperAdmin) {
      if (!currentMembership) {
        throw new BadRequestException('Access denied');
      }

      if (currentMembership.role !== 'ADMIN') {
        throw new BadRequestException('Only admin can remove members');
      }
    }

    if (memberUserId === currentUserId) {
      throw new BadRequestException('You cannot remove yourself');
    }

    const member = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: memberUserId,
          workspaceId,
        },
      },
    });

    if (!member) {
      throw new BadRequestException('Member not found');
    }

    await this.db.membership.delete({
      where: {
        userId_workspaceId: {
          userId: memberUserId,
          workspaceId,
        },
      },
    });
    await this.notificationsService.createNotification({
      title: 'Workspace Member Removed',

      message: `${memberUser?.email || 'Member'} removed from workspace`,

      type: 'WORKSPACE_MEMBER_REMOVED',

      triggeredById: currentUserId,

      workspaceId,

      userId: memberUserId,
    });
    return {
      message: 'Member removed',
    };
  }

  // =========================
  // UPDATE MEMBER ROLE
  // =========================
  async updateMemberRole(
    workspaceId: string,
    targetUserId: string, // Renamed for clarity
    newRole: 'SUPER_ADMIN' | 'ADMIN' | 'MEMBER',
    currentUserId: string,
  ) {
    // 1. Get current user's role
    const currentUser = await this.db.membership.findUnique({
      where: { userId_workspaceId: { userId: currentUserId, workspaceId } },
    });

    if (
      !currentUser ||
      (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')
    ) {
      throw new ForbiddenException(
        'You do not have permission to manage roles',
      );
    }

    // 2. Target member check
    const targetMember = await this.db.membership.findUnique({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
    });

    if (!targetMember) {
      throw new NotFoundException('Member not found in this workspace');
    }

    // 3. Safety: Prevent removing the last person with administrative power
    const adminRoles = ['ADMIN', 'SUPER_ADMIN'];
    if (
      adminRoles.includes(targetMember.role) &&
      !adminRoles.includes(newRole)
    ) {
      const adminCount = await this.db.membership.count({
        where: {
          workspaceId,
          role: { in: adminRoles },
        },
      });

      if (adminCount <= 1) {
        throw new BadRequestException(
          'Cannot demote the only remaining administrator',
        );
      }
    }
    // 4. Prevent multiple ADMINs in workspace
    if (newRole === 'ADMIN') {
      const existingAdmin = await this.db.membership.findFirst({
        where: {
          workspaceId,
          role: 'ADMIN',
        },
      });

      // if another admin exists and it's not the same user
      if (existingAdmin && existingAdmin.userId !== targetUserId) {
        throw new BadRequestException(
          'Workspace already has an ADMIN. Please demote existing admin first.',
        );
      }
    }
    const updatedMembership = await this.db.membership.update({
      where: {
        userId_workspaceId: {
          userId: targetUserId,
          workspaceId,
        },
      },

      data: {
        role: newRole,
      },
    });

    await this.notificationsService.createNotification({
      title: 'Workspace Role Updated',

      message: `Your workspace role changed to ${newRole}`,

      type: 'WORKSPACE_ROLE_UPDATED',

      triggeredById: currentUserId,

      workspaceId,

      userId: targetUserId,
    });

    return updatedMembership;
  }

  // =========================
  // ACCEPT WORKSPACE INVITE
  // =========================

  async acceptWorkspaceInvite(token: string) {
    const invite = await this.db.workspaceInvite.findUnique({
      where: {
        token,
      },
    });

    if (!invite) {
      throw new BadRequestException('Invalid invite');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException('Invite already processed');
    }

    // OPTIONAL EXPIRY CHECK
    if (invite.expiresAt < new Date()) {
      throw new BadRequestException('Invitation expired');
    }

    const user = await this.db.user.findUnique({
      where: {
        email: invite.email,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // =========================
    // CHECK EXISTING MEMBERSHIP
    // =========================

    const existingMember = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: user.id,
          workspaceId: invite.workspaceId,
        },
      },
    });

    if (existingMember) {
      throw new BadRequestException('User already member of workspace');
    }

    // =========================
    // ADD MEMBER
    // =========================

    await this.db.membership.create({
      data: {
        userId: user.id,
        workspaceId: invite.workspaceId,
        role: invite.role,
      },
    });

    // =========================
    // UPDATE INVITE
    // =========================

    await this.db.workspaceInvite.update({
      where: {
        id: invite.id,
      },
      data: {
        status: 'ACCEPTED',
      },
    });
    await this.notificationsService.createNotification({
      title: 'Workspace Invitation Accepted',

      message: `${user.email} joined workspace`,

      type: 'WORKSPACE_INVITE_ACCEPTED',

      triggeredById: user.id,

      workspaceId: invite.workspaceId,

      userId: user.id,
    });
    return {
      message: 'Member added successfully to workspace',
    };
  }

  // =========================
  // DECLINE WORKSPACE INVITE
  // =========================

  async declineWorkspaceInvite(token: string) {
    const invite = await this.db.workspaceInvite.findUnique({
      where: {
        token,
      },
    });

    if (!invite) {
      throw new BadRequestException('Invalid invitation');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException(
        `Invitation already ${invite.status.toLowerCase()}`,
      );
    }

    await this.db.workspaceInvite.update({
      where: {
        id: invite.id,
      },
      data: {
        status: 'DECLINED',
      },
    });
    const user = await this.db.user.findUnique({
      where: {
        email: invite.email,
      },
    });
    await this.notificationsService.createNotification({
      title: 'Workspace Invitation Declined',

      message: `${invite.email} declined workspace invitation`,

      type: 'WORKSPACE_INVITE_DECLINED',

      triggeredById: user?.id,

      workspaceId: invite.workspaceId,

      userId: user?.id,
    });
    return {
      message: 'Workspace invitation declined successfully',
    };
  }
}
