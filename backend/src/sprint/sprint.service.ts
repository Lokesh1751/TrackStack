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

  async getProjectSprints(projectId: string, userId: string) {
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

  async getBacklogTasks(projectId: string, userId: string) {
    const project = await this.db.project.findUnique({
      where: { id: projectId },
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

    const tasks = await this.db.task.findMany({
      where: {
        projectId,
        sprintId: null,
      },
      include: {
        assignee: {
          select: { id: true, email: true },
        },
        reporter: {
          select: { id: true, email: true },
        },
        _count: {
          select: { comments: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      tasks: tasks.map((t) => ({
        ...t,
        commentsCount: t._count.comments,
      })),
    };
  }
}
