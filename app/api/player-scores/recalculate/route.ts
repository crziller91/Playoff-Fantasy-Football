// File: app/api/player-scores/recalculate/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { calculatePlayerScore, parseNum } from "@/app/utils/scoreCalculator";

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

        // Fetch all scoring rules from database once (avoid HTTP calls)
        const scoringRules = await prisma.scoringRule.findMany();
        const rulesMap: Record<string, Record<string, number>> = {};

        scoringRules.forEach(rule => {
            if (!rulesMap[rule.position]) {
                rulesMap[rule.position] = {};
            }
            rulesMap[rule.position][rule.category] = rule.value;
        });

        // Helper to get scoring rule from our local map
        const getRule = (position: string, category: string): number => {
            return rulesMap[position]?.[category] ?? 0;
        };

        // Calculate all new scores first (fast, no external calls)
        const scoreUpdates = playerScores.map((score) => {
            try {
                // Parse the score data
                const scoreData = score.scoreData ? JSON.parse(score.scoreData) : {};
                const pos = score.player.position;
                let calculatedScore = 0;

                // Calculate score based on position using local rules
                switch (pos) {
                    case "QB":
                        calculatedScore += parseNum(scoreData.touchdowns) * getRule("QB", "passingTouchdown");
                        calculatedScore += Math.round(parseNum(scoreData.yards) / getRule("QB", "passingYardDivisor"));
                        calculatedScore += parseNum(scoreData.interceptions) * getRule("QB", "interception");
                        calculatedScore += Math.round(parseNum(scoreData.completions) / getRule("QB", "completionDivisor"));
                        calculatedScore += parseNum(scoreData.rushingTouchdowns) * getRule("QB", "rushingTouchdown");
                        calculatedScore += Math.max(0, Math.floor(parseNum(scoreData.rushingYards) / getRule("QB", "rushingYardDivisor")));
                        calculatedScore += Math.floor(parseNum(scoreData.rushingAttempts) / getRule("QB", "rushingAttemptDivisor"));
                        calculatedScore += parseNum(scoreData.twoPointConversions) * getRule("QB", "twoPtConversion");
                        calculatedScore += parseNum(scoreData.fumblesLost) * getRule("QB", "fumbleLost");
                        break;

                    case "RB":
                        calculatedScore += parseNum(scoreData.touchdowns) * getRule("RB", "rushingTouchdown");
                        calculatedScore += Math.max(0, Math.floor(parseNum(scoreData.rushingYards) / getRule("RB", "rushingYardDivisor")));
                        calculatedScore += Math.floor(parseNum(scoreData.rushingAttempts) / getRule("RB", "rushingAttemptDivisor"));
                        calculatedScore += parseNum(scoreData.receivingTouchdowns) * getRule("RB", "receivingTouchdown");
                        calculatedScore += Math.max(0, Math.floor(parseNum(scoreData.receivingYards) / getRule("RB", "receivingYardDivisor")));
                        calculatedScore += parseNum(scoreData.receptions) * getRule("RB", "reception");
                        calculatedScore += parseNum(scoreData.fumblesLost) * getRule("RB", "fumbleLost");
                        calculatedScore += parseNum(scoreData.passingTouchdowns) * getRule("RB", "passingTouchdown");
                        calculatedScore += parseNum(scoreData.twoPointConversions) * getRule("RB", "twoPtConversion");
                        break;

                    case "WR":
                    case "TE":
                        calculatedScore += parseNum(scoreData.touchdowns) * getRule(pos, "receivingTouchdown");
                        calculatedScore += Math.max(0, Math.floor(parseNum(scoreData.receivingYards) / getRule(pos, "receivingYardDivisor")));
                        calculatedScore += parseNum(scoreData.receptions) * getRule(pos, "reception");
                        calculatedScore += parseNum(scoreData.rushingTouchdowns) * getRule(pos, "rushingTouchdown");
                        calculatedScore += Math.max(0, Math.floor(parseNum(scoreData.rushingYards) / getRule(pos, "rushingYardDivisor")));
                        calculatedScore += Math.floor(parseNum(scoreData.rushingAttempts) / getRule(pos, "rushingAttemptDivisor"));
                        calculatedScore += parseNum(scoreData.fumblesLost) * getRule(pos, "fumbleLost");
                        calculatedScore += parseNum(scoreData.passingTouchdowns) * getRule(pos, "passingTouchdown");
                        calculatedScore += parseNum(scoreData.twoPointConversions) * getRule(pos, "twoPtConversion");
                        break;

                    case "K":
                        calculatedScore += parseNum(scoreData.pat) * getRule("K", "pat");
                        calculatedScore += parseNum(scoreData.fgMisses) * getRule("K", "fgMiss");
                        if (scoreData.fgYardages) {
                            scoreData.fgYardages.forEach((yardage: string) => {
                                const yards = parseNum(yardage);
                                if (yards >= 60) calculatedScore += getRule("K", "fg60plus");
                                else if (yards >= 50) calculatedScore += getRule("K", "fg50to59");
                                else if (yards >= 40) calculatedScore += getRule("K", "fg40to49");
                                else if (yards >= 0) calculatedScore += getRule("K", "fg0to39");
                            });
                        }
                        break;
                }

                return {
                    id: score.id,
                    newScore: calculatedScore,
                    success: true
                };
            } catch (error) {
                console.error(`Error calculating score ID ${score.id}:`, error);
                return {
                    id: score.id,
                    newScore: 0,
                    success: false
                };
            }
        });

        // Batch update all scores in transactions (chunk to avoid transaction limits)
        const successfulUpdates = scoreUpdates.filter(u => u.success);
        const chunkSize = 50; // Update 50 at a time to stay within transaction limits

        for (let i = 0; i < successfulUpdates.length; i += chunkSize) {
            const chunk = successfulUpdates.slice(i, i + chunkSize);
            await prisma.$transaction(
                chunk.map(update =>
                    prisma.playerScore.update({
                        where: { id: update.id },
                        data: {
                            score: update.newScore,
                            updatedAt: new Date(),
                        },
                    })
                )
            );
        }

        return NextResponse.json({
            message: `Successfully recalculated and updated ${successfulUpdates.length} player scores`,
            totalProcessed: playerScores.length,
            updated: successfulUpdates.length,
        });
    } catch (error) {
        console.error("API POST /player-scores/recalculate: Error recalculating scores:", error);
        return NextResponse.json(
            { error: "Failed to recalculate player scores" },
            { status: 500 }
        );
    }
}