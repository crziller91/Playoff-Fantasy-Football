import { NextRequest, NextResponse } from "next/server";

/**
 * API proxy for ESPN game summary endpoint
 * Returns detailed game information including box score and stats
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { id } = params;

    const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/summary?event=${id}`;

    console.log(`Proxying request to ESPN game summary endpoint: ${espnUrl}`);

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
    console.error('Error proxying ESPN game summary request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game summary from ESPN' },
      { status: 500 }
    );
  }
}
