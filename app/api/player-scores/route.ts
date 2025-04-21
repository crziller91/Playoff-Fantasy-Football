import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET handler: Retrieves all player scores
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        // Get query parameters
        const { searchParams } = new URL(request.url);
        const round = searchParams.get("round");

        // Apply filter if round is specified
        const filter = round ? { round } : {};

        // Fetch player scores with related player data
        const playerScores = await prisma.playerScore.findMany({
            where: filter,
            include: {
                player: true,
            },
        });

        // Format the response into the structure expected by the frontend
        const formattedScores: { [round: string]: { [playerName: string]: any } } = {};

        // Initialize all rounds to ensure they exist in the response
        const allRounds = ["Wild Card", "Divisional", "Conference", "Superbowl"];
        allRounds.forEach(r => {
            formattedScores[r] = {};
        });

        playerScores.forEach((score) => {
            formattedScores[score.round][score.player.name] = {
                id: score.player.id,
                name: score.player.name,
                position: score.player.position as "QB" | "RB" | "WR" | "TE" | "K" | "DST",
                teamName: score.player.teamName || undefined,
                score: score.score,
                isDisabled: score.isDisabled,
                statusReason: score.statusReason as "eliminated" | "notPlaying" | null,
                scoreData: score.scoreData ? JSON.parse(score.scoreData) : undefined,
            };
        });

        return NextResponse.json(formattedScores, { status: 200 });
    } catch (error) {
        console.error("API GET /player-scores: Error fetching player scores:", error);
        return NextResponse.json(
            { error: "Failed to fetch player scores" },
            { status: 500 }
        );
    }
}

// POST handler: Creates or updates a player score
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const data = await request.json();
        const { playerId, round, isDisabled, statusReason, score, scoreData } = data;

        if (!playerId || !round) {
            return NextResponse.json(
                { error: "Missing required fields: playerId and round are required" },
                { status: 400 }
            );
        }

        // Find player to ensure it exists
        const player = await prisma.player.findUnique({
            where: { id: playerId },
        });

        if (!player) {
            return NextResponse.json(
                { error: `Player with ID ${playerId} not found` },
                { status: 404 }
            );
        }

        // Format score data for storage
        const formattedScoreData = scoreData ? JSON.stringify(scoreData) : null;

        // Upsert the player score (update if exists, create if not)
        const playerScore = await prisma.playerScore.upsert({
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
            include: {
                player: true,
            }
        });

        return NextResponse.json(playerScore, { status: 200 });
    } catch (error) {
        console.error("API POST /player-scores: Error saving player score:", error);
        return NextResponse.json(
            { error: "Failed to save player score" },
            { status: 500 }
        );
    }
}