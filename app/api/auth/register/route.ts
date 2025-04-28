import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const { name, email, password } = await request.json();

        // Validate the inputs
        if (!name || !email || !password) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400 }
            );
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Use a transaction to ensure all operations succeed or fail together
        const result = await prisma.$transaction(async (tx) => {
            // Create the user
            const user = await tx.user.create({
                data: {
                    name,
                    email,
                    hashedPassword,
                },
            });

            // Check if this is the first user (no other users exist)
            const userCount = await tx.user.count();
            const isFirstUser = userCount === 1;

            // Find if any admin exists
            const adminExists = await tx.permission.findFirst({
                where: { isAdmin: true }
            });

            // If this is the first user or no admin exists, make this user an admin
            if (isFirstUser || !adminExists) {
                await tx.permission.create({
                    data: {
                        userId: user.id,
                        editScores: true, // Grant score editing privileges
                        isAdmin: true,    // Grant admin privileges
                    }
                });
            } else {
                // Create default permissions (no admin rights)
                await tx.permission.create({
                    data: {
                        userId: user.id,
                        editScores: false,
                        isAdmin: false,
                    }
                });
            }

            return { user, isAdmin: isFirstUser || !adminExists };
        });

        // Remove sensitive information before returning
        const { user } = result;
        const { hashedPassword: _, ...userWithoutPassword } = user;

        return NextResponse.json(
            {
                message: "User registered successfully",
                user: userWithoutPassword,
                isAdmin: result.isAdmin
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "An error occurred during registration" },
            { status: 500 }
        );
    }
}