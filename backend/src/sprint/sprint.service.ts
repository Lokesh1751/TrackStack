// ======================================================
// SPRINT SERVICE
// ======================================================

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { SprintStatus } from '@prisma/client';

import { DatabaseService } from 'src/database/database.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { NotificationsService } from '@/notifications/notifications.service';

@Injectable()
export class SprintService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ======================================================
  // HELPER -> SUPER ADMIN CHECK
  // ======================================================

  private async isSuperAdmin(userId: string) {
    const user = await this.db.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        isSuperAdmin: true,
      },
    });

    return user?.isSuperAdmin === true;
  }

  // ======================================================
  // CREATE SPRINT
  // ======================================================

  async createSprint(projectId: string, dto: CreateSprintDto, userId: string) {
    const project = await this.db.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const superAdmin = await this.isSuperAdmin(userId);

    let membership: any = null;

    if (!superAdmin) {
      membership = await this.db.membership.findUnique({
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
        throw new BadRequestException('Only admin can create sprint');
      }
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException(
        'Sprint end date must be greater than start date',
      );
    }

    const overlappingSprint = await this.db.sprint.findFirst({
      where: {
        projectId,

        AND: [
          {
            startDate: {
              lte: endDate,
            },
          },
          {
            endDate: {
              gte: startDate,
            },
          },
        ],
      },
    });

    if (overlappingSprint) {
      throw new BadRequestException(
        `Sprint date overlaps with existing sprint "${overlappingSprint.name}"`,
      );
    }

    if (dto.status === SprintStatus.ACTIVE) {
      const activeSprint = await this.db.sprint.findFirst({
        where: {
          projectId,
          status: SprintStatus.ACTIVE,
        },
      });

      if (activeSprint) {
        throw new BadRequestException('Only one active sprint allowed');
      }
    }

    const sprint = await this.db.sprint.create({
      data: {
        name: dto.name,
        goal: dto.goal,
        startDate,
        endDate,
        status: dto.status || SprintStatus.PLANNED,
        projectId,
        createdById: userId,
      },
    });

    await this.notificationsService.createNotification({
      title: 'Sprint Created',

      message: `${sprint.name} sprint created in project`,

      type: 'SPRINT_CREATED',

      triggeredById: userId,

      workspaceId: project.workspaceId,

      projectId,
    });

    return {
      message: 'Sprint created successfully',
      sprint,
    };
  }

  // ======================================================
  // GET PROJECT SPRINTS
  // ======================================================

  async getProjectSprints(
    projectId: string,
    userId: string,
    filters?: {
      status?: SprintStatus;
      search?: string;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const project = await this.db.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const superAdmin = await this.isSuperAdmin(userId);

    if (!superAdmin) {
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
    }

    const sprints = await this.db.sprint.findMany({
      where: {
        projectId,

        ...(filters?.status && {
          status: filters.status,
        }),

        ...(filters?.search && {
          OR: [
            {
              name: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },

            {
              goal: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },
          ],
        }),

        ...((filters?.startDate || filters?.endDate) && {
          startDate: {
            ...(filters?.startDate && {
              gte: new Date(filters.startDate),
            }),

            ...(filters?.endDate && {
              lte: new Date(filters.endDate),
            }),
          },
        }),
      },

      include: {
        tasks: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      sprints,
    };
  }

  // ======================================================
  // GET SINGLE SPRINT
  // ======================================================

  async getSprintById(sprintId: string, userId: string) {
    const sprint = await this.db.sprint.findUnique({
      where: {
        id: sprintId,
      },

      include: {
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },

        project: true,
      },
    });

    if (!sprint) {
      throw new BadRequestException('Sprint not found');
    }

    const superAdmin = await this.isSuperAdmin(userId);

    if (!superAdmin) {
      const membership = await this.db.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: sprint.project.workspaceId,
          },
        },
      });

      if (!membership) {
        throw new UnauthorizedException('Access denied');
      }
    }

    return {
      sprint,
    };
  }

  // ======================================================
  // UPDATE SPRINT
  // ======================================================

  async updateSprint(sprintId: string, dto: any, userId: string) {
    const sprint = await this.db.sprint.findUnique({
      where: {
        id: sprintId,
      },

      include: {
        project: true,
      },
    });

    if (!sprint) {
      throw new BadRequestException('Sprint not found');
    }

    const superAdmin = await this.isSuperAdmin(userId);

    if (!superAdmin) {
      const membership = await this.db.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: sprint.project.workspaceId,
          },
        },
      });

      if (!membership) {
        throw new UnauthorizedException('Access denied');
      }

      if (membership.role !== 'ADMIN' && membership.role !== 'SUPER_ADMIN') {
        throw new BadRequestException('Only admin can update sprint');
      }
    }

    if (dto.status === SprintStatus.ACTIVE) {
      const existingActiveSprint = await this.db.sprint.findFirst({
        where: {
          projectId: sprint.projectId,
          status: SprintStatus.ACTIVE,

          NOT: {
            id: sprintId,
          },
        },
      });

      if (existingActiveSprint) {
        throw new BadRequestException('Another active sprint already exists');
      }
    }

    const updatedSprint = await this.db.sprint.update({
      where: {
        id: sprintId,
      },

      data: {
        name: dto.name,
        goal: dto.goal,
        startDate: dto.startDate,
        endDate: dto.endDate,
        status: dto.status,
      },
    });

    await this.notificationsService.createNotification({
      title: 'Sprint Updated',

      message: `${updatedSprint.name} sprint updated`,

      type: 'SPRINT_UPDATED',

      triggeredById: userId,

      workspaceId: sprint.project.workspaceId,

      projectId: sprint.projectId,
    });

    return {
      message: 'Sprint updated successfully',
      sprint: updatedSprint,
    };
  }

  // ======================================================
  // DELETE SPRINT
  // ======================================================

  async deleteSprint(sprintId: string, userId: string) {
    const sprint = await this.db.sprint.findUnique({
      where: {
        id: sprintId,
      },

      include: {
        project: true,
      },
    });

    if (!sprint) {
      throw new BadRequestException('Sprint not found');
    }

    const superAdmin = await this.isSuperAdmin(userId);

    if (!superAdmin) {
      const membership = await this.db.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: sprint.project.workspaceId,
          },
        },
      });

      if (!membership) {
        throw new UnauthorizedException('Access denied');
      }

      if (membership.role !== 'ADMIN' && membership.role !== 'SUPER_ADMIN') {
        throw new BadRequestException('Only admin can delete sprint');
      }
    }

    await this.db.sprint.delete({
      where: {
        id: sprintId,
      },
    });
    await this.notificationsService.createNotification({
      title: 'Sprint Deleted',

      message: `${sprint.name} sprint deleted`,

      type: 'SPRINT_DELETED',

      triggeredById: userId,

      workspaceId: sprint.project.workspaceId,

      projectId: sprint.projectId,
    });

    return {
      message: 'Sprint deleted successfully',
    };
  }

  // ======================================================
  // START SPRINT
  // ======================================================

  async startSprint(sprintId: string, userId: string) {
    const sprint = await this.db.sprint.findUnique({
      where: {
        id: sprintId,
      },

      include: {
        project: true,
      },
    });

    if (!sprint) {
      throw new BadRequestException('Sprint not found');
    }

    const superAdmin = await this.isSuperAdmin(userId);

    if (!superAdmin) {
      const membership = await this.db.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: sprint.project.workspaceId,
          },
        },
      });

      if (!membership) {
        throw new UnauthorizedException('Access denied');
      }

      if (membership.role !== 'ADMIN' && membership.role !== 'SUPER_ADMIN') {
        throw new BadRequestException('Only admin can start sprint');
      }
    }

    const existingActiveSprint = await this.db.sprint.findFirst({
      where: {
        projectId: sprint.projectId,
        status: SprintStatus.ACTIVE,

        NOT: {
          id: sprintId,
        },
      },
    });

    if (existingActiveSprint) {
      throw new BadRequestException('Another sprint already active');
    }

    const updatedSprint = await this.db.sprint.update({
      where: {
        id: sprintId,
      },

      data: {
        status: SprintStatus.ACTIVE,
      },
    });

    await this.notificationsService.createNotification({
      title: 'Sprint Started',

      message: `${updatedSprint.name} sprint started`,

      type: 'SPRINT_STARTED',

      triggeredById: userId,

      workspaceId: sprint.project.workspaceId,

      projectId: sprint.projectId,
    });

    return {
      message: 'Sprint started',
      sprint: updatedSprint,
    };
  }

  // ======================================================
  // COMPLETE SPRINT
  // ======================================================

  async completeSprint(sprintId: string, userId: string) {
    const sprint = await this.db.sprint.findUnique({
      where: {
        id: sprintId,
      },

      include: {
        project: true,
      },
    });

    if (!sprint) {
      throw new BadRequestException('Sprint not found');
    }

    const superAdmin = await this.isSuperAdmin(userId);

    if (!superAdmin) {
      const membership = await this.db.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: sprint.project.workspaceId,
          },
        },
      });

      if (!membership) {
        throw new UnauthorizedException('Access denied');
      }

      if (membership.role !== 'ADMIN' && membership.role !== 'SUPER_ADMIN') {
        throw new BadRequestException('Only admin can complete sprint');
      }
    }

    await this.db.task.updateMany({
      where: {
        sprintId,
        status: {
          not: 'DONE',
        },
      },

      data: {
        status: 'DONE',
      },
    });

    const updatedSprint = await this.db.sprint.update({
      where: {
        id: sprintId,
      },

      data: {
        status: SprintStatus.COMPLETED,
      },
    });
    await this.notificationsService.createNotification({
      title: 'Sprint Completed',

      message: `${updatedSprint.name} sprint completed`,

      type: 'SPRINT_COMPLETED',

      triggeredById: userId,

      workspaceId: sprint.project.workspaceId,

      projectId: sprint.projectId,
    });
    return {
      message: 'Sprint completed',
      sprint: updatedSprint,
    };
  }

  // ======================================================
  // ADD TASK TO SPRINT
  // ======================================================

  async addTaskToSprint(sprintId: string, taskId: string, userId: string) {
    const sprint = await this.db.sprint.findUnique({
      where: {
        id: sprintId,
      },

      include: {
        project: true,
      },
    });

    if (!sprint) {
      throw new BadRequestException('Sprint not found');
    }

    const superAdmin = await this.isSuperAdmin(userId);

    if (!superAdmin) {
      const membership = await this.db.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: sprint.project.workspaceId,
          },
        },
      });

      if (!membership) {
        throw new UnauthorizedException('Access denied');
      }
    }

    const task = await this.db.task.findUnique({
      where: {
        id: taskId,
      },
    });

    if (!task) {
      throw new BadRequestException('Task not found');
    }

    const updatedTask = await this.db.task.update({
      where: {
        id: taskId,
      },

      data: {
        sprintId,
      },
    });

    await this.notificationsService.createNotification({
      title: 'Task Added To Sprint',

      message: `${task.title} added to ${sprint.name}`,

      type: 'TASK_ADDED_TO_SPRINT',

      triggeredById: userId,

      workspaceId: sprint.project.workspaceId,

      projectId: sprint.projectId,

      taskId: task.id,

      sprintId: sprint.id,

      userId: task.assigneeId || undefined,
    });

    return {
      message: 'Task added to sprint',
      task: updatedTask,
    };
  }

  // ======================================================
  // REMOVE TASK FROM SPRINT
  // ======================================================

  async removeTaskFromSprint(taskId: string, userId: string) {
    const task = await this.db.task.findUnique({
      where: {
        id: taskId,
      },

      include: {
        sprint: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!task) {
      throw new BadRequestException('Task not found');
    }

    const superAdmin = await this.isSuperAdmin(userId);

    if (!superAdmin && task.sprint) {
      const membership = await this.db.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: task.sprint.project.workspaceId,
          },
        },
      });

      if (!membership) {
        throw new UnauthorizedException('Access denied');
      }
    }

    const updatedTask = await this.db.task.update({
      where: {
        id: taskId,
      },

      data: {
        sprintId: null,
      },
    });
    await this.notificationsService.createNotification({
      title: 'Task Removed From Sprint',

      message: `${task.title} removed from sprint`,

      type: 'TASK_REMOVED_FROM_SPRINT',

      triggeredById: userId,

      workspaceId: task.sprint?.project.workspaceId,

      projectId: task.sprint?.projectId,

      taskId: task.id,

      sprintId: task.sprintId || undefined,

      userId: task.assigneeId || undefined,
    });
    return {
      message: 'Task removed from sprint',
      task: updatedTask,
    };
  }

  // ======================================================
  // SPRINT DASHBOARD
  // ======================================================

  async getSprintDashboard(sprintId: string, userId: string) {
    const sprint = await this.db.sprint.findUnique({
      where: {
        id: sprintId,
      },

      include: {
        project: true,

        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                email: true,
              },
            },
          },
        },

        snapshots: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!sprint) {
      throw new BadRequestException('Sprint not found');
    }

    const superAdmin = await this.isSuperAdmin(userId);

    if (!superAdmin) {
      const membership = await this.db.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId,
            workspaceId: sprint.project.workspaceId,
          },
        },
      });

      if (!membership) {
        throw new UnauthorizedException('Access denied');
      }
    }

    const tasks = sprint.tasks || [];

    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
      (task) => task.status === 'DONE',
    ).length;

    const pendingTasks = tasks.filter((task) => task.status !== 'DONE').length;

    const totalEstimate = tasks.reduce(
      (acc, task) => acc + (task.estimateMinutes || 0),
      0,
    );

    const completedEstimate = tasks
      .filter((task) => task.status === 'DONE')
      .reduce((acc, task) => acc + (task.estimateMinutes || 0), 0);

    const remainingEstimate = tasks
      .filter((task) => task.status !== 'DONE')
      .reduce((acc, task) => acc + (task.estimateMinutes || 0), 0);

    const statusDistribution = [
      {
        status: 'TODO',
        count: tasks.filter((task) => task.status === 'TODO').length,
      },

      {
        status: 'IN_PROGRESS',
        count: tasks.filter((task) => task.status === 'IN_PROGRESS').length,
      },

      {
        status: 'IN_REVIEW',
        count: tasks.filter((task) => task.status === 'IN_REVIEW').length,
      },

      {
        status: 'DONE',
        count: tasks.filter((task) => task.status === 'DONE').length,
      },
    ];

    const velocityMap = new Map();

    tasks.forEach((task) => {
      if (task.status === 'DONE' && task.assignee) {
        const email = task.assignee.email;

        const current = velocityMap.get(email) || 0;

        velocityMap.set(email, current + (task.estimateMinutes || 0));
      }
    });

    const velocityData = Array.from(velocityMap.entries()).map(
      ([email, estimate]) => ({
        email,
        estimate,
      }),
    );

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
        Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      );

      daysPassed = Math.max(0, totalDays - daysLeft);
    }

    const sprintProgress =
      totalEstimate > 0
        ? Math.round((completedEstimate / totalEstimate) * 100)
        : 0;

    let health = 'HEALTHY';

    const timeProgress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

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
    const burndownData = sprint.snapshots.map((snapshot) => ({
      date: snapshot.createdAt,
      remainingEstimate: snapshot.remainingEstimate,
    }));

    return {
      sprint: {
        id: sprint.id,
        name: sprint.name,
        status: sprint.status,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
      },

      stats: {
        totalTasks,
        completedTasks,
        pendingTasks,

        totalEstimate,
        completedEstimate,
        remainingEstimate,

        sprintProgress,

        totalDays,
        daysLeft,
        daysPassed,

        health,
      },

      statusDistribution,

      velocityData,

      burndownData,
    };
  }
}
