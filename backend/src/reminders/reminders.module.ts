
import { Module } from '@nestjs/common';

import { RemindersService } from './reminders.service';

import { DatabaseModule } from 'src/database/database.module';

import { NotificationsModule } from 'src/notifications/notifications.module';

@Module({
  imports: [
    DatabaseModule,
    NotificationsModule,
  ],

  providers: [RemindersService],
})
export class RemindersModule {}