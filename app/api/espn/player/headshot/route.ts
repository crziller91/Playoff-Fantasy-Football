import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/espn/player/headshot?playerName=Josh+Allen&teamName=Buffalo+Bills
 * Fetches player headshot from ESPN API by searching for the player
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const playerName = searchParams.get('playerName');
    const teamName = searchParams.get('teamName');

    if (!playerName) {
      return NextResponse.json(
        { error: 'Player name is required' },
        { status: 400 }
      );
    }

    console.log(`Fetching headshot for player: ${playerName}${teamName ? ` (${teamName})` : ''}`);

    // Step 1: Search for the player to get their ESPN ID using the existing search endpoint
    const searchUrl = `/api/espn/search?query=${encodeURIComponent(playerName)}`;

    console.log(`Searching ESPN via: ${searchUrl}`);

    const searchResponse = await fetch(`${request.nextUrl.origin}${searchUrl}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!searchResponse.ok) {
      console.error(`ESPN Search API error: ${searchResponse.status} ${searchResponse.statusText}`);
      return NextResponse.json(
        { error: `ESPN Search API returned ${searchResponse.status}`, status: searchResponse.status },
        { status: searchResponse.status }
      );
    }

    const searchData = await searchResponse.json();
    console.log('Search response received');

    // Find player results
    const playerResults = searchData.results?.find((r: any) => r.type === 'player');
    if (!playerResults || !playerResults.contents || playerResults.contents.length === 0) {
      console.warn(`No player results found for: ${playerName}`);
      return NextResponse.json(
        { error: 'Player not found', headshot: null },
        { status: 404 }
      );
    }

    const contents = playerResults.contents;
    const normalizedSearch = playerName.toLowerCase().trim();
    const normalizedTeam = teamName?.toLowerCase().trim();

    console.log(`Found ${contents.length} player results`);

    // Extract athlete ID from uid (format: s:20~l:28~a:3918298)
    const uidSeparator = '~a:';
    let athleteId: string | null = null;

    // If we have a team name, try to match with team first (most accurate)
    if (normalizedTeam) {
      for (const result of contents) {
        const displayName = (result.displayName || '').toLowerCase().trim();
        const subtitle = (result.subtitle || '').toLowerCase().trim();
        const description = (result.description || '').toLowerCase().trim();

        if (description === 'nfl' &&
            (displayName === normalizedSearch || displayName.includes(normalizedSearch)) &&
            subtitle.includes(normalizedTeam)) {
          athleteId = result.uid?.split(uidSeparator)[1];
          console.log(`Found match with team: ${result.displayName} - ${result.subtitle}`);
          break;
        }
      }
    }

    // If no team match, try exact name match
    if (!athleteId) {
      for (const result of contents) {
        const displayName = (result.displayName || '').toLowerCase().trim();
        const description = (result.description || '').toLowerCase().trim();

        if (displayName === normalizedSearch && description === 'nfl') {
          athleteId = result.uid?.split(uidSeparator)[1];
          console.log(`Found exact name match: ${result.displayName}`);
          break;
        }
      }
    }

    // If still no match, try partial match
    if (!athleteId) {
      for (const result of contents) {
        const displayName = (result.displayName || '').toLowerCase().trim();
        const description = (result.description || '').toLowerCase().trim();

        if (displayName.includes(normalizedSearch) && description === 'nfl') {
          athleteId = result.uid?.split(uidSeparator)[1];
          console.log(`Found partial match: ${result.displayName}`);
          break;
        }
      }
    }

    if (!athleteId) {
      console.warn(`Could not extract athlete ID for: ${playerName}`);
      return NextResponse.json(
        { error: 'Could not find player ID', headshot: null },
        { status: 404 }
      );
    }

    console.log(`Extracted athlete ID: ${athleteId}`);

    // Step 2: Fetch player overview to get headshot
    const playerUrl = `https://site.web.api.espn.com/apis/common/v3/sports/football/nfl/athletes/${athleteId}`;

    console.log(`Fetching player data: ${playerUrl}`);

    const playerResponse = await fetch(playerUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.espn.com/',
        'Origin': 'https://www.espn.com',
      },
    });

    if (!playerResponse.ok) {
      console.error(`ESPN Player API error: ${playerResponse.status} ${playerResponse.statusText}`);
      return NextResponse.json(
        { error: `ESPN Player API returned ${playerResponse.status}`, status: playerResponse.status },
        { status: playerResponse.status }
      );
    }

    const playerData = await playerResponse.json();

    // Extract headshot URL from the response
    // ESPN API can have headshot in different locations, so we check all possibilities
    const headshotUrl =
      playerData.athlete?.headshot?.href ||
      playerData.athlete?.headshot ||
      playerData.headshot?.href ||
      playerData.headshot ||
      null;

    if (!headshotUrl) {
      console.warn(`No headshot found for player: ${playerName} (ID: ${athleteId})`);
      return NextResponse.json(
        { headshot: null, message: 'No headshot available' },
        { status: 200 }
      );
    }

    console.log(`Successfully fetched headshot for ${playerName}`);

    return NextResponse.json({
      headshot: headshotUrl,
      athleteId: athleteId,
      playerName: playerData.athlete?.displayName || playerName
    });

  } catch (error) {
    console.error('Error fetching player headshot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player headshot', details: error instanceof Error ? error.message : 'Unknown error', headshot: null },
      { status: 500 }
    );
  }
}
