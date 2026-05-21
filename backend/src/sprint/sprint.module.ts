import { Module } from '@nestjs/common';
import { SprintService } from './sprint.service';
import { SprintController } from './sprint.controller';
import { DatabaseModule } from 'src/database/database.module';
import { NotificationsService } from '@/notifications/notifications.service';

@Module({
  imports: [DatabaseModule],
  controllers: [SprintController],
  providers: [SprintService, NotificationsService],
})
export class SprintModule {}
