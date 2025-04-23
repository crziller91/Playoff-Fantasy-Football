// app/utils/teamUtils.ts
import { ExtendedPlayer } from "../types";

/**
 * Gets team picks in a specific order by position
 * @param team The team name
 * @param draftPicks The draft picks object containing all team picks
 * @returns Array of team picks sorted by position and pick number
 */
export const getOrderedTeamPicks = (team: string, draftPicks: any) => {
    const positionOrder = ["QB", "RB", "WR", "TE", "DST", "K"];

    const teamPicks = Object.entries(draftPicks[team] || {})
        .filter(([_, player]) => player !== null)
        .map(([pick, player]) => ({
            pick: Number(pick),
            player: player as ExtendedPlayer
        }));

    return teamPicks.sort((a, b) => {
        const posA = positionOrder.indexOf(a.player.position);
        const posB = positionOrder.indexOf(b.player.position);
        if (posA !== posB) return posA - posB;
        return a.pick - b.pick;
    });
};

/**
 * Calculate the score for a team in a specific round
 * @param team The team name
 * @param draftPicks The draft picks object
 * @param playerScores The player scores for the current round
 * @returns The total team score for the round
 */
export const calculateTeamRoundScore = (
    team: string,
    draftPicks: any,
    playerScores: { [key: string]: ExtendedPlayer }
): number => {
    let roundScore = 0;

    // Get team players for this round
    const teamPicks = getOrderedTeamPicks(team, draftPicks);

    // Add up scores for all players, skipping disabled ones
    teamPicks.forEach(({ player }) => {
        if (playerScores[player.name]?.isDisabled) return;
        roundScore += playerScores[player.name]?.score || 0;
    });

    return roundScore;
};