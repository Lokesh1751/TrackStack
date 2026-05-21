import { BadRequestException, Injectable } from '@nestjs/common';

import { NotificationType } from '@prisma/client';

import { DatabaseService } from '@/database/database.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly db: DatabaseService) {}

  // =====================================================
  // CHECK SUPER ADMIN
  // =====================================================

  private async isSuperAdmin(userId: string) {
    const user = await this.db.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        isSuperAdmin: true,
      },
    });

    return Boolean(user?.isSuperAdmin);
  }

  // =====================================================
  // GET WHERE CLAUSE
  // =====================================================

  private async getNotificationWhereClause(userId: string) {
    const isSuperAdmin = await this.isSuperAdmin(userId);

    return isSuperAdmin
      ? {}
      : {
          userId,
        };
  }

  // =====================================================
  // CREATE NOTIFICATION
  // =====================================================

  async createNotification(data: {
    title: string;
    message: string;

    type: NotificationType;

    userId?: string;

    triggeredById?: string;

    workspaceId?: string;
    projectId?: string;
    sprintId?: string;
    taskId?: string;

    redirectUrl?: string;
  }) {
    return this.db.notification.create({
      data,
    });
  }

  // =====================================================
  // GET NOTIFICATIONS
  // =====================================================

  async getNotifications(userId: string, page = 1, limit = 20) {
    return this.db.notification.findMany({
      where: await this.getNotificationWhereClause(userId),

      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },

        triggeredBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },

      skip: (page - 1) * limit,

      take: limit,
    });
  }

  // =====================================================
  // GET UNREAD COUNT
  // =====================================================

  async getUnreadCount(userId: string) {
    return this.db.notification.count({
      where: {
        ...(await this.getNotificationWhereClause(userId)),

        isRead: false,
      },
    });
  }

  // =====================================================
  // MARK SINGLE AS READ
  // =====================================================

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.db.notification.findFirst({
      where: {
        id: notificationId,

        ...(await this.getNotificationWhereClause(userId)),
      },
    });

    if (!notification) {
      throw new BadRequestException('Notification not found');
    }

    return this.db.notification.update({
      where: {
        id: notificationId,
      },

      data: {
        isRead: true,
      },
    });
  }

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  async markAllAsRead(userId: string) {
    return this.db.notification.updateMany({
      where: {
        ...(await this.getNotificationWhereClause(userId)),

        isRead: false,
      },

      data: {
        isRead: true,
      },
    });
  }

  // =====================================================
  // DELETE NOTIFICATION
  // =====================================================

  async deleteNotification(notificationId: string, userId: string) {
    const notification = await this.db.notification.findFirst({
      where: {
        id: notificationId,

        ...(await this.getNotificationWhereClause(userId)),
      },
    });

    if (!notification) {
      throw new BadRequestException('Notification not found');
    }

    return this.db.notification.delete({
      where: {
        id: notificationId,
      },
    });
  }
}
