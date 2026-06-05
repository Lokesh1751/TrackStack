import { Module } from '@nestjs/common';
import { TaskLinksService } from './task-link.service';
import { TaskLinksController } from './task-link.controller';
import { DatabaseModule } from 'src/database/database.module';
import { NotificationsService } from '@/notifications/notifications.service';
import { NotificationsGateway } from '@/notifications/notifications.gateway';

@Module({
  imports: [DatabaseModule],
  controllers: [TaskLinksController],
  providers: [TaskLinksService, NotificationsService, NotificationsGateway],
})
export class TaskLinkModule {}
