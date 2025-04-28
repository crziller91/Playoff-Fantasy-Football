-- CreateTable
CREATE TABLE "ScoringRule" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "position" TEXT NOT NULL,
    "statType" TEXT NOT NULL,
    "points" REAL NOT NULL,
    "multiplier" INTEGER NOT NULL DEFAULT 1,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ScoringRule_position_statType_key" ON "ScoringRule"("position", "statType");
