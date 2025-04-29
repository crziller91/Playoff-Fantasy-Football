import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

// PUT handler: Update a single scoring rule by ID
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    try {
        const session = await getServerSession(authOptions);

        // Check authentication
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Check admin permission
        const adminPermission = await prisma.permission.findUnique({
            where: { userId: session.user.id },
        });

        if (!adminPermission?.isAdmin) {
            return NextResponse.json(
                { error: "Forbidden: You don't have permission to update scoring rules" },
                { status: 403 }
            );
        }

        const ruleId = parseInt(params.id);
        if (isNaN(ruleId)) {
            return NextResponse.json(
                { error: "Invalid rule ID" },
                { status: 400 }
            );
        }

        // Check if rule exists
        const rule = await prisma.scoringRule.findUnique({
            where: { id: ruleId },
        });

        if (!rule) {
            return NextResponse.json(
                { error: "Scoring rule not found" },
                { status: 404 }
            );
        }

        // Parse request body
        const { value } = await request.json();

        // Validate input
        if (value === undefined || isNaN(Number(value))) {
            return NextResponse.json(
                { error: "Invalid value: must be a number" },
                { status: 400 }
            );
        }

        // Update the rule
        const updatedRule = await prisma.scoringRule.update({
            where: { id: ruleId },
            data: {
                value: Number(value),
            },
        });

        return NextResponse.json(updatedRule);
    } catch (error) {
        console.error("Error updating scoring rule:", error);
        return NextResponse.json(
            { error: "Failed to update scoring rule" },
            { status: 500 }
        );
    }
}