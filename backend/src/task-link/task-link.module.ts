import { Module } from '@nestjs/common';
import { TaskLinksService } from './task-link.service';
import { TaskLinksController } from './task-link.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [TaskLinksController],
  providers: [TaskLinksService],
})
export class TaskLinkModule {}
