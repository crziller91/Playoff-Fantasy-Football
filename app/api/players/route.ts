import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { Player } from "../../types";

// Centralized error messages for consistency and easy updates
const ERROR_MESSAGES = {
  FETCH_FAILED: "Failed to fetch players",
} as const;

// Utility function to standardize error responses
// Ensures consistent error formatting across routes
const createErrorResponse = (message: string, error: unknown, status: number) => {
  const details = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message, details }, { status });
};

// GET handler: Retrieves all players from the database
export async function GET(): Promise<NextResponse> {
  try {
    // Log the start of the operation for debugging
    console.log("API GET /players: Fetching players from database");

    // Fetch all players from the Player table
    const players = await prisma.player.findMany();

    console.log(`API GET /players: Found ${players.length} players`);

    // Format the raw database data into the Player type expected by the frontend
    // Now including teamName in the formatted response
    const formattedPlayers: Player[] = players.map((player) => ({
      id: player.id,
      name: player.name,
      position: player.position as "QB" | "RB" | "WR" | "TE" | "K" | "DST",
      teamName: player.teamName || undefined, // Include teamName if available
    }));

    // Return the formatted players with a 200 OK status
    return NextResponse.json(formattedPlayers, { status: 200 });
  } catch (error) {
    // Log the error with details for server-side debugging
    console.error("API GET /players: Error fetching players:", error);

    // Return a standardized error response
    return createErrorResponse(ERROR_MESSAGES.FETCH_FAILED, error, 500);
  }
}