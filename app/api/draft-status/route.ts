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

        // Update or create the draft status
        const draftStatus = await prisma.draftStatus.upsert({
            where: { id: 1 },
            update: { isDraftFinished },
            create: { isDraftFinished }
        });

        return NextResponse.json(draftStatus);
    } catch (error) {
        console.error('Error updating draft status:', error);
        return NextResponse.json({ error: 'Failed to update draft status' }, { status: 500 });
    }
} 