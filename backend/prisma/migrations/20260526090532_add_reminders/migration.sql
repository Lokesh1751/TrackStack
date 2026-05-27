-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'TASK_DUE_REMINDER';
ALTER TYPE "NotificationType" ADD VALUE 'TASK_OVERDUE';

-- AlterTable
ALTER TABLE "Sprint" ADD COLUMN     "healthNotificationSent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "dueReminderSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "overdueReminderSent" BOOLEAN NOT NULL DEFAULT false;
