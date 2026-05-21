import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { ProjectController } from './project.controller';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [DatabaseModule],
  controllers: [ProjectController],
  providers: [ProjectService, NotificationsService],
})
export class ProjectModule {}
