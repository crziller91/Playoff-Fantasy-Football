import { NextRequest, NextResponse } from "next/server";

/**
 * API proxy for ESPN teams list endpoint
 * Returns list of all NFL teams with IDs and names
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const espnUrl = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams';

    console.log(`Proxying request to ESPN teams endpoint: ${espnUrl}`);

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
    console.error('Error proxying ESPN teams request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teams from ESPN' },
      { status: 500 }
    );
  }
}
