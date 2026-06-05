import { BadRequestException, Injectable } from '@nestjs/common';

import { NotificationType } from '@prisma/client';

import { DatabaseService } from '@/database/database.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly db: DatabaseService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

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

    triggeredById?: string | null;

    workspaceId?: string;
    projectId?: string;
    sprintId?: string;
    taskId?: string;
    commentId?: string;
    redirectUrl?: string;
  }) {
    const notification = await this.db.notification.create({
      data,
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
    });

    if (notification.userId) {
      this.notificationsGateway.sendNotificationToUser(
        notification.userId,
        notification,
      );
    }

    return notification;
  }

  // =====================================================
  // GET NOTIFICATIONS
  // =====================================================

  async getNotifications(userId: string, page = 1, limit = 20) {
    const whereClause = await this.getNotificationWhereClause(userId);

    const [notifications, total] = await Promise.all([
      this.db.notification.findMany({
        where: whereClause,

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
      }),

      this.db.notification.count({
        where: whereClause,
      }),
    ]);

    return {
      notifications,

      page,

      limit,

      total,

      totalPages: Math.ceil(total / limit),

      hasNextPage: page < Math.ceil(total / limit),
    };
  }

  // =====================================================
  // GET UNREAD COUNT
  // =====================================================

  async getUnreadCount(userId: string) {
    const count = await this.db.notification.count({
      where: {
        ...(await this.getNotificationWhereClause(userId)),

        isRead: false,
      },
    });
    return count;
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
    const whereClause = {
      ...(await this.getNotificationWhereClause(userId)),

      isRead: false,
    };

    const unreadNotificationsCount = await this.db.notification.count({
      where: whereClause,
    });

    if (!unreadNotificationsCount) {
      throw new BadRequestException(
        'All notifications are already marked as read',
      );
    }

    return this.db.notification.updateMany({
      where: whereClause,

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
