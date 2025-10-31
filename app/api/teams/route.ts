import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { Team, TeamWithBudget } from "../../types";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Centralized error messages for consistency and easy updates
const ERROR_MESSAGES = {
  FETCH_FAILED: "Failed to fetch teams",
  SAVE_FAILED: "Failed to save team",
  UNAUTHORIZED: "Unauthorized: You must be logged in to perform this action",
  FORBIDDEN: "Forbidden: You don't have permission to perform this action",
  DRAFT_FINISHED: "Cannot modify teams after the draft is finished",
};

// Check if the user is an admin
const checkAdminPermission = async (userId: string) => {
  const permission = await prisma.permission.findUnique({
    where: { userId },
  });

  return permission?.isAdmin || false;
};

// Check if the draft is finished
const isDraftFinished = async (): Promise<boolean> => {
  const draftStatus = await prisma.draftStatus.findFirst();
  return draftStatus?.isDraftFinished ?? false;
};

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

    // Return teams with name, budget, and originalBudget
    const formattedTeams: TeamWithBudget[] = teams.map((team) => ({
      id: team.id, // Include ID for admin functionality
      name: team.name as Team,
      budget: team.budget,
      originalBudget: team.originalBudget
    }));

    return NextResponse.json(formattedTeams, { status: 200 });
  } catch (error) {
    console.error("API GET /teams: Error fetching teams:", error);
    return createErrorResponse(ERROR_MESSAGES.FETCH_FAILED, error, 500);
  }
}

// POST handler: Add a new team (admin only)
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const session = await getServerSession(authOptions);

    // Check authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: 401 }
      );
    }

    // Check admin permission
    const isAdmin = await checkAdminPermission(session.user.id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.FORBIDDEN },
        { status: 403 }
      );
    }

    // Check if draft is finished
    const draftFinished = await isDraftFinished();
    if (draftFinished) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.DRAFT_FINISHED },
        { status: 403 }
      );
    }

    // Parse request body
    const { name, budget } = await request.json();

    // Validate inputs
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    if (!budget || isNaN(Number(budget)) || Number(budget) <= 0) {
      return NextResponse.json(
        { error: "Budget must be a positive number" },
        { status: 400 }
      );
    }

    // Check if team with this name already exists
    const existingTeam = await prisma.team.findFirst({
      where: { name },
    });

    if (existingTeam) {
      return NextResponse.json(
        { error: `Team "${name}" already exists` },
        { status: 400 }
      );
    }

    // Create the new team
    const newTeam = await prisma.team.create({
      data: {
        name,
        budget: Number(budget),
        originalBudget: Number(budget),
      },
    });

    // Return the new team
    return NextResponse.json(newTeam, { status: 201 });
  } catch (error) {
    console.error("Error creating team:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}