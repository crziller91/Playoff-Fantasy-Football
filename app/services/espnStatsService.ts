/**
 * ESPN Stats Service
 * Fetches player statistics from ESPN's free API
 *
 * Data Flow:
 * 1. searchPlayerStats() - Main entry point, takes player name, position, and optional team name
 * 2. For players: findPlayerByName() - Searches ESPN API for player, extracts athlete ID from uid
 * 3. getPlayerStats() - Fetches gamelog data from ESPN using athlete ID
 * 4. parseGamelogStats() - Extracts most recent game stats from gamelog response
 * 5. parseStatsForPosition() - Maps ESPN stat names to our PlayerStats interface based on position
 * 6. Returns PlayerStats object to populate ScoreModal form fields
 */

import { fetchKickerStats } from './espnKickerService';

interface PlayerStats {
  touchdowns?: number;
  yards?: number;
  interceptions?: number;
  completions?: number;
  rushingTouchdowns?: number;
  rushingYards?: number;
  rushingAttempts?: number;
  receivingTouchdowns?: number;
  receivingYards?: number;
  receptions?: number;
  fumblesLost?: number;
  pat?: number;
  fgMisses?: number;
  fg?: number;
  fgYardages?: number[];
}

/**
 * Search for a player by name using ESPN's search endpoint
 * Returns the ESPN athlete ID
 */
async function findPlayerByName(playerName: string, teamName?: string): Promise<string | null> {
  try {
    const searchType = 'player';

    // Use our API route to avoid CORS issues
    const searchUrl = `/api/espn/search?query=${encodeURIComponent(playerName)}`;

    console.log(`Searching for ${searchType}: ${playerName}${teamName ? ` (${teamName})` : ''}`);
    console.log(`Search URL: ${searchUrl}`);

    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.warn(`Search API returned status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    console.log('Search response:', JSON.stringify(data, null, 2));

    // Navigate to the appropriate results (team or player)
    const searchResults = data.results?.find((r: any) => r.type === searchType);
    if (!searchResults || !searchResults.contents || searchResults.contents.length === 0) {
      console.warn(`No ${searchType} results found for: ${playerName}`);
      return null;
    }

    const contents = searchResults.contents;
    const normalizedSearch = playerName.toLowerCase().trim();
    const normalizedTeam = teamName?.toLowerCase().trim();

    console.log(`Found ${contents.length} ${searchType} results`);

    // Extract athlete ID from uid (format: s:20~l:28~a:3918298)
    const uidSeparator = '~a:';

    // If we have a team name, try to match with team first (most accurate)
    if (normalizedTeam) {
      for (const result of contents) {
        const displayName = (result.displayName || '').toLowerCase().trim();
        const subtitle = (result.subtitle || '').toLowerCase().trim(); // This is the team name
        const description = (result.description || '').toLowerCase().trim();

        // Match both name and team - must be NFL and team must match
        if (description === 'nfl' &&
            (displayName === normalizedSearch || displayName.includes(normalizedSearch)) &&
            subtitle.includes(normalizedTeam)) {
          console.log(`Found match with team: ${result.displayName} - ${result.subtitle}`);
          console.log(`Full uid: ${result.uid}`);
          // Extract ID from uid
          const id = result.uid?.split(uidSeparator)[1];
          if (id) {
            console.log(`Extracted athlete ID: ${id}`);
            return id;
          }
        }
      }
    }

    // If no team match or no team provided, try exact name match
    for (const result of contents) {
      const displayName = (result.displayName || '').toLowerCase().trim();
      const description = (result.description || '').toLowerCase().trim();

      if (displayName === normalizedSearch && description === 'nfl') {
        console.log(`Found exact name match: ${result.displayName} - ${result.subtitle}`);
        console.log(`Full uid: ${result.uid}`);
        const id = result.uid?.split(uidSeparator)[1];
        if (id) {
          console.log(`Extracted athlete ID: ${id}`);
          return id;
        }
      }
    }

    // Then try partial match
    for (const result of contents) {
      const displayName = (result.displayName || '').toLowerCase().trim();
      const description = (result.description || '').toLowerCase().trim();

      if (displayName.includes(normalizedSearch) && description === 'nfl') {
        console.log(`Found partial match: ${result.displayName} - ${result.subtitle}`);
        console.log(`Full uid: ${result.uid}`);
        const id = result.uid?.split(uidSeparator)[1];
        if (id) {
          console.log(`Extracted athlete ID: ${id}`);
          return id;
        }
      }
    }

    // If no good match, return the first NFL result as a fallback
    const firstNflResult = contents.find((r: any) => r.description?.toLowerCase() === 'nfl');
    if (firstNflResult) {
      console.log(`Using first NFL result as fallback: ${firstNflResult.displayName} - ${firstNflResult.subtitle}`);
      console.log(`Full uid: ${firstNflResult.uid}`);
      const id = firstNflResult.uid?.split(uidSeparator)[1];
      if (id) {
        console.log(`Extracted athlete ID: ${id}`);
        return id;
      }
    }

    console.warn(`No results found for: ${playerName}`);
    return null;
  } catch (error) {
    console.error('Error finding player by name:', error);
    return null;
  }
}

/**
 * Get the most recent completed or in-progress game event ID
 * Returns the event ID if found, null otherwise
 */
async function getMostRecentGameEventId(teamName: string): Promise<string | null> {
  try {
    // First, search for the team to get the team ID
    const searchUrl = `/api/espn/search?query=${encodeURIComponent(teamName)}&type=team`;
    console.log(`Searching for team: ${teamName}`);
    const searchResponse = await fetch(searchUrl);

    if (!searchResponse.ok) {
      console.warn('Failed to search for team');
      return null;
    }

    const searchData = await searchResponse.json();
    console.log('Team search response:', JSON.stringify(searchData, null, 2));

    const teamResults = searchData.results?.find((r: any) => r.type === 'team');

    if (!teamResults || !teamResults.contents || teamResults.contents.length === 0) {
      console.warn(`No team found for: ${teamName}`);
      console.warn('Available result types:', searchData.results?.map((r: any) => r.type));
      return null;
    }

    console.log('Team results:', JSON.stringify(teamResults.contents[0], null, 2));

    // Extract team ID from the first result
    const teamUid = teamResults.contents[0].uid;
    const teamId = teamUid?.split('~t:')[1];

    if (!teamId) {
      console.warn('Could not extract team ID from uid:', teamUid);
      return null;
    }

    console.log(`Found team ID: ${teamId} for ${teamName}`);

    // Fetch the team's schedule
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const season = (currentMonth <= 1) ? currentYear - 1 : currentYear;

    const scheduleUrl = `/api/espn/teams/${teamId}/schedule?season=${season}`;
    const scheduleResponse = await fetch(scheduleUrl);

    if (!scheduleResponse.ok) {
      console.warn('Failed to fetch team schedule');
      return null;
    }

    const scheduleData = await scheduleResponse.json();
    const events = scheduleData.events || [];

    console.log('=== SCHEDULE API RESPONSE ===');
    console.log(`Total events in schedule: ${events.length}`);
    if (events.length > 0) {
      console.log('Sample event structure:', JSON.stringify(events[0], null, 2));
      console.log('All event IDs and statuses:', events.map((e: any) => ({
        id: e.id,
        date: e.date || e.competitions?.[0]?.date,
        completed: e.competitions?.[0]?.status?.type?.completed,
        state: e.competitions?.[0]?.status?.type?.state,
        description: e.competitions?.[0]?.status?.type?.description
      })));
    }

    if (events.length === 0) {
      console.warn('No games found in schedule');
      return null;
    }

    // Filter for completed or in-progress games
    const eligibleGames = events.filter((event: any) => {
      const status = event.competitions?.[0]?.status?.type;
      return status?.completed === true || status?.state === 'in';
    });

    console.log(`Eligible games (completed or in-progress): ${eligibleGames.length}`);
    if (eligibleGames.length > 0) {
      console.log('Eligible game IDs:', eligibleGames.map((e: any) => e.id));
    }

    if (eligibleGames.length === 0) {
      console.warn('No completed or in-progress games found');
      return null;
    }

    // Sort by date descending to get most recent
    eligibleGames.sort((a: any, b: any) => {
      const dateA = new Date(a.date || a.competitions?.[0]?.date);
      const dateB = new Date(b.date || b.competitions?.[0]?.date);
      return dateB.getTime() - dateA.getTime();
    });

    const mostRecentGame = eligibleGames[0];
    const eventId = mostRecentGame.id;
    const gameDate = mostRecentGame.date || mostRecentGame.competitions?.[0]?.date;
    const gameStatus = mostRecentGame.competitions?.[0]?.status?.type;

    console.log(`Most recent eligible game: ${eventId} on ${gameDate} (completed: ${gameStatus?.completed}, state: ${gameStatus?.state})`);
    return eventId;
  } catch (error) {
    console.error('Error getting most recent game:', error);
    return null;
  }
}

/**
 * Fetch player stats from ESPN's API
 */
async function getPlayerStats(espnId: string, position: string, teamName?: string): Promise<PlayerStats | null> {
  try {
    // If we have a team name, try to get the most recent game event ID with status info
    let targetEventId: string | null = null;
    if (teamName) {
      targetEventId = await getMostRecentGameEventId(teamName);
      if (targetEventId) {
        console.log(`Target event ID from schedule: ${targetEventId}`);
      }
    }

    // Try postseason first (seasontype=3)
    console.log(`Trying to fetch postseason stats for player ${espnId}`);
    let gamelogUrl = `/api/espn/player/${espnId}?endpoint=gamelog&seasontype=3`;
    let response = await fetch(gamelogUrl);

    let data: any = null;
    let isPostseason = false;

    if (response.ok) {
      data = await response.json();
      // Check if there are any events in the postseason data
      const hasEvents = data?.seasonTypes?.[0]?.categories?.[0]?.events?.length > 0 ||
                       (data?.events && Object.keys(data.events).length > 0);

      if (hasEvents) {
        console.log('Found postseason stats');
        isPostseason = true;
      } else {
        console.log('No postseason games found, trying regular season');
        data = null;
      }
    }

    // If no postseason data, try regular season (seasontype=2)
    if (!data) {
      console.log(`Fetching regular season stats for player ${espnId}`);
      gamelogUrl = `/api/espn/player/${espnId}?endpoint=gamelog&seasontype=2`;
      response = await fetch(gamelogUrl);

      if (!response.ok) {
        console.warn(`Gamelog API returned status: ${response.status}`);
        // Try alternative endpoint
        return await getPlayerStatsAlternative(espnId, position);
      }

      data = await response.json();
    }

    console.log(`Using ${isPostseason ? 'postseason' : 'regular season'} data`);

    // Parse the most recent game stats, passing the target event ID if we have one
    return parseGamelogStats(data, position, isPostseason, targetEventId);
  } catch (error) {
    console.error('Error fetching player stats:', error);
    // Try alternative endpoint
    return await getPlayerStatsAlternative(espnId, position);
  }
}

/**
 * Alternative method to fetch stats using player card endpoint
 */
async function getPlayerStatsAlternative(espnId: string, position: string): Promise<PlayerStats | null> {
  try {
    // Use our API route to avoid CORS issues
    const playerUrl = `/api/espn/player/${espnId}?endpoint=player`;

    console.log(`Trying alternative endpoint: ${playerUrl}`);

    const response = await fetch(playerUrl);
    if (!response.ok) {
      throw new Error(`ESPN player API returned status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Player response structure:', JSON.stringify(data, null, 2));

    // Try to extract stats from player data
    return parsePlayerCardStats(data, position);
  } catch (error) {
    console.error('Error fetching from alternative endpoint:', error);
    return null;
  }
}

/**
 * Parse stats from gamelog endpoint
 */
function parseGamelogStats(data: any, position: string, isPostseason: boolean = false, targetEventId: string | null = null): PlayerStats {
  const stats: PlayerStats = {};

  try {
    // Get stat names and labels from the top level
    const names = data?.names || [];
    const labels = data?.labels || [];

    if (names.length === 0) {
      console.warn('No stat names found in gamelog');
      return stats;
    }

    console.log(`Parsing ${isPostseason ? 'postseason' : 'regular season'} gamelog data`);

    // Navigate to the actual game stats in seasonTypes
    const seasonTypes = data?.seasonTypes;
    if (!seasonTypes || !Array.isArray(seasonTypes) || seasonTypes.length === 0) {
      console.warn('No seasonTypes found in gamelog');
      return stats;
    }

    // Get the first season type (should be the one we requested)
    const currentSeason = seasonTypes[0];
    const categories = currentSeason?.categories;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      console.warn('No categories found in season data');
      return stats;
    }

    // Get the events from the first category
    const eventCategory = categories.find((cat: any) => cat.type === 'event');
    if (!eventCategory || !eventCategory.events || !Array.isArray(eventCategory.events) || eventCategory.events.length === 0) {
      console.warn('No events found in category');
      return stats;
    }

    console.log(`Found ${eventCategory.events.length} games in ${isPostseason ? 'postseason' : 'regular season'}`);

    // If we have a target event ID from the schedule (with status info), use that
    if (targetEventId) {
      console.log(`Looking for target event ID: ${targetEventId}`);
      const targetEvent = eventCategory.events.find((e: any) => e.eventId === targetEventId);

      if (targetEvent) {
        console.log(`Found target event in gamelog data: ${targetEventId}`);
        const gameStats = targetEvent?.stats || [];

        console.log('Stat names:', names.join(', '));
        console.log('Game stats values:', gameStats.join(', '));

        // Build stats list and return
        const statsList: any[] = [];
        names.forEach((name: string, index: number) => {
          statsList.push({
            name: name,
            abbreviation: labels[index],
            value: gameStats[index]
          });
        });

        return parseStatsForPosition(statsList, position);
      } else {
        console.warn(`Target event ${targetEventId} not found in gamelog, falling back to sorting`);
      }
    }

    // Fallback: Sort by event ID (higher = more recent)
    const sortedEvents = [...eventCategory.events].sort((a: any, b: any) => {
      return String(b.eventId).localeCompare(String(a.eventId));
    });

    console.log('Top 3 events by ID:', sortedEvents.slice(0, 3).map((e: any) => ({
      eventId: e.eventId
    })));

    const latestGameStats = sortedEvents[0];
    const gameStats = latestGameStats?.stats || [];

    console.log(`Using event ID: ${latestGameStats.eventId}`);
    console.log('Stat names:', names.join(', '));
    console.log('Game stats values:', gameStats.join(', '));

    // Build a list of stat objects that parseStatsForPosition can use
    const statsList: any[] = [];
    names.forEach((name: string, index: number) => {
      statsList.push({
        name: name,
        abbreviation: labels[index],
        value: gameStats[index]
      });
    });

    console.log(`Parsed ${statsList.length} stats for latest game`);

    // Use the existing parseStatsForPosition function with our stats list
    return parseStatsForPosition(statsList, position);
  } catch (error) {
    console.error('Error parsing gamelog stats:', error);
    return stats;
  }
}

/**
 * Parse stats from player card endpoint
 */
function parsePlayerCardStats(data: any, position: string): PlayerStats {
  const stats: PlayerStats = {};

  try {
    // Player card might have statistics in different locations
    const statistics = data?.statistics;
    console.log('Statistics found:', !!statistics);

    // This is a placeholder - we'll need to see the actual structure
    // to properly parse it
    return stats;
  } catch (error) {
    console.error('Error parsing player card stats:', error);
    return stats;
  }
}

/**
 * Parse ESPN stats data based on player position
 * Can accept either a stats list or the full data object
 */
function parseStatsForPosition(dataOrStatsList: any, position: string): PlayerStats {
  const stats: PlayerStats = {};

  try {
    let statsList: any[] = [];

    // Check if we received a stats list or full data object
    if (Array.isArray(dataOrStatsList)) {
      // Already a stats list
      statsList = dataOrStatsList;
      console.log(`Using provided stats list with ${statsList.length} items`);
    } else {
      // Full data object - extract stats
      const splits = dataOrStatsList?.splits?.categories;

      if (!splits || !Array.isArray(splits)) {
        console.warn('No stats categories found in ESPN response');
        return stats;
      }

      console.log(`Found ${splits.length} stat categories`);

      // Collect all stats from different categories
      for (const category of splits) {
        if (category.stats && Array.isArray(category.stats)) {
          console.log(`Category: ${category.name}, Stats count: ${category.stats.length}`);
          statsList = statsList.concat(category.stats);
        }
      }

      if (statsList.length === 0) {
        console.warn('No stats found in any category');
        return stats;
      }

      console.log(`Total stats collected: ${statsList.length}`);
    }

    console.log('Available stat names:', statsList.map(s => s.name || s.abbreviation).join(', '));

    // Parse based on position
    switch (position) {
      case 'QB':
        stats.touchdowns = findStat(statsList, ['passingTouchdowns', 'touchdowns', 'passTD', 'passTDs']);
        stats.yards = findStat(statsList, ['passingYards', 'passYds', 'yards', 'passYards']);
        stats.interceptions = findStat(statsList, ['interceptions', 'int', 'passInt', 'INTs']);
        stats.completions = findStat(statsList, ['completions', 'comp', 'passComp', 'completions/attempts']);
        stats.rushingTouchdowns = findStat(statsList, ['rushingTouchdowns', 'rushTD', 'rushTDs']);
        stats.rushingYards = findStat(statsList, ['rushingYards', 'rushYds', 'rushYards']);
        stats.rushingAttempts = findStat(statsList, ['rushingAttempts', 'rushAtt', 'attempts', 'att', 'carries']);
        break;

      case 'RB':
        stats.touchdowns = findStat(statsList, ['rushingTouchdowns', 'touchdowns', 'rushTD', 'rushTDs']);
        stats.rushingYards = findStat(statsList, ['rushingYards', 'rushYds', 'yards', 'rushYards']);
        stats.rushingAttempts = findStat(statsList, ['rushingAttempts', 'rushAtt', 'attempts', 'att', 'carries']);
        stats.receivingTouchdowns = findStat(statsList, ['receivingTouchdowns', 'recTD', 'recTDs']);
        stats.receivingYards = findStat(statsList, ['receivingYards', 'recYds', 'recYards']);
        stats.receptions = findStat(statsList, ['receptions', 'rec', 'catches']);
        stats.fumblesLost = findStat(statsList, ['fumblesLost', 'fumLost', 'FL']);
        break;

      case 'WR':
      case 'TE':
        stats.touchdowns = findStat(statsList, ['receivingTouchdowns', 'touchdowns', 'recTD', 'recTDs']);
        stats.receivingYards = findStat(statsList, ['receivingYards', 'recYds', 'yards', 'recYards']);
        stats.receptions = findStat(statsList, ['receptions', 'rec', 'catches']);
        stats.rushingTouchdowns = findStat(statsList, ['rushingTouchdowns', 'rushTD', 'rushTDs']);
        stats.rushingYards = findStat(statsList, ['rushingYards', 'rushYds', 'rushYards']);
        stats.rushingAttempts = findStat(statsList, ['rushingAttempts', 'rushAtt', 'attempts', 'att', 'carries']);
        stats.fumblesLost = findStat(statsList, ['fumblesLost', 'fumLost', 'FL']);
        break;

      case 'K':
        stats.pat = findStat(statsList, ['extraPointsMade', 'pat', 'xpm', 'XPMade', 'extraPoints']);
        stats.fg = findStat(statsList, ['fieldGoalsMade', 'fgm', 'FGMade', 'fieldGoals']);
        const fgMissed = findStat(statsList, ['fieldGoalsMissed', 'fgMiss']);
        const patMissed = findStat(statsList, ['extraPointsMissed', 'xpMiss']);
        stats.fgMisses = (fgMissed || 0) + (patMissed || 0);
        break;
    }

    console.log(`Parsed stats for ${position}:`, stats);
  } catch (error) {
    console.error('Error parsing stats:', error);
  }

  return stats;
}

/**
 * Helper function to find a stat by name from the stats array
 */
function findStat(statsList: any[], possibleNames: string[]): number | undefined {
  for (const name of possibleNames) {
    const stat = statsList.find((s: any) => {
      const statName = s.name?.toLowerCase() || '';
      const statAbbr = s.abbreviation?.toLowerCase() || '';
      const searchName = name.toLowerCase();

      return statName === searchName ||
             statAbbr === searchName ||
             statName.includes(searchName) ||
             statAbbr.includes(searchName);
    });

    if (stat && stat.value !== undefined && stat.value !== null) {
      const value = parseFloat(stat.value);
      if (!isNaN(value)) {
        console.log(`Found stat ${name}: ${value}`);
        return value;
      }
    }
  }

  return undefined;
}

/**
 * Main function to search for a player and fetch their stats
 * This is called when the user clicks "Auto-fill" in the score modal
 */
export async function searchPlayerStats(
  playerName: string,
  position: string,
  teamName?: string
): Promise<PlayerStats | null> {
  try {
    console.log(`=== Starting search for ${playerName} (${position})${teamName ? ` - ${teamName}` : ''} ===`);

    // For kicker positions, use the dedicated kicker service
    if (position === 'K') {
      console.log('Using kicker service for K position');
      return await fetchKickerStats(playerName);
    }

    // For players, use the standard search flow
    const espnId = await findPlayerByName(playerName, teamName);

    if (!espnId) {
      throw new Error(
        `Could not find player "${playerName}" in ESPN database. Please enter scores manually.`
      );
    }

    console.log(`Found ESPN ID: ${espnId} for ${playerName}`);

    // Then fetch their stats, passing the team name for schedule lookup
    const stats = await getPlayerStats(espnId, position, teamName);

    if (!stats || Object.keys(stats).length === 0) {
      throw new Error(
        `No recent game stats found for ${playerName}. This may be due to the playoff schedule reset. Please enter scores manually.`
      );
    }

    console.log(`=== Successfully fetched stats for ${playerName} ===`);
    return stats;
  } catch (error) {
    // Re-throw error without logging to avoid Next.js error overlay
    // The error will be caught and displayed as a toast in the UI
    throw error;
  }
}
