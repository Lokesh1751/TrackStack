import { Module } from '@nestjs/common';
import { TasksService } from './task.service';
import { TasksController } from './task.controller';
import { DatabaseModule } from 'src/database/database.module';
import { NotificationsService } from '@/notifications/notifications.service';

@Module({
  imports: [DatabaseModule],
  controllers: [TasksController],
  providers: [TasksService, NotificationsService],
})
export class TaskModule {}
