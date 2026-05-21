// src/workspace/dto/add-workspace-member.dto.ts

import { IsEmail, IsEnum } from 'class-validator';

export enum WorkspaceRole {
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export class AddMemberDto {
  @IsEmail()
  email: string;

  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}
