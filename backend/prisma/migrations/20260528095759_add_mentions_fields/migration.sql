-- AlterTable
ALTER TABLE "TaskComment" ADD COLUMN     "mentions" TEXT[] DEFAULT ARRAY[]::TEXT[];
