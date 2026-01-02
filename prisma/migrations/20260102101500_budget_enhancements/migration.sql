-- AlterTable
ALTER TABLE "BudgetLine" ADD COLUMN     "notes" TEXT,
ADD COLUMN     "quantity" DOUBLE PRECISION,
ADD COLUMN     "unitCost" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "BudgetComment" (
    "id" TEXT NOT NULL,
    "budgetLineId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BudgetComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BudgetLine_projectId_category_description_period_key" ON "BudgetLine"("projectId", "category", "description", "period");

-- AddForeignKey
ALTER TABLE "BudgetComment" ADD CONSTRAINT "BudgetComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "Person"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BudgetComment" ADD CONSTRAINT "BudgetComment_budgetLineId_fkey" FOREIGN KEY ("budgetLineId") REFERENCES "BudgetLine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
