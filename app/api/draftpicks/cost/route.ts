import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
export const dynamic = 'force-dynamic'; // Ensure the route is always dynamic since without this it is trying to be static

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const team = searchParams.get("team");
        const pick = searchParams.get("pick");

        if (!team || !pick) {
            return NextResponse.json(
                { error: "Missing required query parameters: team and pick" },
                { status: 400 }
            );
        }

        // Find the team ID from the team name
        const teamRecord = await prisma.team.findFirst({
            where: { name: team },
        });

        if (!teamRecord) {
            return NextResponse.json(
                { error: `Team "${team}" not found` },
                { status: 404 }
            );
        }

        // Find the draft pick to get its cost
        const draftPick = await prisma.draftPick.findFirst({
            where: {
                teamId: teamRecord.id,
                round: parseInt(pick),
            },
        });

        return NextResponse.json({
            cost: draftPick?.cost || 0,
        });
    } catch (error) {
        console.error("Error fetching draft pick cost:", error);
        return NextResponse.json(
            { error: "Failed to fetch draft pick cost" },
            { status: 500 }
        );
    }
}