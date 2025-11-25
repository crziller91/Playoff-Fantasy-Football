import { NextRequest, NextResponse } from "next/server";

/**
 * API proxy for ESPN team endpoints
 * This route acts as a proxy to avoid CORS issues when calling ESPN's API from the browser
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'statistics';

    let espnUrl: string;

    // Route to different ESPN endpoints based on the endpoint parameter
    switch (endpoint) {
      case 'statistics':
        // Team statistics endpoint - includes defensive stats
        espnUrl = `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/teams/${id}/statistics`;
        break;

      case 'roster':
        // Team roster endpoint
        espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${id}/roster`;
        break;

      case 'team':
        // Team info endpoint
        espnUrl = `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/${id}`;
        break;

      default:
        return NextResponse.json(
          { error: `Unknown endpoint: ${endpoint}` },
          { status: 400 }
        );
    }

    console.log(`Proxying request to ESPN team endpoint: ${espnUrl}`);

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
    console.error('Error proxying ESPN team request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team data from ESPN' },
      { status: 500 }
    );
  }
}
