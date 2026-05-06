import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  Patch,
  Delete,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { SessionAuthGuard } from 'src/database/session-auth.guard';
import type { Request, Response } from 'express';

@UseGuards(SessionAuthGuard)
@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  // ✅ Create workspace
  @Post()
  async create(
    @Body(ValidationPipe) dto: CreateWorkspaceDto,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }

    return this.workspaceService.createWorkspace(userId, dto);
  }

  // ✅ Get all workspaces
  @Get()
  async findAll(@Req() req: Request) {
    const userId = req.session.userId;
    if (!userId) {
      throw new UnauthorizedException();
    }

    return this.workspaceService.getUserWorkspaces(userId);
  }

  // ✅ Get single workspace
  @Get(':id')
  getWorkspace(@Param('id') id: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return this.workspaceService.getWorkspaceById(id, userId);
  }

  @Patch(':id')
  updateWorkspace(
    @Param('id') id: string,
    @Body() dto: UpdateWorkspaceDto,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return this.workspaceService.updateWorkspace(id, dto, userId);
  }
  @Delete(':id')
  async deleteWorkspace(@Param('id') id: string, @Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return this.workspaceService.deleteWorkspace(id, userId);
  }

  @Post(':id/add-member')
  addMember(
    @Param('id') workspaceId: string,
    @Body() dto: AddMemberDto,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Not authenticated');
    }

    return this.workspaceService.addMember(workspaceId, dto, userId);
  }

  // ✅ Get members
  @Get(':id/members')
  getMembers(@Param('id') workspaceId: string, @Req() req: Request) {
    const userId = req.session.userId;
    if (!userId) throw new UnauthorizedException();

    return this.workspaceService.getWorkspaceMembers(workspaceId, userId);
  }

  // ✅ Remove member
  @Delete(':id/remove-member/:userId')
  removeMember(
    @Param('id') workspaceId: string,
    @Param('userId') memberUserId: string,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;
    if (!userId) throw new UnauthorizedException();

    return this.workspaceService.removeMember(
      workspaceId,
      memberUserId,
      userId,
    );
  }

  // ✅ Update role
  @Post(':id/update-role')
  updateRole(
    @Param('id') workspaceId: string,
    @Body(ValidationPipe) dto: AddMemberDto,
    @Req() req: Request,
  ) {
    const userId = req.session.userId;
    if (!userId) throw new UnauthorizedException();

    return this.workspaceService.updateMemberRole(workspaceId, dto, userId);
  }
}
