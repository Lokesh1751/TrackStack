import {
  BadRequestException,
  Injectable,
  ForbiddenException,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';

import { randomUUID } from 'crypto';

import { DatabaseService } from 'src/database/database.service';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';
import { Resend } from 'resend';
import { inviteMemberTemplate } from '@/mail/templates/invite-member.template';
import { NotificationsService } from '@/notifications/notifications.service';

@Injectable()
export class ProjectService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async sendProjectInvitationEmail(
    email: string,
    projectName: string,
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
      subject: `Invitation to join ${projectName}`,
      html: inviteMemberTemplate(invitedBy, projectName, inviteLink),
    });

    if (error) {
      throw new InternalServerErrorException('Failed to send invitation email');
    }
  }

  // =========================
  // COMMON ACCESS CHECK
  // =========================

  private async validateWorkspaceAccess(workspaceId: string, userId: string) {
    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId,
        },
      },
    });

    // ✅ Allow Super Admin globally
    if (!membership) {
      const user = await this.db.user.findUnique({
        where: {
          id: userId,
        },

        select: {
          isSuperAdmin: true,
        },
      });

      if (!user?.isSuperAdmin) {
        throw new UnauthorizedException('Access denied');
      }

      return {
        role: 'SUPER_ADMIN',
      };
    }

    return membership;
  }

  // =========================
  // CREATE PROJECT
  // =========================

  async createProject(
    workspaceId: string,
    dto: CreateProjectDto,
    userId: string,
  ) {
    const membership = await this.validateWorkspaceAccess(workspaceId, userId);

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

    // =========================
    // CREATE PROJECT
    // =========================

    const project = await this.db.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        workspaceId,
      },
    });

    // =========================
    // AUTO ADD ONLY WORKSPACE ADMIN
    // AS PROJECT MEMBER
    // =========================

    if (membership.role === 'ADMIN') {
      await this.db.projectMember.create({
        data: {
          projectId: project.id,
          userId,
          role: 'ADMIN',
        },
      });
    }
    await this.notificationsService.createNotification({
      title: 'New Project Created',

      message: `${project.name} project has been created`,

      type: 'PROJECT_CREATED',

      triggeredById: userId,

      workspaceId,

      projectId: project.id,
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
    const membership = await this.validateWorkspaceAccess(workspaceId, userId);

    let projects: {
      sprints?: {
        id: string;
        name: string;
        status: string;
        startDate: Date | null;
        endDate: Date | null;
      }[];
    }[] = [];

    // =========================
    // SUPER ADMIN
    // =========================

    if (membership.role === 'SUPER_ADMIN') {
      projects = await this.db.project.findMany({
        where: {
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
    }

    // =========================
    // ADMIN
    // =========================
    else if (membership.role === 'ADMIN') {
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
    }

    // =========================
    // MEMBER
    // =========================
    else {
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
      projects: projects.map((project) => ({
        ...project,
        activeSprint: project.sprints?.[0] || null,
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

    await this.validateWorkspaceAccess(project.workspaceId, userId);

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

    const membership = await this.validateWorkspaceAccess(
      project.workspaceId,
      userId,
    );

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
    await this.notificationsService.createNotification({
      title: 'Project Updated',

      message: `${updatedProject.name} project updated`,

      type: 'PROJECT_UPDATED',

      triggeredById: userId,

      workspaceId: project.workspaceId,

      projectId,
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

    const membership = await this.validateWorkspaceAccess(
      project.workspaceId,
      userId,
    );

    if (membership.role !== 'ADMIN' && membership.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only admin can delete project');
    }

    // =====================================================
    // NOTIFICATION
    // =====================================================

    await this.notificationsService.createNotification({
      title: 'Project Deleted',

      message: `${project.name} project deleted`,

      type: 'PROJECT_DELETED',

      triggeredById: userId,

      workspaceId: project.workspaceId,

      projectId: project.id,
    });

    // =====================================================
    // DELETE PROJECT
    // =====================================================

    await this.db.project.delete({
      where: {
        id: projectId,
      },
    });

    return {
      message: 'Project deleted successfully',
    };
  }

  // =========================
  // ADD PROJECT MEMBER
  // =========================

  // =========================
  // ADD PROJECT MEMBER
  // =========================

  async addProjectMember(
    projectId: string,
    dto: AddProjectMemberDto,
    currentUserId: string | undefined,
  ) {
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

    const currentMembership = await this.validateWorkspaceAccess(
      project.workspaceId,
      currentUserId,
    );

    if (
      currentMembership.role !== 'ADMIN' &&
      currentMembership.role !== 'SUPER_ADMIN'
    ) {
      throw new BadRequestException('Only admin can invite project members');
    }

    const user = await this.db.user.findUnique({
      where: {
        email: dto.email,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

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

    // =========================
    // CHECK EXISTING INVITE
    // =========================

    const existingInvite = await this.db.projectInvite.findFirst({
      where: {
        projectId,
        email: dto.email,
        status: 'PENDING',
      },
    });

    if (existingInvite) {
      throw new BadRequestException('Invitation already sent');
    }

    // =========================
    // CREATE INVITATION
    // =========================

    const token = randomUUID();

    const invitation = await this.db.projectInvite.create({
      data: {
        email: dto.email,
        token,
        invitedById: currentUserId,
        projectId,
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
      },
    });

    // =========================
    // SEND EMAIL
    // =========================

    const inviteLink = `${process.env.FRONTEND_URL}/invite/${token}?projectName=${project.name}`;

    const inviter = await this.db.user.findUnique({
      where: {
        id: currentUserId,
      },
    });

    await this.sendProjectInvitationEmail(
      dto.email,
      project.name,
      inviteLink,
      inviter?.email || 'TrackStack Admin',
    );
    await this.notificationsService.createNotification({
      title: 'Project Invitation Sent',

      message: `${dto.email} invited to ${project.name}`,

      type: 'PROJECT_MEMBER_INVITED',

      triggeredById: currentUserId,

      userId: user.id,

      workspaceId: project.workspaceId,

      projectId: project.id,
    });

    return {
      message: 'Invitation sent successfully',
      invitation,
    };
  }

  // =========================
  // GET PROJECT MEMBERS
  // =========================

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

  // =========================
  // REMOVE PROJECT MEMBER
  // =========================

  async removeProjectMember(
    projectId: string,
    memberUserId: string,
    currentUserId: string | undefined,
  ) {
    const project = await this.db.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    if (!currentUserId) {
      throw new BadRequestException('Login First');
    }

    const workspaceMembership = await this.validateWorkspaceAccess(
      project.workspaceId,
      currentUserId,
    );

    if (
      workspaceMembership.role !== 'ADMIN' &&
      workspaceMembership.role !== 'SUPER_ADMIN'
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

  async acceptInvite(token: string) {
    const invite = await this.db.projectInvite.findUnique({
      where: { token },
    });

    if (!invite) {
      throw new BadRequestException('Invalid invite');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException('Invite already processed');
    }

    const user = await this.db.user.findUnique({
      where: {
        email: invite.email,
      },
    });

    const project = await this.db.project.findUnique({
      where: {
        id: invite.projectId,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    await this.db.projectMember.create({
      data: {
        projectId: invite.projectId,
        userId: user.id,
      },
    });

    await this.db.projectInvite.update({
      where: {
        id: invite.id,
      },
      data: {
        status: 'ACCEPTED',
      },
    });
    await this.notificationsService.createNotification({
      title: 'Project Invitation Accepted',

      message: `${user.email} joined ${project?.name}`,

      type: 'PROJECT_MEMBER_JOINED',

      triggeredById: user.id,

      userId: user.id,

      projectId: invite.projectId,
    });

    return {
      message: 'Member Added Successfully to project',
    };
  }

  async declineInvite(token: string) {
    const invite = await this.db.projectInvite.findUnique({
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

    await this.db.projectInvite.update({
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

    const project = await this.db.project.findUnique({
      where: {
        id: invite.projectId,
      },
    });
    await this.notificationsService.createNotification({
      title: 'Project Invitation Declined',

      message: `${invite.email} declined invitation for ${project?.name}`,

      type: 'PROJECT_MEMBER_REMOVED',

      triggeredById: user?.id,

      userId: user?.id,

      projectId: invite.projectId,
    });

    return {
      message: 'Invitation declined successfully',
    };
  }
}
