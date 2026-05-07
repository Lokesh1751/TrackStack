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
            role: 'ADMIN',
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
          role: m.role,
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

    return {
      workspace: {
        ...workspace,
        role: membership.role,
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

    if (membership.role !== 'ADMIN') {
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

    if (membership.role !== 'ADMIN') {
      throw new BadRequestException('Only admin can delete workspace');
    }

    await this.db.workspace.delete({
      where: { id: workspaceId },
    });

    return { message: 'Workspace deleted successfully' };
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

    if (!membership || membership.role !== 'ADMIN') {
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

    await this.db.membership.create({
      data: {
        userId: dto.userId,
        workspaceId,
        role: dto.role,
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

    if (!current || current.role !== 'ADMIN') {
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

    return { message: 'Member removed' };
  }
}
