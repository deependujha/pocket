-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('SAVINGS', 'CASH', 'FD', 'RD', 'PPF', 'EPF', 'EQUITY_SIP', 'GOLD_SIP', 'STOCKS', 'MUTUAL_FUND', 'CREDIT_CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "Liquidity" AS ENUM ('LIQUID', 'SEMI', 'LOCKED');

-- CreateEnum
CREATE TYPE "MovementKind" AS ENUM ('DEPOSIT', 'WITHDRAW', 'INTEREST', 'MARKET', 'ADJUST');

-- CreateEnum
CREATE TYPE "GoalKind" AS ENUM ('EMERGENCY', 'WEALTH', 'PURCHASE', 'GIFT', 'TRAVEL', 'EDUCATION', 'HEALTH', 'CUSTOM');

-- CreateEnum
CREATE TYPE "GoalStatus" AS ENUM ('ACTIVE', 'ACHIEVED', 'PAUSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "LoanDirection" AS ENUM ('LENT', 'BORROWED');

-- CreateEnum
CREATE TYPE "LoanStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "monthlyIncome" INTEGER NOT NULL DEFAULT 0,
    "monthlyExpense" INTEGER NOT NULL DEFAULT 0,
    "emergencyMonths" INTEGER NOT NULL DEFAULT 6,
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AccountType" NOT NULL,
    "institution" TEXT,
    "liquidity" "Liquidity" NOT NULL DEFAULT 'LIQUID',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "invested" INTEGER,
    "interestRate" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3),
    "maturityDate" TIMESTAMP(3),
    "sipAmount" INTEGER,
    "sipDay" INTEGER,
    "goalId" TEXT,
    "note" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "kind" "MovementKind" NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Goal" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "GoalKind" NOT NULL DEFAULT 'CUSTOM',
    "status" "GoalStatus" NOT NULL DEFAULT 'ACTIVE',
    "emoji" TEXT,
    "forWhom" TEXT,
    "target" INTEGER NOT NULL,
    "targetDate" TIMESTAMP(3),
    "trigger" TEXT,
    "monthlyPlan" INTEGER,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "note" TEXT,
    "achievedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Goal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Loan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "direction" "LoanDirection" NOT NULL,
    "status" "LoanStatus" NOT NULL DEFAULT 'ACTIVE',
    "counterparty" TEXT NOT NULL,
    "purpose" TEXT,
    "principal" INTEGER NOT NULL,
    "interestRate" DOUBLE PRECISION,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" TIMESTAMP(3),
    "emi" INTEGER,
    "note" TEXT,
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Loan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoanPayment" (
    "id" TEXT NOT NULL,
    "loanId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,

    CONSTRAINT "LoanPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Settings_userId_key" ON "Settings"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Account_goalId_idx" ON "Account"("goalId");

-- CreateIndex
CREATE INDEX "Movement_accountId_date_idx" ON "Movement"("accountId", "date");

-- CreateIndex
CREATE INDEX "Movement_userId_date_idx" ON "Movement"("userId", "date");

-- CreateIndex
CREATE INDEX "Goal_userId_status_idx" ON "Goal"("userId", "status");

-- CreateIndex
CREATE INDEX "Loan_userId_status_idx" ON "Loan"("userId", "status");

-- CreateIndex
CREATE INDEX "LoanPayment_loanId_date_idx" ON "LoanPayment"("loanId", "date");

-- AddForeignKey
ALTER TABLE "Settings" ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Goal" ADD CONSTRAINT "Goal_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Loan" ADD CONSTRAINT "Loan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoanPayment" ADD CONSTRAINT "LoanPayment_loanId_fkey" FOREIGN KEY ("loanId") REFERENCES "Loan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

