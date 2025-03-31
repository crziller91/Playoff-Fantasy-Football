import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { Team } from "../../types";

// Centralized error messages for consistency and easy updates
const ERROR_MESSAGES = {
  FETCH_FAILED: "Failed to fetch teams",
} as const;

// Utility function to standardize error responses
// Ensures consistent error formatting across routes
const createErrorResponse = (message: string, error: unknown, status: number) => {
  const details = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message, details }, { status });
};

// GET handler: Retrieves all team names from the database
export async function GET(): Promise<NextResponse> {
  try {
    // Log the start of the operation for debugging
    console.log("API GET /teams: Fetching teams from database");

    // Fetch all teams from the Team table
    const teams = await prisma.team.findMany();

    console.log(`API GET /teams: Found ${teams.length} teams`);

    // Extract team names into the Team type (string) expected by the frontend
    // No complex logic needed; simple mapping suffices
    const formattedTeams: Team[] = teams.map((team) => team.name as Team);

    // Return the formatted team names with a 200 OK status
    return NextResponse.json(formattedTeams, { status: 200 });
  } catch (error) {
    // Log the error with details for server-side debugging
    console.error("API GET /teams: Error fetching teams:", error);

    // Return a standardized error response
    return createErrorResponse(ERROR_MESSAGES.FETCH_FAILED, error, 500);
  }
}