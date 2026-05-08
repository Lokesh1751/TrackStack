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
} from '@nestjs/common';

import type { Request } from 'express';

import { SessionAuthGuard } from 'src/database/session-auth.guard';

import { ProjectService } from './project.service';

import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { AddProjectMemberDto } from './dto/add-project-member.dto';

@UseGuards(SessionAuthGuard)
@Controller()
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  // =========================
  // CREATE PROJECT
  // =========================
  @Post('workspace/:workspaceId/projects')
  createProject(
    @Param('workspaceId') workspaceId: string,
    @Body(ValidationPipe) dto: CreateProjectDto,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.projectService.createProject(workspaceId, dto, userId);
  }

  // =========================
  // GET ALL PROJECTS
  // =========================
  @Get('workspace/:workspaceId/projects')
  getProjects(@Param('workspaceId') workspaceId: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.projectService.getProjects(workspaceId, userId);
  }

  // =========================
  // GET PROJECT BY ID
  // =========================
  @Get('projects/:projectId')
  getProjectById(@Param('projectId') projectId: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.projectService.getProjectById(projectId, userId);
  }

  // =========================
  // UPDATE PROJECT
  // =========================
  @Patch('projects/:projectId')
  updateProject(
    @Param('projectId') projectId: string,
    @Body(ValidationPipe) dto: UpdateProjectDto,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.projectService.updateProject(projectId, dto, userId);
  }

  // =========================
  // DELETE PROJECT
  // =========================
  @Delete('projects/:projectId')
  deleteProject(@Param('projectId') projectId: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.projectService.deleteProject(projectId, userId);
  }

  @Post(':projectId/members')
  addMember(
    @Param('projectId') projectId: string,
    @Body() dto: AddProjectMemberDto,
    @Req() req: Request,
  ) {
    return this.projectService.addProjectMember(
      projectId,
      dto,
      req.session.userId,
    );
  }

  @Get(':projectId/members')
  getMembers(@Param('projectId') projectId: string) {
    return this.projectService.getProjectMembers(projectId);
  }

  @Delete(':projectId/members/:userId')
  removeMember(
    @Param('projectId') projectId: string,
    @Param('userId') userId: string,
    @Req() req: Request,
  ) {
    return this.projectService.removeProjectMember(
      projectId,
      userId,
      req.session.userId,
    );
  }
}
