import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/espn/player/[id]
 * Proxy endpoint to fetch ESPN player data and avoid CORS issues
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const searchParams = request.nextUrl.searchParams;
    const endpoint = searchParams.get('endpoint') || 'gamelog';

    console.log(`Fetching ESPN data for player ${id}, endpoint: ${endpoint}`);

    let espnUrl = '';
    const season = searchParams.get('season') || '2024'; // Default to 2024 season

    switch (endpoint) {
      case 'gamelog':
        // Athlete Gamelog - Player stats per game
        espnUrl = `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${id}/gamelog`;
        break;
      case 'eventlog':
        // Athlete Eventlog - Log of events/stats for a player in a season
        espnUrl = `https://sports.core.api.espn.com/v2/sports/football/leagues/nfl/seasons/${season}/athletes/${id}/eventlog`;
        break;
      case 'splits':
        // Athlete Splits - Player stats broken down by various conditions
        espnUrl = `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${id}/splits`;
        break;
      case 'player':
        // Player overview
        espnUrl = `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${id}`;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid endpoint parameter' },
          { status: 400 }
        );
    }

    console.log(`Fetching from ESPN: ${espnUrl}`);

    const response = await fetch(espnUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`ESPN API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `ESPN API returned ${response.status}`, status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`Successfully fetched data from ESPN`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching ESPN data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch ESPN data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
