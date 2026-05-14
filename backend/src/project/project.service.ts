import {
  BadRequestException,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

import { DatabaseService } from 'src/database/database.service';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';

@Injectable()
export class ProjectService {
  constructor(private readonly db: DatabaseService) {}

  // =========================
  // CREATE PROJECT
  // =========================
  async createProject(
    workspaceId: string,
    dto: CreateProjectDto,
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
      throw new UnauthorizedException('Access denied');
    }

    if (membership.role !== 'ADMIN' && membership.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only admin can create projects');
    }

    const existingProject = await this.db.project.findFirst({
      where: {
        workspaceId,
        name: dto.name,
      },
    });

    if (existingProject) {
      throw new BadRequestException('Project with same name already exists');
    }

    const project = await this.db.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        workspaceId,
      },
    });

    return {
      message: 'Project created successfully',
      project,
    };
  }

  // =========================
  // GET ALL PROJECTS
  // =========================
  async getProjects(workspaceId: string, userId: string, search?: string) {
    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Access denied');
    }

    let projects: any[] = [];

    // =========================
    // ADMIN / SUPER ADMIN
    // =========================

    if (membership.role === 'ADMIN' || membership.role === 'SUPER_ADMIN') {
      projects = await this.db.project.findMany({
        where: {
          workspaceId,

          ...(search && {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }),
        },

        include: {
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
        },

        orderBy: {
          createdAt: 'desc',
        },
      });
    } else {
      // =========================
      // MEMBER
      // =========================

      projects = await this.db.project.findMany({
        where: {
          workspaceId,

          members: {
            some: {
              userId,
            },
          },

          ...(search && {
            OR: [
              {
                name: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
              {
                description: {
                  contains: search,
                  mode: 'insensitive',
                },
              },
            ],
          }),
        },

        include: {
          members: true,

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
        },

        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    return {
      projects: projects.map((project: any) => ({
        ...project,
        activeSprint: project.sprints[0] || null,
        sprints: undefined,
      })),
    };
  }

  // =========================
  // GET PROJECT BY ID
  // =========================
  async getProjectById(projectId: string, userId: string) {
    const project = await this.db.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: project.workspaceId,
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Access denied');
    }

    return {
      project,
    };
  }

  // =========================
  // UPDATE PROJECT
  // =========================
  async updateProject(
    projectId: string,
    dto: UpdateProjectDto,
    userId: string,
  ) {
    const project = await this.db.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: project.workspaceId,
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Access denied');
    }

    if (membership.role !== 'ADMIN' && membership.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only admin can update project');
    }

    if (dto.name) {
      const existingProject = await this.db.project.findFirst({
        where: {
          workspaceId: project.workspaceId,
          name: dto.name,

          NOT: {
            id: projectId,
          },
        },
      });

      if (existingProject) {
        throw new BadRequestException('Project with same name already exists');
      }
    }

    const updatedProject = await this.db.project.update({
      where: {
        id: projectId,
      },

      data: {
        name: dto.name,
        description: dto.description,
      },
    });

    return {
      message: 'Project updated successfully',
      project: updatedProject,
    };
  }

  // =========================
  // DELETE PROJECT
  // =========================
  async deleteProject(projectId: string, userId: string) {
    const project = await this.db.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: project.workspaceId,
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Access denied');
    }

    if (membership.role !== 'ADMIN' && membership.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only admin can delete project');
    }

    await this.db.project.delete({
      where: {
        id: projectId,
      },
    });

    return {
      message: 'Project deleted successfully',
    };
  }

  async addProjectMember(
    projectId: string,
    dto: AddProjectMemberDto,
    currentUserId: string | undefined,
  ) {
    // project exists
    const project = await this.db.project.findUnique({
      where: {
        id: projectId,
      },

      include: {
        workspace: true,
      },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }
    if (!currentUserId) {
      throw new BadRequestException('Login First');
    }
    // current user workspace membership
    const currentMembership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: currentUserId,
          workspaceId: project.workspaceId,
        },
      },
    });

    if (
      !currentMembership ||
      (currentMembership.role !== 'ADMIN' &&
        currentMembership.role !== 'SUPER_ADMIN')
    ) {
      throw new BadRequestException('Only admin can invite project members');
    }

    // find user by email
    const user = await this.db.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // already added
    const existing = await this.db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User already added to project');
    }

    await this.db.projectMember.create({
      data: {
        projectId,
        userId: user.id,
      },
    });

    return {
      message: 'Project member added successfully',
    };
  }

  async getProjectMembers(projectId: string, search?: string) {
    const members = await this.db.projectMember.findMany({
      where: {
        projectId,

        ...(search && {
          user: {
            email: {
              contains: search,
              mode: 'insensitive',
            },
          },
        }),
      },

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

  async removeProjectMember(
    projectId: string,
    memberUserId: string,
    currentUserId: string | undefined,
  ) {
    const project = await this.db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }
    if (!currentUserId) {
      throw new BadRequestException('Login First');
    }

    const workspaceMembership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: currentUserId,
          workspaceId: project.workspaceId,
        },
      },
    });

    if (
      !workspaceMembership ||
      (workspaceMembership.role !== 'ADMIN' &&
        workspaceMembership.role !== 'SUPER_ADMIN')
    ) {
      throw new ForbiddenException('Only admin can remove members');
    }

    await this.db.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId: memberUserId,
        },
      },
    });

    return {
      message: 'Project member removed',
    };
  }
}
