import { IsString } from 'class-validator';

export class CreateTaskAttachmentDto {
  @IsString()
  fileName: string;

  @IsString()
  fileUrl: string;
}
