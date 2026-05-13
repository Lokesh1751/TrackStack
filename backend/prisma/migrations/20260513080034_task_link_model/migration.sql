-- CreateEnum
CREATE TYPE "TaskLinkType" AS ENUM ('BLOCKS', 'RELATES_TO', 'DUPLICATES', 'DEPENDS_ON', 'CAUSED_BY');

-- CreateTable
CREATE TABLE "TaskLink" (
    "id" UUID NOT NULL,
    "sourceTaskId" UUID NOT NULL,
    "targetTaskId" UUID NOT NULL,
    "type" "TaskLinkType" NOT NULL,

    CONSTRAINT "TaskLink_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TaskLink" ADD CONSTRAINT "TaskLink_sourceTaskId_fkey" FOREIGN KEY ("sourceTaskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskLink" ADD CONSTRAINT "TaskLink_targetTaskId_fkey" FOREIGN KEY ("targetTaskId") REFERENCES "Task"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
