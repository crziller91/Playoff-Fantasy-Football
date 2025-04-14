/*
  Warnings:

  - You are about to drop the `TeamNames` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TeamNames";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Team" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DraftPick" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "teamId" INTEGER NOT NULL,
    "playerId" INTEGER,
    "round" INTEGER NOT NULL,
    CONSTRAINT "DraftPick_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DraftPick_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_DraftPick" ("id", "playerId", "round", "teamId") SELECT "id", "playerId", "round", "teamId" FROM "DraftPick";
DROP TABLE "DraftPick";
ALTER TABLE "new_DraftPick" RENAME TO "DraftPick";
CREATE UNIQUE INDEX "DraftPick_teamId_round_key" ON "DraftPick"("teamId", "round");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
