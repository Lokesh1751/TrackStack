import {
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTaskAttachmentDto } from './create-attachment.dto';

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  content: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  mentions?: string[];

  @IsUUID()
  @IsOptional()
  parentId?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskAttachmentDto)
  attachments?: CreateTaskAttachmentDto[];
}
