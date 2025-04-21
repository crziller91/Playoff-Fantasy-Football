import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST handler: Bulk update multiple player scores
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.json();
    const { playerScores } = data;

    if (!playerScores || !Array.isArray(playerScores) || playerScores.length === 0) {
      return NextResponse.json(
        { error: "Invalid input: playerScores array is required" },
        { status: 400 }
      );
    }

    // Create an array of database operations
    const operations = playerScores.map((scoreData) => {
      const { playerId, round, isDisabled, statusReason, score, scoreData: playerScoreData } = scoreData;
      
      // Format score data for storage
      const formattedScoreData = playerScoreData ? JSON.stringify(playerScoreData) : null;

      return prisma.playerScore.upsert({
        where: {
          playerId_round: {
            playerId,
            round,
          },
        },
        update: {
          isDisabled,
          statusReason,
          score,
          scoreData: formattedScoreData,
        },
        create: {
          playerId,
          round,
          isDisabled,
          statusReason,
          score,
          scoreData: formattedScoreData,
        },
      });
    });

    // Execute all operations in a transaction
    const results = await prisma.$transaction(operations);

    return NextResponse.json({ 
      message: `Successfully updated ${results.length} player scores`,
      count: results.length 
    }, { status: 200 });
  } catch (error) {
    console.error("API POST /player-scores/bulk: Error bulk updating player scores:", error);
    return NextResponse.json(
      { error: "Failed to bulk update player scores" },
      { status: 500 }
    );
  }
}