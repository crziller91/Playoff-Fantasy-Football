import { NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

/**
 * GET /api/espn/search
 * Proxy endpoint to search for players on ESPN and avoid CORS issues
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');

    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter is required' },
        { status: 400 }
      );
    }

    console.log(`Searching ESPN for: ${query}`);

    const espnUrl = `https://site.api.espn.com/apis/search/v2?query=${encodeURIComponent(query)}&limit=10&lang=en&region=us&type=player&sport=football&league=nfl`;

    console.log(`Fetching from ESPN: ${espnUrl}`);

    const response = await fetch(espnUrl, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`ESPN search API error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `ESPN API returned ${response.status}`, status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`Successfully fetched search results from ESPN`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error searching ESPN:', error);
    return NextResponse.json(
      { error: 'Failed to search ESPN', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
