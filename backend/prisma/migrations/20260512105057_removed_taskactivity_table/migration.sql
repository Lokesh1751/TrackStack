/*
  Warnings:

  - You are about to drop the `TaskActivity` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "TaskActivity" DROP CONSTRAINT "TaskActivity_taskId_fkey";

-- DropForeignKey
ALTER TABLE "TaskActivity" DROP CONSTRAINT "TaskActivity_userId_fkey";

-- DropTable
DROP TABLE "TaskActivity";
