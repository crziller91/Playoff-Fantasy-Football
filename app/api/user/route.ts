import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

// GET handler: Get all users (admin only)
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

        // Check if the current user is an admin
        const adminPermission = await prisma.permission.findUnique({
            where: { userId: session.user.id },
        });

        if (!adminPermission?.isAdmin) {
            return NextResponse.json(
                { error: "Forbidden: You don't have permission to view users" },
                { status: 403 }
            );
        }

        // Check if permissions should be included
        const { searchParams } = new URL(request.url);
        const withPermissions = searchParams.get("withPermissions") === "true";

        // Get all users
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                permission: withPermissions,
            },
        });

        return NextResponse.json(users);
    } catch (error) {
        console.error("API GET /user: Error fetching users:", error);
        return NextResponse.json(
            { error: "Failed to fetch users" },
            { status: 500 }
        );
    }
}