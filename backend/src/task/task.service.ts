import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { DatabaseService } from 'src/database/database.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

import { randomUUID } from 'crypto';
import { TaskStatus, TaskPriority, TaskType } from '@prisma/client';
import { NotificationsService } from '@/notifications/notifications.service';

@Injectable()
export class TasksService {
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
  // CREATE TASK
  // =====================================

  async createTask(projectId: string, dto: CreateTaskDto, userId: string) {
    const project = await this.db.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const isSuperAdmin = await this.isSuperAdmin(userId);

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: project.workspaceId,
        },
      },
    });

    if (!membership && !isSuperAdmin) {
      throw new UnauthorizedException('Access denied');
    }

    const projectMember = await this.db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    const canCreateTask = !!projectMember || membership?.role === 'ADMIN';

    if (!canCreateTask) {
      throw new ForbiddenException(
        'Only project members or workspace admins can create tasks',
      );
    }

    // =====================================
    // VALIDATE SPRINT
    // =====================================

    if (dto.sprintId) {
      const sprint = await this.db.sprint.findUnique({
        where: {
          id: dto.sprintId,
        },
      });

      if (!sprint) {
        throw new BadRequestException('Sprint not found');
      }

      if (sprint.projectId !== projectId) {
        throw new BadRequestException('Sprint does not belong to this project');
      }

      if (sprint.status === 'COMPLETED') {
        throw new BadRequestException('Sprint is already Completed');
      }
    }

    const taskKey = `TSK-${randomUUID().slice(0, 8).toUpperCase()}`;

    const task = await this.db.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        projectId,

        // SPRINT
        sprintId: dto.sprintId || null,

        reporterId: userId,

        assigneeId: dto.assigneeId,

        type: dto.type,
        priority: dto.priority,
        status: dto.status,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        estimateMinutes: dto.estimateMinutes,
        taskKey,
      },

      include: {
        reporter: {
          select: {
            id: true,
            email: true,
          },
        },

        assignee: {
          select: {
            id: true,
            email: true,
          },
        },

        sprint: true,
      },
    });
    await this.notificationsService.createNotification({
      title: 'Task Created',

      message: `${task.title} task created`,

      type: 'TASK_CREATED',

      triggeredById: userId,

      workspaceId: project.workspaceId,

      projectId,

      taskId: task.id,

      userId: task.assigneeId || undefined,
    });
    return {
      message: 'Task created successfully',
      task,
    };
  }

  // =====================================
  // GET PROJECT TASKS
  // =====================================

  async getProjectTasks(
    projectId: string,
    userId: string,
    filterUserId?: string,
    sprintId?: string,
    status?: TaskStatus,
    priority?: TaskPriority,
    type?: TaskType,
    search?: string,
  ) {
    const project = await this.db.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    const isSuperAdmin = await this.isSuperAdmin(userId);

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: project.workspaceId,
        },
      },
    });

    if (!membership && !isSuperAdmin) {
      throw new UnauthorizedException('Access denied');
    }

    const whereClause: any = {
      projectId,
    };

    // =========================
    // FILTER USER
    // =========================

    if (filterUserId) {
      whereClause.assigneeId = filterUserId;
    }

    // =========================
    // FILTER SPRINT
    // =========================

    if (sprintId) {
      whereClause.sprintId = sprintId;
    }

    // =========================
    // FILTER STATUS
    // =========================

    if (status) {
      whereClause.status = status;
    }

    // =========================
    // FILTER PRIORITY
    // =========================

    if (priority) {
      whereClause.priority = priority;
    }

    // =========================
    // FILTER TYPE
    // =========================

    if (type) {
      whereClause.type = type;
    }

    // =========================
    // SEARCH
    // =========================

    if (search) {
      whereClause.OR = [
        {
          title: {
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
      ];
    }

    const tasks = await this.db.task.findMany({
      where: whereClause,

      include: {
        reporter: {
          select: {
            id: true,
            email: true,
          },
        },

        assignee: {
          select: {
            id: true,
            email: true,
          },
        },

        sprint: true,

        _count: {
          select: {
            comments: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      tasks: tasks.map((task) => ({
        ...task,
        commentsCount: task._count.comments,
      })),
    };
  }

  // =====================================
  // GET TASK BY ID
  // =====================================

  async getTaskById(taskId: string, userId: string) {
    const task = await this.db.task.findUnique({
      where: {
        id: taskId,
      },

      include: {
        project: true,

        reporter: {
          select: {
            id: true,
            email: true,
          },
        },

        assignee: {
          select: {
            id: true,
            email: true,
          },
        },

        sprint: true,

        linkedTasks: {
          include: {
            targetTask: {
              select: {
                id: true,
                title: true,
                taskKey: true,
                status: true,
              },
            },
          },
        },

        linkedFromTasks: {
          include: {
            sourceTask: {
              select: {
                id: true,
                title: true,
                taskKey: true,
                status: true,
              },
            },
          },
        },

        comments: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              },
            },
          },

          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!task) {
      throw new BadRequestException('Task not found');
    }

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

    return {
      task,
    };
  }

  // =====================================
  // UPDATE TASK
  // =====================================

  async updateTask(taskId: string, dto: UpdateTaskDto, userId: string) {
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
    // VALIDATE ASSIGNEE
    // =====================================

    if (dto.assigneeId) {
      const assigneeMember = await this.db.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: task.projectId,
            userId: dto.assigneeId,
          },
        },
      });

      if (!assigneeMember) {
        throw new BadRequestException('Assignee is not project member');
      }
    }

    // =====================================
    // VALIDATE SPRINT
    // =====================================

    if (dto.sprintId) {
      const sprint = await this.db.sprint.findUnique({
        where: {
          id: dto.sprintId,
        },
      });

      if (!sprint) {
        throw new BadRequestException('Sprint not found');
      }

      if (sprint.projectId !== task.projectId) {
        throw new BadRequestException('Sprint does not belong to this project');
      }
    }

    const updatedTask = await this.db.task.update({
      where: {
        id: taskId,
      },

      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        status: dto.status,
        dueDate: dto.dueDate,
        estimateMinutes: dto.estimateMinutes,

        // ASSIGNEE
        assigneeId: dto.assigneeId,

        // SPRINT
        sprintId: dto.sprintId,
        type: dto.type,
      },

      include: {
        reporter: {
          select: {
            id: true,
            email: true,
          },
        },

        assignee: {
          select: {
            id: true,
            email: true,
          },
        },

        sprint: true,
      },
    });

    await this.notificationsService.createNotification({
      title: 'Task Updated',

      message: `${updatedTask.title} task updated`,

      type: 'TASK_UPDATED',

      triggeredById: userId,

      workspaceId: task.project.workspaceId,

      projectId: task.projectId,

      taskId: task.id,

      userId: updatedTask.assigneeId || undefined,
    });

    return {
      message: 'Task updated successfully',
      task: updatedTask,
    };
  }

  // =====================================
  // UPDATE TASK STATUS
  // =====================================

  async updateTaskStatus(
    taskId: string,
    dto: UpdateTaskStatusDto,
    userId: string,
  ) {
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

    const updatedTask = await this.db.task.update({
      where: {
        id: taskId,
      },

      data: {
        status: dto.status,
      },

      include: {
        sprint: true,
      },
    });
    await this.notificationsService.createNotification({
      title: 'Task Status Updated',

      message: `${task.title} moved to ${dto.status}`,

      type: 'TASK_STATUS_UPDATED',

      triggeredById: userId,

      workspaceId: task.project.workspaceId,

      projectId: task.projectId,

      taskId: task.id,

      userId: task.assigneeId || undefined,
    });
    return {
      message: 'Task status updated successfully',
      task: updatedTask,
    };
  }

  // =====================================
  // DELETE TASK
  // =====================================

  async deleteTask(taskId: string, userId: string) {
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

    const canDelete =
      task.reporterId === userId || membership?.role === 'ADMIN';

    if (!canDelete) {
      throw new ForbiddenException('You cannot delete this task');
    }

    await this.db.task.delete({
      where: {
        id: taskId,
      },
    });
    await this.notificationsService.createNotification({
      title: 'Task Deleted',

      message: `${task.title} task deleted`,

      type: 'TASK_DELETED',

      triggeredById: userId,

      workspaceId: task.project.workspaceId,

      projectId: task.projectId,

      taskId: task.id,

      userId: task.assigneeId || undefined,
    });
    return {
      message: 'Task deleted successfully',
    };
  }

  // =====================================
  // ADD COMMENT
  // =====================================

  async addComment(taskId: string, dto: CreateCommentDto, userId: string) {
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

    const comment = await this.db.taskComment.create({
      data: {
        taskId,
        userId,
        content: dto.content,
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
    await this.notificationsService.createNotification({
      title: 'New Comment Added',

      message: `New comment added on ${task.title}`,

      type: 'TASK_COMMENT_ADDED',

      triggeredById: userId,

      workspaceId: task.project.workspaceId,

      projectId: task.projectId,

      taskId: task.id,

      userId: task.assigneeId || undefined,
    });

    return {
      message: 'Comment added successfully',
      comment,
    };
  }

  // =====================================
  // GET COMMENTS
  // =====================================

  async getComments(taskId: string, userId: string) {
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

    const comments = await this.db.taskComment.findMany({
      where: {
        taskId,
      },

      include: {
        user: {
          select: {
            id: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      comments,
    };
  }

  // =====================================
  // DELETE COMMENT
  // =====================================

  async deleteComment(commentId: string, userId: string) {
    const comment = await this.db.taskComment.findUnique({
      where: {
        id: commentId,
      },

      include: {
        task: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!comment) {
      throw new BadRequestException('Comment not found');
    }

    const isSuperAdmin = await this.isSuperAdmin(userId);

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: comment.task.project.workspaceId,
        },
      },
    });

    if (!membership && !isSuperAdmin) {
      throw new UnauthorizedException('Access denied');
    }

    const canDelete = comment.userId === userId || membership?.role === 'ADMIN';

    if (!canDelete) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    await this.db.taskComment.delete({
      where: {
        id: commentId,
      },
    });
    await this.notificationsService.createNotification({
      title: 'Comment Deleted',

      message: `Comment removed from ${comment.task.title}`,

      type: 'TASK_COMMENT_DELETED',

      triggeredById: userId,

      workspaceId: comment.task.project.workspaceId,

      projectId: comment.task.projectId,

      taskId: comment.task.id,

      userId: comment.task.assigneeId || undefined,
    });
    return {
      message: 'Comment deleted successfully',
    };
  }

  // =====================================
  // ASSIGN TASK
  // =====================================

  async assignTask(taskId: string, assigneeId: string, userId: string) {
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

    const projectMember = await this.db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: task.projectId,
          userId: assigneeId,
        },
      },
    });
    if (!projectMember) {
      throw new BadRequestException('User is not project member');
    }

    const updatedTask = await this.db.task.update({
      where: {
        id: taskId,
      },

      data: {
        assigneeId,
      },

      include: {
        assignee: {
          select: {
            id: true,
            email: true,
          },
        },

        sprint: true,
      },
    });
    await this.notificationsService.createNotification({
      title: 'Task Assigned',

      message: `${updatedTask.title} assigned to ${updatedTask.assignee?.email}`,

      type: 'TASK_ASSIGNED',

      triggeredById: userId,

      workspaceId: task.project.workspaceId,

      projectId: task.projectId,

      taskId: task.id,

      userId: assigneeId,
    });
    return {
      message: 'Task assigned successfully',
      task: updatedTask,
    };
  }

  // =====================================
  // MOVE TASK TO SPRINT
  // =====================================

  async moveTaskToSprint(
    taskId: string,
    sprintId: string | null,
    userId: string,
  ) {
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

    // VALIDATE SPRINT
    if (sprintId) {
      const sprint = await this.db.sprint.findUnique({
        where: {
          id: sprintId,
        },
      });

      if (!sprint) {
        throw new BadRequestException('Sprint not found');
      }

      if (sprint.projectId !== task.projectId) {
        throw new BadRequestException('Sprint does not belong to this project');
      }
    }

    const updatedTask = await this.db.task.update({
      where: {
        id: taskId,
      },

      data: {
        sprintId,
      },

      include: {
        sprint: true,
      },
    });
    await this.notificationsService.createNotification({
      title: sprintId ? 'Task Added To Sprint' : 'Task Removed From Sprint',

      message: sprintId
        ? `${task.title} moved to sprint`
        : `${task.title} moved to backlog`,

      type: sprintId ? 'TASK_MOVED_TO_SPRINT' : 'TASK_MOVED_TO_BACKLOG',

      triggeredById: userId,

      workspaceId: task.project.workspaceId,

      projectId: task.projectId,

      taskId: task.id,

      userId: task.assigneeId || undefined,
    });
    return {
      message: sprintId
        ? 'Task moved to sprint successfully'
        : 'Task moved to backlog successfully',

      task: updatedTask,
    };
  }

  // =====================================
  // GET BACKLOG TASKS
  // =====================================

  async getBacklogTasks(
    projectId: string,
    userId: string,
    filters?: {
      search?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      type?: TaskType;
      filterUserId?: string;
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
    const isSuperAdmin = await this.isSuperAdmin(userId);

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: project.workspaceId,
        },
      },
    });

    if (!membership && !isSuperAdmin) {
      throw new UnauthorizedException('Access denied');
    }

    const tasks = await this.db.task.findMany({
      where: {
        projectId,

        sprintId: null,

        ...(filters?.status && {
          status: filters.status,
        }),

        ...(filters?.priority && {
          priority: filters.priority,
        }),

        ...(filters?.type && {
          type: filters.type,
        }),

        ...(filters?.filterUserId && {
          assigneeId: filters.filterUserId,
        }),

        ...(filters?.search && {
          OR: [
            {
              title: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },

            {
              description: {
                contains: filters.search,
                mode: 'insensitive',
              },
            },
          ],
        }),
      },

      include: {
        assignee: {
          select: {
            id: true,
            email: true,
          },
        },

        reporter: {
          select: {
            id: true,
            email: true,
          },
        },

        _count: {
          select: {
            comments: true,
          },
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
