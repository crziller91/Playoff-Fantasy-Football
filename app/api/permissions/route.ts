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

// POST handler section in app/api/permissions/route.ts
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

        // Explicitly define what we're updating to ensure we handle all fields
        const updateData: {
            editScores?: boolean;
            isAdmin?: boolean;
        } = {};

        // Only add fields that are explicitly provided in the request
        // Make sure they are converted to boolean values
        if (editScores !== undefined) {
            updateData.editScores = editScores === true;
        }

        if (isAdmin !== undefined) {
            updateData.isAdmin = isAdmin === true;

            // If setting isAdmin to true, automatically set editScores to true
            if (isAdmin === true) {
                updateData.editScores = true;
            }
        }

        // Update or create permissions for the user
        const permissions = await prisma.permission.upsert({
            where: { userId },
            update: updateData,
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