/*
  Warnings:

  - You are about to drop the column `fileSize` on the `TaskAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `fileType` on the `TaskAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `fileSize` on the `TaskCommentAttachment` table. All the data in the column will be lost.
  - You are about to drop the column `fileType` on the `TaskCommentAttachment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TaskAttachment" DROP COLUMN "fileSize",
DROP COLUMN "fileType";

-- AlterTable
ALTER TABLE "TaskCommentAttachment" DROP COLUMN "fileSize",
DROP COLUMN "fileType";
