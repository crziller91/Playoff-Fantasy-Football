// File: app/api/player-scores/recalculate/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { calculatePlayerScore } from "@/app/utils/scoreCalculator";

// POST handler: Recalculate all player scores based on updated scoring rules
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);

        // If not authenticated, return unauthorized
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if the current user has edit scores permission
        const permission = await prisma.permission.findUnique({
            where: { userId: session.user.id },
        });

        if (!permission?.editScores && !permission?.isAdmin) {
            return NextResponse.json(
                { error: "Forbidden: You don't have permission to recalculate scores" },
                { status: 403 }
            );
        }

        // Optional: get position parameter to only recalculate for a specific position
        const { searchParams } = new URL(request.url);
        const position = searchParams.get("position");

        console.log(`Recalculating scores for position: ${position || 'all positions'}`);

        // Get all player scores that need recalculation
        // IMPORTANT: We don't filter by isDisabled to force recalculation of all scores
        // This ensures even when values are reverted to original values, scores are still recalculated
        const playerScores = await prisma.playerScore.findMany({
            where: {
                scoreData: { not: null },
                ...(position ? {
                    player: {
                        position: position
                    }
                } : {})
            },
            include: {
                player: true,
            },
        });

        console.log(`Found ${playerScores.length} scores to recalculate`);

        // Process scores in batches to avoid timeouts
        const batchSize = 10;
        const batches = [];

        for (let i = 0; i < playerScores.length; i += batchSize) {
            batches.push(playerScores.slice(i, i + batchSize));
        }

        let updatedCount = 0;

        for (const batch of batches) {
            const updates = await Promise.all(batch.map(async (score) => {
                try {
                    // Parse the score data
                    const scoreData = score.scoreData ? JSON.parse(score.scoreData) : {};

                    // Create ExtendedPlayer object from player data
                    const player = {
                        id: score.player.id,
                        name: score.player.name,
                        position: score.player.position as "QB" | "RB" | "WR" | "TE" | "K" | "DST",
                        teamName: score.player.teamName || undefined,
                    };

                    console.log(`Recalculating score for ${player.name} (${player.position})`);

                    // IMPORTANT: Always recalculate all scores regardless of whether they've changed
                    // This ensures scores are updated even when scoring rule values revert to original values
                    const newScore = await calculatePlayerScore(player, scoreData);

                    console.log(`Old score: ${score.score}, New score: ${newScore}`);

                    // Always update the score to trigger a database update
                    return prisma.playerScore.update({
                        where: { id: score.id },
                        data: {
                            score: newScore,
                            updatedAt: new Date(),
                        },
                    });
                    updatedCount++;
                } catch (error) {
                    console.error(`Error recalculating score ID ${score.id}:`, error);
                    return null; // Skip this score on error
                }
            }));

            // Filter out nulls (scores that had errors)
            const validUpdates = updates.filter(Boolean);
            updatedCount += validUpdates.length;
        }

        return NextResponse.json({
            message: `Successfully recalculated and updated ${updatedCount} player scores`,
            totalProcessed: playerScores.length,
            updated: updatedCount,
        });
    } catch (error) {
        console.error("API POST /player-scores/recalculate: Error recalculating scores:", error);
        return NextResponse.json(
            { error: "Failed to recalculate player scores" },
            { status: 500 }
        );
    }
}