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
} as const;

// Utility function to standardize error responses
// Reduces duplication and ensures consistent error formatting
const createErrorResponse = (message: string, error: unknown, status: number) => {
  const details = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message, details }, { status });
};

// GET handler: Retrieves all draft picks from the database
export async function GET(): Promise<NextResponse> {
  try {
    // Log the start of the operation for debugging
    console.log("API GET /draftpicks: Fetching draft picks from database");

    // Fetch all draft picks with related team and player data
    const draftPicks = await prisma.draftPick.findMany({
      include: {
        team: true, // Include team details (name, id)
        player: true, // Include player details (if picked)
      },
    }) as DraftPickWithRelations[];

    console.log(`API GET /draftpicks: Found ${draftPicks.length} draft picks`);

    // Format the raw database data into the DraftPicks structure expected by the frontend
    // Delegate to DraftManager to keep business logic out of the data layer
    const formattedDraftPicks = DraftManager.formatDraftPicks(draftPicks);

    // Return the formatted data with a 200 OK status
    return NextResponse.json(formattedDraftPicks, { status: 200 });
  } catch (error) {
    // Log the error with details for server-side debugging
    console.error("API GET /draftpicks: Error fetching draft picks:", error);

    // Return a standardized error response
    return createErrorResponse(ERROR_MESSAGES.FETCH_FAILED, error, 500);
  }
}

// POST handler: Saves or deletes a draft pick based on the request payload
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Log the start of the save operation
    console.log("API POST /draftpicks: Processing draft pick save request");

    // Parse the request body into the expected DraftPickRequest shape
    const data: DraftPickRequest = await request.json();
    const { teamName, round, playerId } = data;

    // Validate required fields to ensure data integrity
    if (!teamName || round === undefined) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.MISSING_FIELDS },
        { status: 400 }
      );
    }

    // Fetch the team by name to get its ID for the database operation
    const team = await prisma.team.findFirst({
      where: { name: teamName },
    });

    // Check if the team exists; return 404 if not
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
    });

    // If playerId is null, delete the pick; otherwise, save or update it
    return playerId === null
      ? await deleteDraftPick(existingPick, teamName, round)
      : await saveDraftPick(existingPick, team.id, teamName, round, playerId);
  } catch (error) {
    console.error("API POST /draftpicks: Error processing request:", error);
    return createErrorResponse(ERROR_MESSAGES.SAVE_FAILED, error, 500);
  }
}

// DELETE handler: Resets all draft picks by clearing the DraftPick table
export async function DELETE(): Promise<NextResponse> {
  try {
    console.log("API DELETE /draftpicks: Resetting all draft picks");

    // Delete all records from the DraftPick table
    const result = await prisma.draftPick.deleteMany();

    console.log(`API DELETE /draftpicks: Deleted ${result.count} draft picks`);

    // Return a success message with a 200 OK status
    return NextResponse.json(
      { message: `Successfully reset ${result.count} draft picks` },
      { status: 200 }
    );
  } catch (error) {
    console.error("API DELETE /draftpicks: Error resetting draft picks:", error);
    return createErrorResponse(ERROR_MESSAGES.RESET_FAILED, error, 500);
  }
}

// Helper function to delete an existing draft pick
async function deleteDraftPick(
  existingPick: { id: number } | null,
  teamName: Team,
  round: number
): Promise<NextResponse> {
  console.log(`API POST /draftpicks: Deleting draft pick for ${teamName}, round ${round}`);

  // If no pick exists, return a 200 with a message (no action needed)
  if (!existingPick) {
    return NextResponse.json(
      { message: `No draft pick found for ${teamName}, round ${round}` },
      { status: 200 }
    );
  }

  // Delete the existing pick by its ID
  await prisma.draftPick.delete({
    where: { id: existingPick.id },
  });

  // Return a success message with a 200 OK status
  return NextResponse.json(
    { message: `Draft pick for ${teamName}, round ${round} deleted successfully` },
    { status: 200 }
  );
}

// Helper function to save or update a draft pick
async function saveDraftPick(
  existingPick: { id: number } | null,
  teamId: number,
  teamName: Team,
  round: number,
  playerId: number
): Promise<NextResponse> {
  console.log(`API POST /draftpicks: Saving draft pick for ${teamName}, round ${round}, player ${playerId}`);

  // Define the data structure for creating a new pick
  const pickData = {
    teamId,
    round,
    playerId,
  };

  // Update if the pick exists, otherwise create a new one
  const pick = existingPick
    ? await prisma.draftPick.update({
        where: { id: existingPick.id },
        data: { playerId },
        include: { player: true, team: true },
      })
    : await prisma.draftPick.create({
        data: pickData,
        include: { player: true, team: true },
      });

  // Return the created/updated pick with a 201 Created or 200 OK status
  return NextResponse.json(pick as DraftPickWithRelations, {
    status: existingPick ? 200 : 201,
  });
}