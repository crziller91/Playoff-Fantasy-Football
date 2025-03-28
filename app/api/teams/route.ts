import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { Team } from '@prisma/client';

export async function GET() {
    try {
        console.log('API route: Fetching teams from database');
        const teams = await prisma.team.findMany();
        console.log(`API route: Found ${teams.length} teams`);

        // Format the team names to match the expected type in the frontend
        const formattedTeams = teams.map((team: Team) => team.name);

        return NextResponse.json(formattedTeams);
    } catch (error) {
        console.error('API route: Error fetching teams:', error);
        return NextResponse.json(
            { error: 'Failed to fetch teams', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
} 