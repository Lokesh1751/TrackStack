import { Injectable, BadRequestException } from '@nestjs/common';
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
        role: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // ✅ only ADMIN / SUPER_ADMIN can create workspace
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only admin can create workspace');
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
      where: { userId },

      include: {
        workspace: true,
        user: {
          select: {
            role: true,
          },
        },
      },
    });

    return {
      workspaces: memberships
        .filter((m) => m.workspace !== null)
        .map((m) => ({
          id: m.workspace.id,
          name: m.workspace.name,
          slug: m.workspace.slug,
          description: m.workspace.description,
          logoUrl: m.workspace.logoUrl,
          ownerId: m.workspace.ownerId,
          createdAt: m.workspace.createdAt,
          updatedAt: m.workspace.updatedAt,

          // ✅ role from user table
          role: m.user.role,
        })),
    };
  }

  // =========================
  // GET WORKSPACE BY ID
  // =========================
  async getWorkspaceById(workspaceId: string, userId: string) {
    const workspace = await this.db.workspace.findUnique({
      where: { id: workspaceId },
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
      where: { id: userId },
      select: {
        role: true,
      },
    });

    return {
      workspace: {
        ...workspace,
        role: user?.role || 'MEMBER',
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
      where: { id: userId },
      select: {
        role: true,
      },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      throw new BadRequestException('Only admin can edit workspace');
    }

    await this.db.workspace.update({
      where: { id: workspaceId },
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
        logoUrl: dto.logoUrl,
      },
    });

    return { message: 'Workspace updated' };
  }

  // =========================
  // DELETE WORKSPACE
  // =========================
  async deleteWorkspace(workspaceId: string, userId: string) {
    const workspace = await this.db.workspace.findUnique({
      where: { id: workspaceId },
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
      where: { id: userId },
      select: {
        role: true,
      },
    });

    if (!user || (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN')) {
      throw new BadRequestException('Only admin can delete workspace');
    }

    await this.db.workspace.delete({
      where: { id: workspaceId },
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
    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: currentUserId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new BadRequestException('Access denied');
    }

    const currentUser = await this.db.user.findUnique({
      where: { id: currentUserId },
      select: {
        role: true,
      },
    });

    if (
      !currentUser ||
      (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')
    ) {
      throw new BadRequestException('Only admin can add members');
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

    // ✅ check if another ADMIN already exists
    if (dto.role === 'ADMIN') {
      const existingAdmin = await this.db.user.findFirst({
        where: {
          role: 'ADMIN',

          memberships: {
            some: {
              workspaceId,
            },
          },
        },
      });

      if (existingAdmin) {
        throw new BadRequestException('Workspace already has an admin');
      }
    }

    // ✅ update user role
    await this.db.user.update({
      where: { id: dto.userId },
      data: {
        role: dto.role,
      },
    });

    // ✅ create membership
    await this.db.membership.create({
      data: {
        userId: dto.userId,
        workspaceId,
      },
    });

    return { message: 'Member added' };
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

    if (!membership) {
      throw new BadRequestException('Access denied');
    }

    const members = await this.db.membership.findMany({
      where: { workspaceId },

      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return {
      members: members.map((m) => ({
        id: m.id,
        userId: m.userId,
        email: m.user.email,

        // ✅ role from user table
        role: m.user.role,
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
    const current = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: currentUserId,
          workspaceId,
        },
      },
    });

    if (!current) {
      throw new BadRequestException('Access denied');
    }

    const currentUser = await this.db.user.findUnique({
      where: { id: currentUserId },
      select: {
        role: true,
      },
    });

    if (
      !currentUser ||
      (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN')
    ) {
      throw new BadRequestException('Only admin can remove members');
    }

    if (memberUserId === currentUserId) {
      throw new BadRequestException('You cannot remove yourself');
    }

    await this.db.membership.delete({
      where: {
        userId_workspaceId: {
          userId: memberUserId,
          workspaceId,
        },
      },
    });

    // ✅ reset removed user role to MEMBER
    await this.db.user.update({
      where: { id: memberUserId },
      data: {
        role: 'MEMBER',
      },
    });

    return { message: 'Member removed' };
  }
}
