-- DropForeignKey
ALTER TABLE "Goal" DROP CONSTRAINT "Goal_overflowGoalId_fkey";

-- DropForeignKey
ALTER TABLE "Loan" DROP CONSTRAINT "Loan_overflowGoalId_fkey";

-- AlterTable
ALTER TABLE "Goal" DROP COLUMN "overflowGoalId";

-- AlterTable
ALTER TABLE "Loan" DROP COLUMN "overflowGoalId";

-- AlterTable
ALTER TABLE "Settings" DROP COLUMN "planNote";

-- CreateTable
CREATE TABLE "PlanPhase" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "shares" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanPhase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlanPhase_userId_order_key" ON "PlanPhase"("userId", "order");

-- AddForeignKey
ALTER TABLE "PlanPhase" ADD CONSTRAINT "PlanPhase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

