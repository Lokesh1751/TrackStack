import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { DatabaseService } from 'src/database/database.service';

import { TaskLinkType } from '@prisma/client';
import { NotificationsService } from '@/notifications/notifications.service';

@Injectable()
export class TaskLinksService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private async isSuperAdmin(userId: string) {
    const membership = await this.db.membership.findFirst({
      where: {
        userId,
        role: 'SUPER_ADMIN',
      },
    });

    return !!membership;
  }

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

    const isSuperAdmin = await this.isSuperAdmin(userId);

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: sourceTask.project.workspaceId,
        },
      },
    });

    if (!membership && !isSuperAdmin) {
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
            assigneeId: true,
          },
        },
      },
    });

    // =====================================
    // NOTIFICATION
    // =====================================

    await this.notificationsService.createNotification({
      title: 'Task Linked',

      message: `${link.sourceTask.taskKey} linked with ${link.targetTask.taskKey} as ${type}`,

      type: 'TASK_LINKED',

      triggeredById: userId,

      workspaceId: sourceTask.project.workspaceId,

      projectId: sourceTask.projectId,

      taskId: sourceTask.id,

      userId: link.targetTask.assigneeId || undefined,
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

    const isSuperAdmin = await this.isSuperAdmin(userId);

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: task.project.workspaceId,
        },
      },
    });

    if (!membership && !isSuperAdmin) {
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

        targetTask: {
          select: {
            id: true,
            taskKey: true,
            assigneeId: true,
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

    const isSuperAdmin = await this.isSuperAdmin(userId);

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: link.sourceTask.project.workspaceId,
        },
      },
    });

    if (!membership && !isSuperAdmin) {
      throw new UnauthorizedException('Access denied');
    }

    const canDelete =
      membership?.role === 'ADMIN' || membership?.role === 'SUPER_ADMIN';

    if (!canDelete && !isSuperAdmin) {
      throw new ForbiddenException('Only admins can remove task links');
    }

    // =====================================
    // NOTIFICATION
    // =====================================

    await this.notificationsService.createNotification({
      title: 'Task Link Removed',

      message: `Task link removed between ${link.sourceTask.taskKey} and ${link.targetTask.taskKey}`,

      type: 'TASK_LINK_REMOVED',

      triggeredById: userId,

      workspaceId: link.sourceTask.project.workspaceId,

      projectId: link.sourceTask.projectId,

      taskId: link.sourceTask.id,

      userId: link.targetTask.assigneeId || undefined,
    });

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

        targetTask: {
          select: {
            id: true,
            title: true,
            taskKey: true,
            assigneeId: true,
          },
        },
      },
    });

    if (!link) {
      throw new BadRequestException('Task link not found');
    }

    const isSuperAdmin = await this.isSuperAdmin(userId);

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: link.sourceTask.project.workspaceId,
        },
      },
    });

    if (!membership && !isSuperAdmin) {
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
            assigneeId: true,
          },
        },
      },
    });

    // =====================================
    // NOTIFICATION
    // =====================================

    await this.notificationsService.createNotification({
      title: 'Task Link Updated',

      message: `Task link type updated to ${type} between ${updatedLink.sourceTask.taskKey} and ${updatedLink.targetTask.taskKey}`,

      type: 'TASK_LINK_UPDATED',

      triggeredById: userId,

      workspaceId: link.sourceTask.project.workspaceId,

      projectId: link.sourceTask.projectId,

      taskId: link.sourceTask.id,

      userId: updatedLink.targetTask.assigneeId || undefined,
    });

    return {
      message: 'Task link updated successfully',
      link: updatedLink,
    };
  }
}
