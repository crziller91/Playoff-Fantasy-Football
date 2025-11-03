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
 * Fetch player stats from ESPN's API
 */
async function getPlayerStats(espnId: string, position: string): Promise<PlayerStats | null> {
  try {
    // Use the gamelog endpoint - this has game-by-game stats
    // Use our API route to avoid CORS issues
    const gamelogUrl = `/api/espn/player/${espnId}?endpoint=gamelog`;

    console.log(`Fetching stats from: ${gamelogUrl}`);

    const response = await fetch(gamelogUrl);
    if (!response.ok) {
      console.warn(`Gamelog API returned status: ${response.status}`);
      // Try alternative endpoint
      return await getPlayerStatsAlternative(espnId, position);
    }

    const data = await response.json();
    console.log('Gamelog response structure:', JSON.stringify(data, null, 2));

    // Parse the most recent game stats
    return parseGamelogStats(data, position);
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
function parseGamelogStats(data: any, position: string): PlayerStats {
  const stats: PlayerStats = {};

  try {
    // Get stat names and labels from the top level
    const names = data?.names || [];
    const labels = data?.labels || [];

    if (names.length === 0) {
      console.warn('No stat names found in gamelog');
      return stats;
    }

    // Navigate to the actual game stats in seasonTypes
    const seasonTypes = data?.seasonTypes;
    if (!seasonTypes || !Array.isArray(seasonTypes) || seasonTypes.length === 0) {
      console.warn('No seasonTypes found in gamelog');
      return stats;
    }

    // Get the first season type (current season)
    const currentSeason = seasonTypes[0];
    const categories = currentSeason?.categories;

    if (!categories || !Array.isArray(categories) || categories.length === 0) {
      console.warn('No categories found in season data');
      return stats;
    }

    // Get the events from the first category (regular season stats)
    const eventCategory = categories.find((cat: any) => cat.type === 'event');
    if (!eventCategory || !eventCategory.events || eventCategory.events.length === 0) {
      console.warn('No events found in category');
      return stats;
    }

    // Get the most recent game (first in the array)
    const latestGameStats = eventCategory.events[0];
    const gameStats = latestGameStats?.stats || [];

    console.log(`Found ${eventCategory.events.length} games in current season`);
    console.log(`Latest game event ID: ${latestGameStats.eventId}`);
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
        `Could not find player "${playerName}" in ESPN database. ` +
        `Try using the exact name as shown on ESPN (e.g., "Josh Allen" not "J. Allen").`
      );
    }

    console.log(`Found ESPN ID: ${espnId} for ${playerName}`);

    // Then fetch their stats
    const stats = await getPlayerStats(espnId, position);

    if (!stats || Object.keys(stats).length === 0) {
      throw new Error(
        `No stats available for ${playerName}. ` +
        `They may not have played recently or stats may not be available yet.`
      );
    }

    console.log(`=== Successfully fetched stats for ${playerName} ===`);
    return stats;
  } catch (error) {
    console.error('Error in searchPlayerStats:', error);
    throw error;
  }
}
