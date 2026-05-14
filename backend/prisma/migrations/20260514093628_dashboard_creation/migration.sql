-- CreateTable
CREATE TABLE "SprintSnapshot" (
    "id" TEXT NOT NULL,
    "sprintId" TEXT NOT NULL,
    "remainingEstimate" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SprintSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SprintSnapshot_sprintId_idx" ON "SprintSnapshot"("sprintId");

-- AddForeignKey
ALTER TABLE "SprintSnapshot" ADD CONSTRAINT "SprintSnapshot_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE CASCADE ON UPDATE CASCADE;
