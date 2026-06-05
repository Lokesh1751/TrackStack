import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { NotificationsService } from '@/notifications/notifications.service';
import { DatabaseModule } from 'src/database/database.module';
import { NotificationsGateway } from '@/notifications/notifications.gateway';

@Module({
  imports: [DatabaseModule],
  controllers: [AuthController],
  providers: [AuthService, NotificationsService, NotificationsGateway],
})
export class AuthModule {}
