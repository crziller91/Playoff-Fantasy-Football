import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// GET handler: Get all scoring rules or filtered by position
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const position = searchParams.get("position");

        // Build the where clause conditionally
        const where = position ? { position } : {};

        // Fetch scoring rules
        const scoringRules = await prisma.scoringRule.findMany({
            where,
            orderBy: [
                { position: 'asc' },
                { category: 'asc' }
            ]
        });

        return NextResponse.json(scoringRules);
    } catch (error) {
        console.error("API GET /scoring-rules: Error fetching scoring rules:", error);
        return NextResponse.json(
            { error: "Failed to fetch scoring rules" },
            { status: 500 }
        );
    }
}

// POST handler: Update scoring rules (admin only)
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);

        // If not authenticated, return unauthorized
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check if the current user is an admin
        const adminPermission = await prisma.permission.findUnique({
            where: { userId: session.user.id },
        });

        if (!adminPermission?.isAdmin) {
            return NextResponse.json(
                { error: "Forbidden: You don't have permission to update scoring rules" },
                { status: 403 }
            );
        }

        // Get the request body
        const scoringRules = await request.json();

        if (!Array.isArray(scoringRules)) {
            return NextResponse.json(
                { error: "Invalid request: expected an array of scoring rules" },
                { status: 400 }
            );
        }

        // Perform updates in a transaction
        const results = await prisma.$transaction(
            scoringRules.map(rule => {
                // Validate the rule
                if (!rule.id || !rule.value || rule.value === undefined) {
                    throw new Error(`Invalid rule data: ${JSON.stringify(rule)}`);
                }

                return prisma.scoringRule.update({
                    where: { id: rule.id },
                    data: {
                        value: rule.value,
                        updatedAt: new Date()
                    }
                });
            })
        );

        return NextResponse.json({
            message: `Successfully updated ${results.length} scoring rules`,
            rules: results
        });
    } catch (error) {
        console.error("API POST /scoring-rules: Error updating scoring rules:", error);
        return NextResponse.json(
            { error: `Failed to update scoring rules: ${error instanceof Error ? error.message : String(error)}` },
            { status: 500 }
        );
    }
}