import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// POST handler: Deletes a player score entry
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const data = await request.json();
    const { playerId, round } = data;

    if (!playerId || !round) {
      return NextResponse.json(
        { error: "Missing required fields: playerId and round are required" },
        { status: 400 }
      );
    }

    // Delete the player score entry
    const result = await prisma.playerScore.delete({
      where: {
        playerId_round: {
          playerId,
          round,
        },
      },
    });

    return NextResponse.json({ 
      message: "Player score deleted successfully",
      id: result.id
    }, { status: 200 });
  } catch (error: unknown) {
    // Properly type the error and handle Prisma's "record not found" error
    if (error instanceof Error && 'code' in error && error.code === 'P2025') {
      return NextResponse.json({ 
        message: "Record not found, no deletion needed" 
      }, { status: 200 });
    }

    console.error("API POST /player-scores/delete: Error deleting player score:", error);
    return NextResponse.json(
      { error: "Failed to delete player score" },
      { status: 500 }
    );
  }
}