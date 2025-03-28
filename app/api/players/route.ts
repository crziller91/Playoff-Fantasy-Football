import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';
import { Player } from '@prisma/client';

export async function GET() {
    try {
        console.log('API route: Fetching players from database');
        const players = await prisma.player.findMany();
        console.log(`API route: Found ${players.length} players`);

        // Format the position field to match the expected type in the frontend
        const formattedPlayers = players.map((player: Player) => ({
            id: player.id,
            name: player.name,
            position: player.position as "QB" | "RB" | "WR" | "TE" | "K" | "DST",
        }));

        return NextResponse.json(formattedPlayers);
    } catch (error) {
        console.error('API route: Error fetching players:', error);
        return NextResponse.json(
            { error: 'Failed to fetch players', details: error instanceof Error ? error.message : String(error) },
            { status: 500 }
        );
    }
} 