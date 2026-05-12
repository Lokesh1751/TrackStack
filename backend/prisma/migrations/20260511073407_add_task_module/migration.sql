/*
  Warnings:

  - You are about to drop the column `completedAt` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `parentTaskId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `position` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `startedAt` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `storyPoints` on the `Task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_parentTaskId_fkey";

-- DropIndex
DROP INDEX "Task_assigneeId_idx";

-- DropIndex
DROP INDEX "Task_projectId_idx";

-- DropIndex
DROP INDEX "Task_status_idx";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "completedAt",
DROP COLUMN "parentTaskId",
DROP COLUMN "position",
DROP COLUMN "startedAt",
DROP COLUMN "storyPoints",
ALTER COLUMN "type" SET DEFAULT 'TASK';
