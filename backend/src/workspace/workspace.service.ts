// workspace.service.ts

import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { DatabaseService } from 'src/database/database.service';

import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';

@Injectable()
export class WorkspaceService {
  constructor(private readonly db: DatabaseService) {}

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

    return {
      message: 'Workspace created successfully',
      workspace,
    };
  }

  // =========================
  // GET USER WORKSPACES
  // =========================
  async getUserWorkspaces(userId: string) {
    const memberships = await this.db.membership.findMany({
      where: {
        userId,
      },

      include: {
        workspace: true,
      },
    });

    return {
      workspaces: memberships
        .filter((m) => m.workspace)
        .map((m) => ({
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          description: m.workspace.description,
          logoUrl: m.workspace.logoUrl,
          ownerId: m.workspace.ownerId,
          createdAt: m.workspace.createdAt,
          updatedAt: m.workspace.updatedAt,

          // ✅ workspace specific role
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

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new BadRequestException('Access denied');
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
        role: membership.role,
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
    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new BadRequestException('Access denied');
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
    if (membership.role !== 'ADMIN' && !user?.isSuperAdmin) {
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

    // ✅ SUPER_ADMIN bypass
    if (!currentUser?.isSuperAdmin) {
      if (!currentMembership) {
        throw new BadRequestException('Access denied');
      }

      if (currentMembership.role !== 'ADMIN') {
        throw new BadRequestException('Only admin can add members');
      }
    }

    const workspace = await this.db.workspace.findUnique({
      where: {
        id: workspaceId,
      },
    });

    if (!workspace) {
      throw new BadRequestException('Workspace not found');
    }

    const user = await this.db.user.findUnique({
      where: {
        id: dto.userId,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const exists = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: dto.userId,
          workspaceId,
        },
      },
    });

    if (exists) {
      throw new BadRequestException('User already a member');
    }

    // ✅ only one admin allowed
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

    await this.db.membership.create({
      data: {
        userId: dto.userId,
        workspaceId,
        role: dto.role,
      },
    });

    return {
      message: 'Member added',
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
    // 4. Execution
    return this.db.membership.update({
      where: { userId_workspaceId: { userId: targetUserId, workspaceId } },
      data: { role: newRole },
    });
  }
}
