-- AlterEnum
ALTER TYPE "GoalKind" ADD VALUE 'FUN';

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "overflowGoalId" TEXT;

-- AlterTable
ALTER TABLE "Loan" ADD COLUMN     "overflowGoalId" TEXT;

-- AlterTable
ALTER TABLE "Settings" ADD COLUMN     "planNote" TEXT;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_overflowGoalId_fkey" FOREIGN KEY ("overflowGoalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_overflowGoalId_fkey" FOREIGN KEY ("overflowGoalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

