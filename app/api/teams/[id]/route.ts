import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// Centralized error messages for consistency
const ERROR_MESSAGES = {
    UNAUTHORIZED: "Unauthorized: You must be logged in to perform this action",
    FORBIDDEN: "Forbidden: You don't have permission to perform this action",
    NOT_FOUND: "Team not found",
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

// PUT handler: Update a team by ID
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const teamId = parseInt(params.id);
        if (isNaN(teamId)) {
            return NextResponse.json(
                { error: "Invalid team ID" },
                { status: 400 }
            );
        }

        // Check if team exists
        const team = await prisma.team.findUnique({
            where: { id: teamId },
        });

        if (!team) {
            return NextResponse.json(
                { error: ERROR_MESSAGES.NOT_FOUND },
                { status: 404 }
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

        // Update the team
        const updatedTeam = await prisma.team.update({
            where: { id: teamId },
            data: {
                name,
                budget: Number(budget),
            },
        });

        return NextResponse.json(updatedTeam);
    } catch (error) {
        console.error("Error updating team:", error);
        return NextResponse.json(
            { error: "Failed to update team" },
            { status: 500 }
        );
    }
}

// DELETE handler: Delete a team by ID
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const teamId = parseInt(params.id);
        if (isNaN(teamId)) {
            return NextResponse.json(
                { error: "Invalid team ID" },
                { status: 400 }
            );
        }

        // Check if team exists
        const team = await prisma.team.findUnique({
            where: { id: teamId },
        });

        if (!team) {
            return NextResponse.json(
                { error: ERROR_MESSAGES.NOT_FOUND },
                { status: 404 }
            );
        }

        // Delete the team's draft picks first
        await prisma.draftPick.deleteMany({
            where: { teamId },
        });

        // Delete the team
        await prisma.team.delete({
            where: { id: teamId },
        });

        return NextResponse.json(
            { message: "Team deleted successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting team:", error);
        return NextResponse.json(
            { error: "Failed to delete team" },
            { status: 500 }
        );
    }
}