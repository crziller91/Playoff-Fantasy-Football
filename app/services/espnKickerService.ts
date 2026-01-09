/**
 * ESPN Kicker Service
 * Fetches kicker statistics from ESPN's game summary API
 *
 * Data Flow:
 * 1. Take kicker name (e.g., "Chris Boswell")
 * 2. Search for the player to get their athlete ID and team ID
 * 3. Get the team's schedule to find the most recent completed game
 * 4. Fetch the game summary to extract:
 *    - PAT made/missed from box score statistics
 *    - Field goals made count from box score statistics
 *    - Individual field goal yardages from scoring plays
 * 5. Return stats to populate ScoreModal form fields
 */

interface KickerStats {
  pat?: number;
  fg?: number;
  fgYardages?: number[];
  fgMisses?: number;
}

/**
 * Helper function to find a stat value by name from stats array
 */
function findStatValue(stats: any[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const stat = stats.find((s: any) => {
      const statName = (s.name || '').toLowerCase();
      return statName === name.toLowerCase() || statName.includes(name.toLowerCase());
    });

    if (stat && stat.displayValue !== undefined) {
      const parsed = parseFloat(stat.displayValue);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return 0;
}

/**
 * Search for a player to get their athlete ID and team ID
 */
async function getPlayerInfo(playerName: string): Promise<{ athleteId: string; teamId: string } | null> {
  try {
    const searchUrl = `/api/espn/search?query=${encodeURIComponent(playerName)}`;
    console.log(`Searching for kicker: ${playerName}`);

    const response = await fetch(searchUrl);
    if (!response.ok) {
      console.warn(`Search API returned status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const playerResults = data.results?.find((r: any) => r.type === 'player');

    if (!playerResults || !playerResults.contents || playerResults.contents.length === 0) {
      console.warn(`No player results found for: ${playerName}`);
      return null;
    }

    // Find the first NFL player match
    const player = playerResults.contents.find((p: any) =>
      p.description?.toLowerCase() === 'nfl'
    );

    if (!player || !player.uid) {
      console.warn(`No NFL player found for: ${playerName}`);
      return null;
    }

    console.log(`Found player: ${player.displayName} - ${player.subtitle}`);
    console.log(`Full uid: ${player.uid}`);

    // Extract athlete ID from uid (format: s:20~l:28~a:3918298 or s:20~l:28~a:3918298~t:23)
    const athleteId = player.uid.split('~a:')[1]?.split('~')[0];
    let teamId = player.uid.split('~t:')[1]?.split('~')[0];

    if (!athleteId) {
      console.warn(`Could not extract athlete ID from uid: ${player.uid}`);
      return null;
    }

    // If team ID is not in uid, fetch it from the player endpoint
    if (!teamId) {
      console.log(`Team ID not in uid, fetching from player endpoint...`);
      teamId = await getTeamIdFromPlayerEndpoint(athleteId);
      if (!teamId) {
        console.warn(`Could not get team ID for athlete: ${athleteId}`);
        return null;
      }
    }

    console.log(`Extracted athlete ID: ${athleteId}, team ID: ${teamId}`);
    return { athleteId, teamId };
  } catch (error) {
    console.error('Error searching for player:', error);
    return null;
  }
}

/**
 * Fetch team ID from player endpoint
 */
async function getTeamIdFromPlayerEndpoint(athleteId: string): Promise<string | null> {
  try {
    const playerUrl = `/api/espn/player/${athleteId}?endpoint=player`;
    console.log(`Fetching player data from: ${playerUrl}`);

    const response = await fetch(playerUrl);
    if (!response.ok) {
      console.warn(`Player API returned status: ${response.status}`);
      return null;
    }

    const data = await response.json();

    // Team info is in data.athlete.team.id
    const teamId = data.athlete?.team?.id;

    if (teamId) {
      console.log(`Found team ID from player endpoint: ${teamId}`);
      return teamId.toString();
    }

    console.warn('No team ID found in player data');
    return null;
  } catch (error) {
    console.error('Error fetching team ID from player endpoint:', error);
    return null;
  }
}

/**
 * Get the most recent completed game for a team
 */
async function getMostRecentCompletedGame(teamId: string): Promise<string | null> {
  try {
    // Determine current NFL season (handles year-spanning seasons)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-11 (0 = January)

    // NFL season spans two years (e.g., 2025 season runs Sept 2025 - Feb 2026)
    // If we're in January or February, use the previous year as the season year
    const season = (currentMonth <= 1) ? currentYear - 1 : currentYear;

    const scheduleUrl = `/api/espn/teams/${teamId}/schedule?season=${season}`;
    console.log(`Fetching team schedule from: ${scheduleUrl}`);

    const response = await fetch(scheduleUrl);
    if (!response.ok) {
      console.warn(`Schedule API returned status: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const events = data.events || [];

    if (events.length === 0) {
      console.warn('No games found in schedule');
      return null;
    }

    // Filter for completed games (status.type.completed === true)
    const completedGames = events.filter((event: any) =>
      event.competitions?.[0]?.status?.type?.completed === true
    );

    if (completedGames.length === 0) {
      console.warn('No completed games found');
      return null;
    }

    // Sort by date descending to get most recent
    completedGames.sort((a: any, b: any) => {
      const dateA = new Date(a.date || a.competitions?.[0]?.date);
      const dateB = new Date(b.date || b.competitions?.[0]?.date);
      return dateB.getTime() - dateA.getTime();
    });

    const mostRecentGame = completedGames[0];
    const eventId = mostRecentGame.id;
    const gameDate = mostRecentGame.date || mostRecentGame.competitions?.[0]?.date;

    console.log(`Most recent completed game: ${eventId} on ${gameDate}`);
    return eventId;
  } catch (error) {
    console.error('Error fetching team schedule:', error);
    return null;
  }
}

/**
 * Extract kicker stats from game summary
 */
async function getGameKickerStats(eventId: string, athleteId: string, kickerName: string): Promise<KickerStats> {
  const stats: KickerStats = {
    pat: 0,
    fg: 0,
    fgYardages: [],
    fgMisses: 0
  };

  try {
    const summaryUrl = `/api/espn/game/${eventId}/summary`;
    console.log(`Fetching game summary from: ${summaryUrl}`);

    const response = await fetch(summaryUrl);
    if (!response.ok) {
      console.warn(`Game summary API returned status: ${response.status}`);
      return stats;
    }

    const data = await response.json();

    // Find the kicker in the box score
    const boxscore = data.boxscore;
    if (!boxscore || !boxscore.players) {
      console.warn('No boxscore or players found in game summary');
      return stats;
    }

    // Search through both teams
    let kickerStats = null;
    for (const team of boxscore.players) {
      // Look in the kicking statistics section
      const kickingSection = team.statistics?.find((section: any) =>
        section.name?.toLowerCase().includes('kicking')
      );

      if (kickingSection && kickingSection.athletes) {
        // Find our kicker by athlete ID or name
        const kicker = kickingSection.athletes.find((athlete: any) =>
          athlete.athlete?.id === athleteId ||
          athlete.athlete?.displayName?.toLowerCase().includes(kickerName.toLowerCase())
        );

        if (kicker) {
          kickerStats = kicker.stats || [];
          console.log(`Found kicker stats for ${kicker.athlete?.displayName}`);
          break;
        }
      }
    }

    if (!kickerStats || kickerStats.length === 0) {
      console.warn('Could not find kicker stats in boxscore');
      return stats;
    }

    // Parse stats from box score
    // Stats are typically in format: ["2/2", "100.0", "53", "2/2", "8"] for [FG, PCT, LONG, XP, PTS]
    // The keys array tells us what each stat represents
    const kickingSection = boxscore.players
      .flatMap((team: any) => team.statistics || [])
      .find((section: any) => section.name?.toLowerCase().includes('kicking'));

    const statKeys = kickingSection?.keys || [];
    const statLabels = kickingSection?.labels || [];

    console.log('Kicking stat keys:', statKeys);
    console.log('Kicking stat labels:', statLabels);
    console.log('Kicker stat values:', kickerStats);

    // Parse FG count (first stat in array)
    // Keys: "fieldGoalsMade/fieldGoalAttempts"
    const fgIndex = statKeys.findIndex((key: string) =>
      key.toLowerCase().includes('fieldgoalsmade') ||
      key.toLowerCase().includes('fieldgoalattempts')
    );

    if (fgIndex >= 0 && kickerStats[fgIndex]) {
      const fgValue = kickerStats[fgIndex].toString();
      if (fgValue.includes('/')) {
        // Format: "3/3" means 3 made out of 3 attempts
        stats.fg = parseInt(fgValue.split('/')[0]) || 0;
        const fgAttempts = parseInt(fgValue.split('/')[1]) || 0;
        const fgMissed = fgAttempts - (stats.fg || 0);
        stats.fgMisses = (stats.fgMisses || 0) + fgMissed;
      } else {
        stats.fg = parseInt(fgValue) || 0;
      }
      console.log(`FG: ${stats.fg}`);
    }

    // Parse PAT (Extra Points) - usually 4th stat in array
    // Keys: "extraPointsMade/extraPointAttempts"
    const xpIndex = statKeys.findIndex((key: string) =>
      key.toLowerCase().includes('extrapointsmade') ||
      key.toLowerCase().includes('extrapointattempts')
    );

    if (xpIndex >= 0 && kickerStats[xpIndex]) {
      const xpValue = kickerStats[xpIndex].toString();
      if (xpValue.includes('/')) {
        // Format: "2/2" means 2 made out of 2 attempts
        stats.pat = parseInt(xpValue.split('/')[0]) || 0;
        const xpAttempts = parseInt(xpValue.split('/')[1]) || 0;
        const xpMissed = xpAttempts - (stats.pat || 0);
        stats.fgMisses = (stats.fgMisses || 0) + xpMissed;
      } else {
        stats.pat = parseInt(xpValue) || 0;
      }
      console.log(`PAT: ${stats.pat}`);
    }

    // Now extract individual FG yardages from scoring plays
    const scoringPlays = data.scoringPlays || [];
    stats.fgYardages = [];

    for (const play of scoringPlays) {
      const text = play.text || '';

      // Look for field goal plays by this kicker
      // Format examples:
      // "C.Boswell 56 yard field goal is GOOD"
      // "C. Boswell 56 yard field goal is GOOD"
      // "Chris Boswell 56 yard field goal is GOOD"
      // "Chris Boswell 56 Yd Field Goal"

      const lastNameMatch = kickerName.split(' ').pop()?.toLowerCase();
      if (!lastNameMatch) continue;

      const textLower = text.toLowerCase();

      // Check if this is a field goal by our kicker
      if (textLower.includes(lastNameMatch) && textLower.includes('field goal')) {

        // Extract yardage using regex: look for number before "yard" or "yd"
        // Handles both "56 yard field goal" and "56 Yd Field Goal"
        const yardageMatch = text.match(/(\d+)\s*(?:yard|yd)s?\s+field\s+goal/i);
        if (yardageMatch) {
          const yardage = parseInt(yardageMatch[1]);
          if (!isNaN(yardage)) {
            stats.fgYardages.push(yardage);
            console.log(`Found FG: ${yardage} yards`);
          }
        }
      }
    }

    console.log(`Total FG yardages found: ${stats.fgYardages.length}`, stats.fgYardages);

    // Verify the count matches
    if (stats.fg && stats.fgYardages.length !== stats.fg) {
      console.warn(`FG count mismatch: boxscore says ${stats.fg}, but found ${stats.fgYardages.length} yardages`);
    }

  } catch (error) {
    console.error('Error fetching/parsing game kicker stats:', error);
  }

  return stats;
}

/**
 * Main function to fetch kicker stats
 */
export async function fetchKickerStats(kickerName: string): Promise<KickerStats | null> {
  try {
    console.log(`=== Fetching kicker stats for: ${kickerName} ===`);

    // 1. Search for the kicker to get athlete ID and team ID
    const playerInfo = await getPlayerInfo(kickerName);
    if (!playerInfo) {
      throw new Error(`Could not find kicker: ${kickerName}`);
    }

    const { athleteId, teamId } = playerInfo;

    // 2. Get the most recent completed game
    const eventId = await getMostRecentCompletedGame(teamId);
    if (!eventId) {
      throw new Error(`No recent completed game found for ${kickerName}. This may be due to the playoff schedule reset. Please enter scores manually.`);
    }

    // 3. Get kicker stats from the game
    const stats = await getGameKickerStats(eventId, athleteId, kickerName);

    console.log(`=== Final kicker stats for ${kickerName}:`, stats);
    return stats;
  } catch (error) {
    // Re-throw error without logging to avoid Next.js error overlay
    // The error will be caught and displayed as a toast in the UI
    throw error;
  }
}
