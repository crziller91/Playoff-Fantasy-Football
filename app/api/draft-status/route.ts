import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const draftStatus = await prisma.draftStatus.findFirst();
        return NextResponse.json({ isDraftFinished: draftStatus?.isDraftFinished ?? false });
    } catch (error) {
        console.error('Error fetching draft status:', error);
        return NextResponse.json({ error: 'Failed to fetch draft status' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { isDraftFinished } = await request.json();

        // First, check if any draft status record exists
        const existingStatus = await prisma.draftStatus.findFirst();

        let draftStatus;

        if (existingStatus) {
            // If a record exists, update it
            draftStatus = await prisma.draftStatus.update({
                where: { id: existingStatus.id },
                data: { isDraftFinished }
            });
        } else {
            // If no record exists, create a new one
            draftStatus = await prisma.draftStatus.create({
                data: { isDraftFinished }
            });
        }

        return NextResponse.json(draftStatus);
    } catch (error) {
        console.error('Error updating draft status:', error);
        return NextResponse.json({ error: 'Failed to update draft status' }, { status: 500 });
    }
}