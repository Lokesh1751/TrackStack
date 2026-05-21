import { Module } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { WorkspaceController } from './workspace.controller';
import { DatabaseModule } from 'src/database/database.module';
import { NotificationsService } from '@/notifications/notifications.service';

@Module({
  imports: [DatabaseModule],
  controllers: [WorkspaceController],
  providers: [WorkspaceService, NotificationsService],
})
export class WorkspaceModule {}
