// ======================================================
// SPRINT CONTROLLER
// ======================================================

import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { SessionAuthGuard } from 'src/database/session-auth.guard';

import { SprintService } from './sprint.service';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { SprintStatus } from '@prisma/client';

@UseGuards(SessionAuthGuard)
@Controller()
export class SprintController {
  constructor(private readonly sprintService: SprintService) {}

  // ======================================================
  // CREATE SPRINT
  // ======================================================

  @Post('projects/:projectId/sprints')
  createSprint(
    @Param('projectId') projectId: string,
    @Body() dto: CreateSprintDto,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.sprintService.createSprint(projectId, dto, userId);
  }

  // ======================================================
  // GET ALL SPRINTS
  // ======================================================

  @Get('projects/:projectId/sprints')
  getProjectSprints(
    @Param('projectId') projectId: string,

    @Req() req: Request,

    @Query('status') status?: SprintStatus,

    @Query('search') search?: string,

    @Query('startDate') startDate?: string,

    @Query('endDate') endDate?: string,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.sprintService.getProjectSprints(projectId, userId, {
      status,
      search,
      startDate,
      endDate,
    });
  }

  // ======================================================
  // GET SINGLE SPRINT
  // ======================================================

  @Get('sprints/:sprintId')
  getSprintById(@Param('sprintId') sprintId: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.sprintService.getSprintById(sprintId, userId);
  }

  // ======================================================
  // UPDATE SPRINT
  // ======================================================

  @Patch('sprints/:sprintId')
  updateSprint(
    @Param('sprintId') sprintId: string,
    @Body() dto: any,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.sprintService.updateSprint(sprintId, dto, userId);
  }

  // ======================================================
  // DELETE SPRINT
  // ======================================================

  @Delete('sprints/:sprintId')
  deleteSprint(@Param('sprintId') sprintId: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.sprintService.deleteSprint(sprintId, userId);
  }

  // ======================================================
  // START SPRINT
  // ======================================================

  @Patch('sprints/:sprintId/start')
  startSprint(@Param('sprintId') sprintId: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.sprintService.startSprint(sprintId);
  }

  // ======================================================
  // COMPLETE SPRINT
  // ======================================================

  @Patch('sprints/:sprintId/complete')
  completeSprint(@Param('sprintId') sprintId: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.sprintService.completeSprint(sprintId);
  }

  // ======================================================
  // ADD TASK TO SPRINT
  // ======================================================

  @Patch('sprints/:sprintId/tasks/:taskId')
  addTaskToSprint(
    @Param('sprintId') sprintId: string,
    @Param('taskId') taskId: string,
  ) {
    return this.sprintService.addTaskToSprint(sprintId, taskId);
  }

  // ======================================================
  // REMOVE TASK FROM SPRINT
  // ======================================================

  @Patch('tasks/:taskId/remove-sprint')
  removeTaskFromSprint(@Param('taskId') taskId: string) {
    return this.sprintService.removeTaskFromSprint(taskId);
  }
}
