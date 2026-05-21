import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';

import type { Request } from 'express';

import { SessionAuthGuard } from 'src/database/session-auth.guard';

import { NotificationsService } from './notifications.service';

@UseGuards(SessionAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // =====================================================
  // GET NOTIFICATIONS
  // =====================================================

  @Get()
  getNotifications(
    @Req() req: Request,

    @Query('page') page?: string,

    @Query('limit') limit?: string,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.notificationsService.getNotifications(
      userId,

      Number(page) || 1,

      Number(limit) || 20,
    );
  }

  // =====================================================
  // GET UNREAD COUNT
  // =====================================================

  @Get('unread-count')
  getUnreadCount(@Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.notificationsService.getUnreadCount(userId);
  }

  // =====================================================
  // MARK SINGLE AS READ
  // =====================================================

  @Patch(':id/read')
  markAsRead(
    @Param('id') notificationId: string,

    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.notificationsService.markAsRead(
      notificationId,

      userId,
    );
  }

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  @Patch('read-all')
  markAllAsRead(@Req() req: Request) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.notificationsService.markAllAsRead(userId);
  }

  // =====================================================
  // DELETE NOTIFICATION
  // =====================================================

  @Delete(':id')
  deleteNotification(
    @Param('id') notificationId: string,

    @Req() req: Request,
  ) {
    const userId = req.session.userId;

    if (!userId) {
      throw new UnauthorizedException('Unauthorized');
    }

    return this.notificationsService.deleteNotification(
      notificationId,

      userId,
    );
  }
}
