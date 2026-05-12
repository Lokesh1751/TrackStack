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

@Injectable()
export class TasksService {
  constructor(private readonly db: DatabaseService) {}

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

    //     const workspaceMembership = await this.db.membership.findUnique({
    //       where: {
    //         userId_workspaceId: {
    //           userId,
    //           workspaceId: project.workspaceId,
    //         },
    //       },
    //     });
    //  console.log('userIddd',userId,project.workspaceId,workspaceMembership)
    //     if (!workspaceMembership) {
    //       throw new UnauthorizedException('Access denied');
    //     }

    const projectMember = await this.db.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (!projectMember) {
      throw new ForbiddenException('You are not project member');
    }

    const taskCount = await this.db.task.count({
      where: {
        projectId,
      },
    });

    const latestTask = await this.db.task.findFirst({
      where: {
        projectId,
      },

      orderBy: {
        createdAt: 'desc',
      },

      select: {
        taskKey: true,
      },
    });

    let nextNumber = 1;

    if (latestTask?.taskKey) {
      const currentNumber = Number(latestTask.taskKey.replace('TSK-', ''));

      nextNumber = currentNumber + 1;
    }

    const taskKey = `TSK-${nextNumber}`;

    const task = await this.db.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        projectId,
        reporterId: userId,

        // initially unassigned
        assigneeId: null,

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
      },
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
  ) {
    const project = await this.db.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new BadRequestException('Project not found');
    }

    // ✅ Check logged-in user belongs to workspace
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

    // ✅ Dynamic filter
    const whereClause: any = {
      projectId,
    };

    if (filterUserId) {
      whereClause.assigneeId = filterUserId;
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

    // validate assignee if passed
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

        // assign while updating
        assigneeId: dto.assigneeId,
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
      },
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

    const updatedTask = await this.db.task.update({
      where: {
        id: taskId,
      },

      data: {
        status: dto.status,
      },
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

    const canDelete =
      task.reporterId === userId ||
      membership.role === 'ADMIN' ||
      membership.role === 'SUPER_ADMIN';

    if (!canDelete) {
      throw new ForbiddenException('You cannot delete this task');
    }

    await this.db.task.delete({
      where: {
        id: taskId,
      },
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

    const membership = await this.db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId: comment.task.project.workspaceId,
        },
      },
    });

    if (!membership) {
      throw new UnauthorizedException('Access denied');
    }

    const canDelete =
      comment.userId === userId ||
      membership.role === 'ADMIN' ||
      membership.role === 'SUPER_ADMIN';

    if (!canDelete) {
      throw new ForbiddenException('You cannot delete this comment');
    }

    await this.db.taskComment.delete({
      where: {
        id: commentId,
      },
    });

    return {
      message: 'Comment deleted successfully',
    };
  }

  // =========================
  // ASSIGN TASK
  // =========================

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

    // CHECK PROJECT MEMBER
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
      },
    });

    return {
      message: 'Task assigned successfully',
      task: updatedTask,
    };
  }
}
