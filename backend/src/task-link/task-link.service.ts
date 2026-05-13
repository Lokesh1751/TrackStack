import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { DatabaseService } from 'src/database/database.service';

import { TaskLinkType } from '@prisma/client';

@Injectable()
export class TaskLinksService {
  constructor(private readonly db: DatabaseService) {}

  // =====================================
  // LINK TASK
  // =====================================

  async linkTask(
    sourceTaskId: string,
    targetTaskId: string,
    type: TaskLinkType,
    userId: string,
  ) {
    if (sourceTaskId === targetTaskId) {
      throw new BadRequestException('Task cannot be linked to itself');
    }

    // =====================================
    // SOURCE TASK
    // =====================================

    const sourceTask = await this.db.task.findUnique({
      where: {
        id: sourceTaskId,
      },

      include: {
        project: true,
      },
    });

    if (!sourceTask) {
      throw new BadRequestException('Source task not found');
    }

    // =====================================
    // TARGET TASK
    // =====================================

    const targetTask = await this.db.task.findUnique({
      where: {
        id: targetTaskId,
      },

      include: {
        project: true,
      },
    });

    if (!targetTask) {
      throw new BadRequestException('Target task not found');
    }

    // =====================================
    // SAME PROJECT VALIDATION
    // =====================================

    if (sourceTask.projectId !== targetTask.projectId) {
      throw new BadRequestException('Tasks must belong to same project');
    }

    // =====================================
    // ACCESS CHECK
    // =====================================

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: sourceTask.project.workspaceId,
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Access denied');
    }

    // =====================================
    // DUPLICATE CHECK
    // =====================================

    const existingLink = await this.db.taskLink.findFirst({
      where: {
        sourceTaskId,
        targetTaskId,
        type,
      },
    });

    if (existingLink) {
      throw new BadRequestException('Task link already exists');
    }

    // =====================================
    // CREATE LINK
    // =====================================

    const link = await this.db.taskLink.create({
      data: {
        sourceTaskId,
        targetTaskId,
        type,
      },

      include: {
        sourceTask: {
          select: {
            id: true,
            title: true,
            taskKey: true,
          },
        },

        targetTask: {
          select: {
            id: true,
            title: true,
            taskKey: true,
          },
        },
      },
    });

    return {
      message: 'Task linked successfully',
      link,
    };
  }

  // =====================================
  // GET TASK LINKS
  // =====================================

  async getTaskLinks(taskId: string, userId: string) {
    const task = await this.db.task.findUnique({
      where: {
        id: taskId,
      },

      include: {
        project: true,
      },
    });

    if (!task) {
      throw new BadRequestException('Task not found');
    }

    // =====================================
    // ACCESS CHECK
    // =====================================

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: task.project.workspaceId,
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Access denied');
    }

    // =====================================
    // LINKS FROM THIS TASK
    // =====================================

    const linkedTasks = await this.db.taskLink.findMany({
      where: {
        sourceTaskId: taskId,
      },

      include: {
        targetTask: {
          select: {
            id: true,
            title: true,
            taskKey: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    // =====================================
    // LINKS TO THIS TASK
    // =====================================

    const linkedFromTasks = await this.db.taskLink.findMany({
      where: {
        targetTaskId: taskId,
      },

      include: {
        sourceTask: {
          select: {
            id: true,
            title: true,
            taskKey: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    return {
      linkedTasks,
      linkedFromTasks,
    };
  }

  // =====================================
  // REMOVE TASK LINK
  // =====================================

  async removeTaskLink(linkId: string, userId: string) {
    const link = await this.db.taskLink.findUnique({
      where: {
        id: linkId,
      },

      include: {
        sourceTask: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!link) {
      throw new BadRequestException('Task link not found');
    }

    // =====================================
    // ACCESS CHECK
    // =====================================

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: link.sourceTask.project.workspaceId,
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Access denied');
    }

    const canDelete =
      membership.role === 'ADMIN' || membership.role === 'SUPER_ADMIN';

    if (!canDelete) {
      throw new ForbiddenException('Only admins can remove task links');
    }

    await this.db.taskLink.delete({
      where: {
        id: linkId,
      },
    });

    return {
      message: 'Task link removed successfully',
    };
  }

  // =====================================
  // UPDATE TASK LINK TYPE
  // =====================================

  async updateTaskLink(linkId: string, type: TaskLinkType, userId: string) {
    const link = await this.db.taskLink.findUnique({
      where: {
        id: linkId,
      },

      include: {
        sourceTask: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!link) {
      throw new BadRequestException('Task link not found');
    }

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: link.sourceTask.project.workspaceId,
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Access denied');
    }

    const updatedLink = await this.db.taskLink.update({
      where: {
        id: linkId,
      },

      data: {
        type: type,
      },

      include: {
        sourceTask: {
          select: {
            id: true,
            title: true,
            taskKey: true,
            status: true,
          },
        },

        targetTask: {
          select: {
            id: true,
            title: true,
            taskKey: true,
            status: true,
          },
        },
      },
    });

    return {
      message: 'Task link updated successfully',
      link: updatedLink,
    };
  }
}
