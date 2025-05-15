-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "budget" INTEGER NOT NULL DEFAULT 200,
    "originalBudget" INTEGER NOT NULL DEFAULT 200
);
INSERT INTO "new_Team" ("budget", "id", "name") SELECT "budget", "id", "name" FROM "Team";
DROP TABLE "Team";
ALTER TABLE "new_Team" RENAME TO "Team";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN "originalBudget" INTEGER NOT NULL DEFAULT 200;

-- Update existing teams to match their originalBudget with their budget
UPDATE "Team" SET "originalBudget" = "budget";
