import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// Centralized error messages
const ERROR_MESSAGES = {
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

// POST handler: Update all team budgets at once
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
        const { budget } = await request.json();

        // Validate budget
        if (!budget || isNaN(Number(budget)) || Number(budget) <= 0) {
            return NextResponse.json(
                { error: "Budget must be a positive number" },
                { status: 400 }
            );
        }

        // Update all teams' budgets
        const updatedTeams = await prisma.team.updateMany({
            data: {
                budget: Number(budget),
            },
        });

        return NextResponse.json({
            message: `Successfully updated all team budgets to $${budget}`,
            count: updatedTeams.count,
        });
    } catch (error) {
        console.error("Error updating team budgets:", error);
        return NextResponse.json(
            { error: "Failed to update team budgets" },
            { status: 500 }
        );
    }
}