// reminders.service.ts

import { Injectable, Logger } from '@nestjs/common';

import { Cron, CronExpression } from '@nestjs/schedule';

import { DatabaseService } from 'src/database/database.service';

import { NotificationsService } from 'src/notifications/notifications.service';

@Injectable()
export class RemindersService {
  private readonly logger = new Logger(RemindersService.name);

  constructor(
    private readonly db: DatabaseService,

    private readonly notificationsService: NotificationsService,
  ) {}

  // ======================================================
  // TASK DUE REMINDERS
  // ======================================================

  @Cron(CronExpression.EVERY_DAY_AT_5PM)
  async sendTaskDueReminders() {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const tasks = await this.db.task.findMany({
      where: {
        dueDate: {
          gte: startOfToday,
          lte: next24Hours,
        },

        status: {
          not: 'DONE',
        },

        dueReminderSent: false,
      },

      include: {
        project: true,

        sprint: true,
      },
    });

    for (const task of tasks) {
      if (!task.assigneeId) continue;

      await this.notificationsService.createNotification({
        title: 'Task Due Soon',

        message: `${task.title} is due within 24 hours`,

        type: 'TASK_DUE_REMINDER',

        triggeredById: task.assigneeId,

        workspaceId: task.project.workspaceId,

        projectId: task.projectId,

        taskId: task.id,

        sprintId: task.sprintId || undefined,

        userId: task.assigneeId,
      });

      await this.db.task.update({
        where: {
          id: task.id,
        },

        data: {
          dueReminderSent: true,
        },
      });
    }

    this.logger.log(`Due reminders sent: ${tasks.length}`);
  }

  // ======================================================
  // OVERDUE TASKS
  // ======================================================

  @Cron(CronExpression.EVERY_2_HOURS)
  async sendOverdueReminders() {
    const now = new Date();

    const tasks = await this.db.task.findMany({
      where: {
        dueDate: {
          lt: now,
        },

        status: {
          not: 'DONE',
        },

        overdueReminderSent: false,
      },

      include: {
        project: true,

        sprint: true,
      },
    });

    for (const task of tasks) {
      if (!task.assigneeId) continue;

      await this.notificationsService.createNotification({
        title: 'Task Overdue',

        message: `${task.title} is overdue`,

        type: 'TASK_OVERDUE',

        triggeredById: task.assigneeId,

        workspaceId: task.project.workspaceId,

        projectId: task.projectId,

        taskId: task.id,

        sprintId: task.sprintId || undefined,

        userId: task.assigneeId,
      });

      await this.db.task.update({
        where: {
          id: task.id,
        },

        data: {
          overdueReminderSent: true,
        },
      });
    }
  }

  // ======================================================
  // SPRINT HEALTH CHECK
  // ======================================================

  @Cron(CronExpression.EVERY_6_HOURS)
  async checkSprintHealth() {
    const sprints = await this.db.sprint.findMany({
      where: {
        status: 'ACTIVE',
      },

      include: {
        project: true,

        tasks: true,
      },
    });

    for (const sprint of sprints) {
      const tasks = sprint.tasks || [];

      const totalEstimate = tasks.reduce(
        (acc, task) => acc + (task.estimateMinutes || 0),
        0,
      );

      const completedEstimate = tasks
        .filter((task) => task.status === 'DONE')
        .reduce((acc, task) => acc + (task.estimateMinutes || 0), 0);

      const sprintProgress =
        totalEstimate > 0
          ? Math.round((completedEstimate / totalEstimate) * 100)
          : 0;

      const now = new Date();

      const startDate = sprint.startDate ? new Date(sprint.startDate) : null;

      const endDate = sprint.endDate ? new Date(sprint.endDate) : null;

      if (!startDate || !endDate) continue;

      const totalDays = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      const daysLeft = Math.max(
        0,
        Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      );

      const daysPassed = Math.max(0, totalDays - daysLeft);

      const timeProgress = totalDays > 0 ? (daysPassed / totalDays) * 100 : 0;

      const isDelayed = sprintProgress + 10 < timeProgress;

      if (isDelayed && !sprint.healthNotificationSent) {
        const members = await this.db.membership.findMany({
          where: {
            workspaceId: sprint.project.workspaceId,
          },
        });

        for (const member of members) {
          await this.notificationsService.createNotification({
            title: 'Sprint Delayed',

            message: `${sprint.name} sprint is getting delayed`,

            type: 'SPRINT_HEALTH',

            triggeredById: member.userId,

            workspaceId: sprint.project.workspaceId,

            projectId: sprint.projectId,

            sprintId: sprint.id,

            userId: member.userId,
          });
        }

        await this.db.sprint.update({
          where: {
            id: sprint.id,
          },

          data: {
            healthNotificationSent: true,
          },
        });
      }
    }
  }
}
