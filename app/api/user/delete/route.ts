import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function DELETE(req: NextRequest) {
    try {
        // Get the current user's session
        const session = await getServerSession(authOptions);

        // Check if user is authenticated
        if (!session || !session.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        const userId = session.user.id;

        // Delete all related records first
        // This is necessary to avoid foreign key constraint errors
        await prisma.$transaction([
            // Delete all sessions for this user
            prisma.session.deleteMany({
                where: { userId },
            }),

            // Delete all accounts for this user
            prisma.account.deleteMany({
                where: { userId },
            }),

            // Finally delete the user
            prisma.user.delete({
                where: { id: userId },
            }),
        ]);

        return NextResponse.json(
            { message: "Account successfully deleted" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Error deleting user account:", error);
        return NextResponse.json(
            { error: "Failed to delete account" },
            { status: 500 }
        );
    }
}