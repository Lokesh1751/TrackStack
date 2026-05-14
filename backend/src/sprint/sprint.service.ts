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

@Injectable()
export class SprintService {
  constructor(private readonly db: DatabaseService) {}

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

    // =====================================
    // WORKSPACE MEMBERSHIP
    // =====================================

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

    // =====================================
    // ONLY ADMIN / SUPER ADMIN
    // =====================================

    if (membership.role !== 'ADMIN' && membership.role !== 'SUPER_ADMIN') {
      throw new BadRequestException('Only admin can create sprint');
    }

    // =====================================
    // VALIDATE DATE RANGE
    // =====================================

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate >= endDate) {
      throw new BadRequestException(
        'Sprint end date must be greater than start date',
      );
    }

    // =====================================
    // CHECK OVERLAPPING SPRINTS
    // =====================================

    /**
     * overlap conditions:
     *
     * existing.start <= new.end
     * AND
     * existing.end >= new.start
     */

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

    // =====================================
    // ONLY ONE ACTIVE SPRINT
    // =====================================

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

    // =====================================
    // CREATE SPRINT
    // =====================================

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

    // active sprint check
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

    await this.db.sprint.delete({
      where: {
        id: sprintId,
      },
    });

    return {
      message: 'Sprint deleted successfully',
    };
  }

  // ======================================================
  // START SPRINT
  // ======================================================

  async startSprint(sprintId: string) {
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

    return {
      message: 'Sprint started',
      sprint: updatedSprint,
    };
  }

  // ======================================================
  // COMPLETE SPRINT
  // ======================================================

  async completeSprint(sprintId: string) {
    const sprint = await this.db.sprint.findUnique({
      where: {
        id: sprintId,
      },
    });

    if (!sprint) {
      throw new BadRequestException('Sprint not found');
    }

    // close unfinished tasks
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

    return {
      message: 'Sprint completed',
      sprint: updatedSprint,
    };
  }

  // ======================================================
  // ADD TASK TO SPRINT
  // ======================================================

  async addTaskToSprint(sprintId: string, taskId: string) {
    const sprint = await this.db.sprint.findUnique({
      where: {
        id: sprintId,
      },
    });

    if (!sprint) {
      throw new BadRequestException('Sprint not found');
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

    return {
      message: 'Task added to sprint',
      task: updatedTask,
    };
  }

  // ======================================================
  // REMOVE TASK FROM SPRINT
  // ======================================================

  async removeTaskFromSprint(taskId: string) {
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
        sprintId: null,
      },
    });

    return {
      message: 'Task removed from sprint',
      task: updatedTask,
    };
  }

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

    // =========================
    // MEMBERSHIP CHECK
    // =========================

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

    const tasks = sprint.tasks || [];

    // =========================
    // TASK COUNTS
    // =========================

    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
      (task) => task.status === 'DONE',
    ).length;

    const pendingTasks = tasks.filter((task) => task.status !== 'DONE').length;

    // =========================
    // ESTIMATES
    // =========================

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

    // =========================
    // STATUS DISTRIBUTION
    // =========================

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

    // =========================
    // TEAM VELOCITY
    // =========================

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

    // =========================
    // DAYS
    // =========================

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

    // =========================
    // PROGRESS
    // =========================

    const sprintProgress =
      totalEstimate > 0
        ? Math.round((completedEstimate / totalEstimate) * 100)
        : 0;

    // =========================
    // HEALTH
    // =========================

    let health = 'HEALTHY';

    const timeProgress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

    if (sprintProgress + 10 < timeProgress) {
      health = 'DELAYED';
    } else if (Math.abs(sprintProgress - timeProgress) <= 10) {
      health = 'AT_RISK';
    }

    // =========================
    // BURNDOWN
    // =========================

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
