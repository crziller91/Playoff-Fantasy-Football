-- Rename the unique constraint to match Prisma's expected name
ALTER TABLE "PlayerScore" DROP CONSTRAINT IF EXISTS "PlayerScore_playerId_round_key";
ALTER TABLE "PlayerScore" ADD CONSTRAINT "playerId_round" UNIQUE ("playerId", "round");
