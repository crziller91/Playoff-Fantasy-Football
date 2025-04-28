import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// GET handler: Check current user's permissions
export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);

        // If not authenticated, return unauthorized
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Find or create permissions for this user
        let permissions = await prisma.permission.findUnique({
            where: { userId: session.user.id },
        });

        // If no permissions record exists yet, create one with default values
        if (!permissions) {
            permissions = await prisma.permission.create({
                data: {
                    userId: session.user.id,
                    editScores: false, // Default to false
                    isAdmin: false,    // Default to false
                },
            });
        }

        // Return the permissions
        return NextResponse.json(permissions);
    } catch (error) {
        console.error("API GET /permissions: Error fetching permissions:", error);
        return NextResponse.json(
            { error: "Failed to fetch permissions" },
            { status: 500 }
        );
    }
}

// POST handler: Update a user's permissions (admin only)
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
                { error: "Forbidden: You don't have permission to update user permissions" },
                { status: 403 }
            );
        }

        // Get the request body
        const data = await request.json();
        const { userId, editScores, isAdmin } = data;

        if (!userId) {
            return NextResponse.json(
                { error: "Missing required field: userId" },
                { status: 400 }
            );
        }

        // Make sure the user exists
        const userExists = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!userExists) {
            return NextResponse.json(
                { error: `User with ID ${userId} not found` },
                { status: 404 }
            );
        }

        // Don't allow removing admin from self
        if (userId === session.user.id && adminPermission.isAdmin && isAdmin === false) {
            return NextResponse.json(
                { error: "You cannot remove your own admin privileges" },
                { status: 400 }
            );
        }

        // Update or create permissions for the user
        const permissions = await prisma.permission.upsert({
            where: { userId },
            update: {
                editScores: editScores === true,
                isAdmin: isAdmin === true,
            },
            create: {
                userId,
                editScores: editScores === true,
                isAdmin: isAdmin === true,
            },
        });

        return NextResponse.json(permissions);
    } catch (error) {
        console.error("API POST /permissions: Error updating permissions:", error);
        return NextResponse.json(
            { error: "Failed to update permissions" },
            { status: 500 }
        );
    }
}