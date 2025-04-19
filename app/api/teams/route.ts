import { NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { Team, TeamWithBudget } from "../../types";

// Centralized error messages for consistency and easy updates
const ERROR_MESSAGES = {
  FETCH_FAILED: "Failed to fetch teams",
} as const;

// Utility function to standardize error responses
const createErrorResponse = (message: string, error: unknown, status: number) => {
  const details = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message, details }, { status });
};

// GET handler: Retrieves all team names with their budgets
export async function GET(): Promise<NextResponse> {
  try {
    console.log("API GET /teams: Fetching teams from database");

    // Fetch all teams from the Team table
    const teams = await prisma.team.findMany();

    console.log(`API GET /teams: Found ${teams.length} teams`);

    // Return teams with both name and budget
    const formattedTeams: TeamWithBudget[] = teams.map((team) => ({
      name: team.name as Team,
      budget: team.budget
    }));

    return NextResponse.json(formattedTeams, { status: 200 });
  } catch (error) {
    console.error("API GET /teams: Error fetching teams:", error);
    return createErrorResponse(ERROR_MESSAGES.FETCH_FAILED, error, 500);
  }
}