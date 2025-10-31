import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

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

        // Check if user is an admin
        const userPermission = await prisma.permission.findUnique({
            where: { userId },
        });
        const isAdmin = userPermission?.isAdmin || false;

        // If user is admin, handle admin privilege transfer
        if (isAdmin) {
            // Start a transaction to ensure everything happens atomically
            await prisma.$transaction(async (tx) => {
                // Delete this user's permission
                await tx.permission.delete({
                    where: { userId },
                });

                // Delete all user-related records
                await tx.session.deleteMany({
                    where: { userId },
                });

                await tx.account.deleteMany({
                    where: { userId },
                });

                await tx.user.delete({
                    where: { id: userId },
                });

                // Find another user to make admin, if any exists
                const anotherUser = await tx.user.findFirst({
                    where: {
                        NOT: { id: userId }
                    },
                });

                if (anotherUser) {
                    // Make this user admin
                    await tx.permission.upsert({
                        where: { userId: anotherUser.id },
                        update: {
                            isAdmin: true,
                            editScores: true // Ensure editScores is also granted with admin
                        },
                        create: {
                            userId: anotherUser.id,
                            isAdmin: true,
                            editScores: true
                        },
                    });
                }
            });
        } else {
            // If not admin, just delete the user and related records
            await prisma.$transaction([
                // Delete this user's permission if it exists
                prisma.permission.deleteMany({
                    where: { userId },
                }),

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
        }

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