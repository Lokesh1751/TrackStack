import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
  Query,
} from '@nestjs/common';

import type { Request } from 'express';

import { SessionAuthGuard } from 'src/database/session-auth.guard';

import { TasksService } from './task.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { UpdateTaskStatusDto } from './dto/update-task-status.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@UseGuards(SessionAuthGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // =====================================
  // CREATE TASK
  // =====================================

  @Post('projects/:projectId/tasks')
  createTask(
    @Param('projectId') projectId: string,
    @Body(ValidationPipe)
    dto: CreateTaskDto,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.tasksService.createTask(projectId, dto, userId);
  }

  // =====================================
  // GET PROJECT TASKS
  // =====================================

  @Get('projects/:projectId/tasks')
  getProjectTasks(
    @Param('projectId') projectId: string,

    // FILTER BY USER
    @Query('userId') filterUserId: string,

    // FILTER BY SPRINT
    @Query('sprintId') sprintId: string,

    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.tasksService.getProjectTasks(
      projectId,
      userId,
      filterUserId,
      sprintId,
    );
  }

  // =====================================
  // GET BACKLOG TASKS
  // =====================================

  @Get('projects/:projectId/backlog')
  getBacklogTasks(@Param('projectId') projectId: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.tasksService.getBacklogTasks(projectId, userId);
  }

  // =====================================
  // GET TASK BY ID
  // =====================================

  @Get('tasks/:taskId')
  getTaskById(@Param('taskId') taskId: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.tasksService.getTaskById(taskId, userId);
  }

  // =====================================
  // UPDATE TASK
  // =====================================

  @Patch('tasks/:taskId')
  updateTask(
    @Param('taskId') taskId: string,
    @Body(ValidationPipe)
    dto: UpdateTaskDto,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.tasksService.updateTask(taskId, dto, userId);
  }

  // =====================================
  // UPDATE TASK STATUS
  // =====================================

  @Patch('tasks/:taskId/status')
  updateTaskStatus(
    @Param('taskId') taskId: string,
    @Body(ValidationPipe)
    dto: UpdateTaskStatusDto,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.tasksService.updateTaskStatus(taskId, dto, userId);
  }

  // =====================================
  // MOVE TASK TO SPRINT
  // =====================================

  @Patch('tasks/:taskId/move-to-sprint')
  moveTaskToSprint(
    @Param('taskId') taskId: string,
    @Body('sprintId') sprintId: string | null,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.tasksService.moveTaskToSprint(taskId, sprintId, userId);
  }

  // =====================================
  // DELETE TASK
  // =====================================

  @Delete('tasks/:taskId')
  deleteTask(@Param('taskId') taskId: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.tasksService.deleteTask(taskId, userId);
  }

  // =====================================
  // ADD COMMENT
  // =====================================

  @Post('tasks/:taskId/comments')
  addComment(
    @Param('taskId') taskId: string,
    @Body(ValidationPipe)
    dto: CreateCommentDto,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.tasksService.addComment(taskId, dto, userId);
  }

  // =====================================
  // GET COMMENTS
  // =====================================

  @Get('tasks/:taskId/comments')
  getComments(@Param('taskId') taskId: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.tasksService.getComments(taskId, userId);
  }

  // =====================================
  // DELETE COMMENT
  // =====================================

  @Delete('comments/:commentId')
  deleteComment(@Param('commentId') commentId: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.tasksService.deleteComment(commentId, userId);
  }

  // =====================================
  // ASSIGN TASK
  // =====================================

  @Patch('tasks/:taskId/assign')
  assignTask(
    @Param('taskId') taskId: string,
    @Body('assigneeId') assigneeId: string,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.tasksService.assignTask(taskId, assigneeId, userId);
  }
}
