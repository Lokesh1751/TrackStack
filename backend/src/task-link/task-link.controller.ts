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
} from '@nestjs/common';

import type { Request } from 'express';

import { SessionAuthGuard } from 'src/database/session-auth.guard';

import { TaskLinksService } from './task-link.service';
import { TaskLinkType } from '@prisma/client';

@UseGuards(SessionAuthGuard)
@Controller()
export class TaskLinksController {
  constructor(private readonly taskLinksService: TaskLinksService) {}

  // =====================================
  // LINK TASK
  // =====================================

  @Post('tasks/:taskId/links')
  linkTask(
    @Param('taskId') taskId: string,
    @Body('targetTaskId') targetTaskId: string,
    @Body('type') type: TaskLinkType,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.taskLinksService.linkTask(taskId, targetTaskId, type, userId);
  }

  // =====================================
  // GET TASK LINKS
  // =====================================

  @Get('tasks/:taskId/links')
  getTaskLinks(@Param('taskId') taskId: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.taskLinksService.getTaskLinks(taskId, userId);
  }

  // =====================================
  // DELETE TASK LINK
  // =====================================

  @Delete('task-links/:linkId')
  deleteTaskLink(@Param('linkId') linkId: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.taskLinksService.removeTaskLink(linkId, userId);
  }

  // =====================================
  // UPDATE LINK TYPE
  // =====================================

  @Patch('task-links/:linkId')
  updateTaskLink(
    @Param('linkId') linkId: string,
    @Body() body: { type: TaskLinkType },
    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.taskLinksService.updateTaskLink(linkId, body.type, userId);
  }
}
