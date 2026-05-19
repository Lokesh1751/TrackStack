/*
  Warnings:

  - The values [REJECTED,EXPIRED] on the enum `InviteStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "InviteStatus_new" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');
ALTER TABLE "public"."ProjectInvite" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "ProjectInvite" ALTER COLUMN "status" TYPE "InviteStatus_new" USING ("status"::text::"InviteStatus_new");
ALTER TYPE "InviteStatus" RENAME TO "InviteStatus_old";
ALTER TYPE "InviteStatus_new" RENAME TO "InviteStatus";
DROP TYPE "public"."InviteStatus_old";
ALTER TABLE "ProjectInvite" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
