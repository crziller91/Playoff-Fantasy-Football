import { Player, Team, DraftPicks } from '../app/types';
import prisma from './prisma';

export async function getPlayers(): Promise<Player[]> {
    try {
        console.log("Accessing database to get players...");
        const players = await prisma.player.findMany();
        console.log(`Found ${players.length} players in database`);
        return players.map(player => ({
            id: player.id,
            name: player.name,
            position: player.position as "QB" | "RB" | "WR" | "TE" | "K" | "DST",
            teamName: player.teamName || undefined,
        }));
    } catch (error) {
        console.error("Database error when getting players:", error);
        throw error;
    }
}

export async function getTeams(): Promise<Team[]> {
    const teams = await prisma.team.findMany();
    return teams.map(team => team.name as Team);
}

export async function createInitialDraftPicks(teamNames: Team[], rounds: number[]): Promise<DraftPicks> {
    const teams = await prisma.team.findMany();

    // Create initial empty draft picks
    const draftPicks: DraftPicks = {};

    for (const team of teams) {
        draftPicks[team.name as Team] = {};
        for (const round of rounds) {
            draftPicks[team.name as Team][round] = null;
        }
    }

    return draftPicks;
} 