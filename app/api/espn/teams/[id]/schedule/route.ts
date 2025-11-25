import { NextRequest, NextResponse } from "next/server";

/**
 * API proxy for ESPN team schedule endpoint
 * Returns the schedule for a specific team
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Default to current NFL season if not specified
    // NFL season starts in September and runs through February of next year
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11
    const defaultSeason = (currentMonth <= 1) ? currentYear - 1 : currentYear;

    const season = searchParams.get('season') || defaultSeason.toString();

    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${id}/schedule?season=${season}`;

    console.log(`Proxying request to ESPN team schedule endpoint: ${espnUrl}`);

    const response = await fetch(espnUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`ESPN API returned status ${response.status} for ${espnUrl}`);
      return NextResponse.json(
        { error: `ESPN API returned status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error proxying ESPN team schedule request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team schedule from ESPN' },
      { status: 500 }
    );
  }
}
