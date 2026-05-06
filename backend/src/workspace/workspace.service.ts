import { Injectable, BadRequestException } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import type { Request } from 'express';

@Injectable()
export class WorkspaceService {
  constructor(private readonly db: DatabaseService) {}

  // ✅ Create workspace
  async createWorkspace(userId: string, dto: CreateWorkspaceDto) {
    const workspace = await this.db.workspace.create({
      data: {
        name: dto.name,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: 'ADMIN',
          },
        },
      },
    });

    return workspace;
  }

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
          role: m.role,
          ownerId: m.workspace.ownerId,
        })),
    };
  }
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

    return { workspace };
  }

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
      },
    });

    return { message: 'Workspace updated' };
  }

  async deleteWorkspace(workspaceId: string, userId: string) {
    // 🔍 1. Check workspace exists
    const workspace = await this.db.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new BadRequestException('Workspace not found');
    }

    // 🔐 2. Check membership
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

    // 👑 3. Only ADMIN can delete
    if (membership.role !== 'ADMIN') {
      throw new BadRequestException('Only admin can delete workspace');
    }

    // 🧹 4. Delete (handle relations)
    await this.db.workspace.delete({
      where: { id: workspaceId },
    });

    return { message: 'Workspace deleted successfully' };
  }
  async addMember(
    workspaceId: string,
    dto: AddMemberDto,
    currentUserId: string,
  ) {
    // 🔍 check admin
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

    // ❌ already exists
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

  async getWorkspaceMembers(workspaceId: string, userId: string) {
    // check access
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

    // prevent removing yourself (optional)
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

  async updateMemberRole(
    workspaceId: string,
    dto: { userId: string; role: string },
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
      throw new BadRequestException('Only admin can change roles');
    }

    await this.db.membership.update({
      where: {
        userId_workspaceId: {
          userId: dto.userId,
          workspaceId,
        },
      },
      data: {
        role: dto.role,
      },
    });

    return { message: 'Role updated' };
  }
}
