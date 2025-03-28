import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { DraftPickWithRelations, DraftPickRequest, DraftPicks, Team } from '../../types';

// Constants for error messages
const ERROR_MESSAGES = {
  FETCH_FAILED: 'Failed to fetch draft picks',
  SAVE_FAILED: 'Failed to save draft pick',
  RESET_FAILED: 'Failed to reset draft picks',
  MISSING_FIELDS: 'Missing required fields: teamName and round are required',
} as const;

// Utility function to format error responses
const createErrorResponse = (message: string, error: unknown, status: number) => {
  const details = error instanceof Error ? error.message : String(error);
  return NextResponse.json({ error: message, details }, { status });
};

// GET: Fetch all draft picks
export async function GET(): Promise<NextResponse> {
  try {
    console.log('API route: Fetching draft picks from database');
    
    const draftPicks = await prisma.draftPick.findMany({
      include: {
        team: true,
        player: true,
      },
    }) as DraftPickWithRelations[];

    console.log(`API route: Found ${draftPicks.length} draft picks`);

    const formattedDraftPicks: DraftPicks = await prisma.team.findMany()
      .then(teams => teams.reduce((acc, team) => {
        acc[team.name as Team] = {};
        return acc;
      }, {} as DraftPicks));

    draftPicks.forEach(pick => {
      formattedDraftPicks[pick.team.name][pick.round] = pick.player ?? null;
    });

    return NextResponse.json(formattedDraftPicks);
  } catch (error) {
    console.error('API route: Error fetching draft picks:', error);
    return createErrorResponse(ERROR_MESSAGES.FETCH_FAILED, error, 500);
  }
}

// POST: Save or delete a draft pick
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('API route: Saving draft pick');
    const data = await request.json() as DraftPickRequest;
    const { teamName, round, playerId } = data;

    if (!teamName || round === undefined) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.MISSING_FIELDS },
        { status: 400 }
      );
    }

    const team = await prisma.team.findFirst({
      where: { name: teamName },
    });

    if (!team) {
      return NextResponse.json(
        { error: `Team "${teamName}" not found` },
        { status: 404 }
      );
    }

    const existingPick = await prisma.draftPick.findFirst({
      where: {
        teamId: team.id,
        round,
      },
    });

    if (playerId === null) {
      return await handleDeletePick(existingPick, teamName, round);
    }

    return await handleSavePick(existingPick, team.id, round, playerId);
  } catch (error) {
    console.error('API route: Error saving draft pick:', error);
    return createErrorResponse(ERROR_MESSAGES.SAVE_FAILED, error, 500);
  }
}

// DELETE: Reset all draft picks
export async function DELETE(): Promise<NextResponse> {
  try {
    console.log('API route: Resetting all draft picks');
    await prisma.draftPick.deleteMany();
    return NextResponse.json({ message: 'All draft picks have been reset' });
  } catch (error) {
    console.error('API route: Error resetting draft picks:', error);
    return createErrorResponse(ERROR_MESSAGES.RESET_FAILED, error, 500);
  }
}

// Helper function to handle pick deletion
async function handleDeletePick(
  existingPick: { id: number } | null,
  teamName: Team,
  round: number
): Promise<NextResponse> {
  console.log(`API route: Deleting draft pick for team ${teamName}, round ${round}`);

  if (!existingPick) {
    return NextResponse.json({
      message: `No draft pick found for team ${teamName}, round ${round}`,
    });
  }

  await prisma.draftPick.delete({
    where: { id: existingPick.id },
  });

  return NextResponse.json({
    message: `Draft pick for team ${teamName}, round ${round} deleted successfully`,
  });
}

// Helper function to handle pick creation/update
async function handleSavePick(
  existingPick: { id: number } | null,  // Changed from DraftPickWithRelations
  teamId: number,
  round: number,
  playerId: number
): Promise<NextResponse> {
  const pickData = {
    data: { teamId, round, playerId },
    include: { player: true, team: true },
  };

  const pick = existingPick
    ? await prisma.draftPick.update({
        where: { id: existingPick.id },
        data: { playerId },
        include: { player: true, team: true },
      })
    : await prisma.draftPick.create(pickData);

  return NextResponse.json(pick as DraftPickWithRelations);
}