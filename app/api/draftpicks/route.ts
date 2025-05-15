import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../lib/prisma";
import { DraftPickWithRelations, DraftPickRequest, DraftPicks, Team } from "../../types";
import { DraftManager } from "../../domain/DraftManager";

// Centralized error messages for consistency and easy updates
const ERROR_MESSAGES = {
  FETCH_FAILED: "Failed to fetch draft picks",
  SAVE_FAILED: "Failed to save draft pick",
  RESET_FAILED: "Failed to reset draft picks",
  MISSING_FIELDS: "Missing required fields: teamName and round are required",
  TEAM_NOT_FOUND: (teamName: string) => `Team "${teamName}" not found`,
  INSUFFICIENT_BUDGET: (budget: number) => `Insufficient budget. Only $${budget} remaining.`,
} as const;

// Utility function to standardize error responses
const createErrorResponse = (message: string, error: unknown, status: number) => {
  const details = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message, details }, { status });
};

// GET handler: Retrieves all draft picks from the database
export async function GET(): Promise<NextResponse> {
  try {
    console.log("API GET /draftpicks: Fetching draft picks from database");

    const draftPicks = await prisma.draftPick.findMany({
      include: {
        team: true,
        player: true,
      },
    }) as DraftPickWithRelations[];

    console.log(`API GET /draftpicks: Found ${draftPicks.length} draft picks`);

    const formattedDraftPicks = DraftManager.formatDraftPicks(draftPicks);

    return NextResponse.json(formattedDraftPicks, { status: 200 });
  } catch (error) {
    console.error("API GET /draftpicks: Error fetching draft picks:", error);
    return createErrorResponse(ERROR_MESSAGES.FETCH_FAILED, error, 500);
  }
}

// POST handler: Saves or deletes a draft pick based on the request payload
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log("API POST /draftpicks: Processing draft pick save request");

    const data: DraftPickRequest = await request.json();
    const { teamName, round, playerId, cost } = data;

    if (!teamName || round === undefined) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.MISSING_FIELDS },
        { status: 400 }
      );
    }

    // Fetch the team by name to get its ID and budget
    const team = await prisma.team.findFirst({
      where: { name: teamName },
    });

    if (!team) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.TEAM_NOT_FOUND(teamName) },
        { status: 404 }
      );
    }

    // Check if a draft pick already exists for this team and round
    const existingPick = await prisma.draftPick.findFirst({
      where: {
        teamId: team.id,
        round,
      },
      include: {
        player: true,
      },
    });

    // If playerId is null, delete the pick and refund the cost if applicable
    if (playerId === null) {
      return await deleteDraftPick(existingPick, teamName, round);
    } else {
      // Check if the team has enough budget for this pick
      if (cost && cost > team.budget) {
        return NextResponse.json(
          { error: ERROR_MESSAGES.INSUFFICIENT_BUDGET(team.budget) },
          { status: 400 }
        );
      }

      return await saveDraftPick(existingPick, team.id, teamName, round, playerId, cost);
    }
  } catch (error) {
    console.error("API POST /draftpicks: Error processing request:", error);
    return createErrorResponse(ERROR_MESSAGES.SAVE_FAILED, error, 500);
  }
}

// DELETE handler in app/api/draftpicks/route.ts
export async function DELETE(): Promise<NextResponse> {
  try {
    console.log("API DELETE /draftpicks: Resetting all draft picks and player scores");

    // Start a transaction to delete draft picks, reset team budgets, and clear player scores
    await prisma.$transaction(async (prisma) => {
      // Delete all records from the DraftPick table
      await prisma.draftPick.deleteMany();

      // Delete all records from the PlayerScore table
      await prisma.playerScore.deleteMany();

      // Get all teams with their original budgets
      const teams = await prisma.team.findMany({
        select: {
          id: true,
          originalBudget: true
        }
      });

      // Reset each team's budget to its original budget
      for (const team of teams) {
        await prisma.team.update({
          where: { id: team.id },
          data: { budget: team.originalBudget }
        });
      }
    });

    return NextResponse.json(
      { message: "Successfully reset all draft picks, player scores, and team budgets" },
      { status: 200 }
    );
  } catch (error) {
    console.error("API DELETE /draftpicks: Error resetting draft picks:", error);
    return createErrorResponse(ERROR_MESSAGES.RESET_FAILED, error, 500);
  }
}

// Helper function to delete an existing draft pick
async function deleteDraftPick(
  existingPick: { id: number; cost?: number | null; player?: any } | null,
  teamName: Team,
  round: number
): Promise<NextResponse> {
  console.log(`API POST /draftpicks: Deleting draft pick for ${teamName}, round ${round}`);

  if (!existingPick) {
    return NextResponse.json(
      { message: `No draft pick found for ${teamName}, round ${round}` },
      { status: 200 }
    );
  }

  // Start transaction to delete pick and refund the cost to team's budget if applicable
  await prisma.$transaction(async (prisma) => {
    // Delete the pick
    await prisma.draftPick.delete({
      where: { id: existingPick.id },
    });

    // If there was a cost, refund it to the team's budget
    if (existingPick.cost) {
      await prisma.team.updateMany({
        where: { name: teamName },
        data: {
          budget: {
            increment: existingPick.cost
          }
        }
      });
    }
  });

  return NextResponse.json(
    { message: `Draft pick for ${teamName}, round ${round} deleted successfully` },
    { status: 200 }
  );
}

// Helper function to save or update a draft pick
async function saveDraftPick(
  existingPick: { id: number; cost?: number | null } | null,
  teamId: number,
  teamName: Team,
  round: number,
  playerId: number,
  cost: number | null | undefined
): Promise<NextResponse> {
  console.log(`API POST /draftpicks: Saving draft pick for ${teamName}, round ${round}, player ${playerId}`);

  // Declare pick variable outside the transaction 
  let pick: any = null;

  await prisma.$transaction(async (prisma) => {
    // If there's an existing pick with a cost, refund it
    if (existingPick && existingPick.cost) {
      await prisma.team.update({
        where: { id: teamId },
        data: {
          budget: {
            increment: existingPick.cost
          }
        }
      });
    }

    // Define the data structure for creating/updating a pick
    const pickData = {
      teamId,
      round,
      playerId,
      cost: cost || null, // Use null if cost is undefined
    };

    // Update or create the pick
    if (existingPick) {
      pick = await prisma.draftPick.update({
        where: { id: existingPick.id },
        data: pickData,
        include: { player: true, team: true },
      });
    } else {
      pick = await prisma.draftPick.create({
        data: pickData,
        include: { player: true, team: true },
      });
    }

    // If there's a cost, deduct it from the team's budget
    if (cost) {
      await prisma.team.update({
        where: { id: teamId },
        data: {
          budget: {
            decrement: cost
          }
        }
      });
    }
  });

  // Make sure pick is defined before returning
  if (!pick) {
    return NextResponse.json(
      { error: "Failed to create or update draft pick" },
      { status: 500 }
    );
  }

  return NextResponse.json(pick as DraftPickWithRelations, {
    status: existingPick ? 200 : 201,
  });
}