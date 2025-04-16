import { Card } from "flowbite-react";
import { DraftPicks, Team, PlayerScoresByRound, Player, ExtendedPlayer } from "../types";
import { PLAYOFF_ROUNDS } from "./TeamsView";

interface ScoresTabProps {
  teams: Team[];
  draftPicks: DraftPicks;
  playerScores: PlayerScoresByRound;
}

export default function ScoresTab({ teams, draftPicks, playerScores }: ScoresTabProps) {
  // Function to get ordered team picks
  const getOrderedTeamPicks = (team: string, draftPicks: any) => {
    const positionOrder = ["QB", "RB", "WR", "TE", "DST", "K"];
    const teamPicks = Object.entries(draftPicks[team] || {})
      .filter(([_, player]) => player !== null)
      .map(([pick, player]) => ({ 
        pick: Number(pick), 
        player: player as Player 
      }));

    return teamPicks.sort((a, b) => {
      const posA = positionOrder.indexOf(a.player.position);
      const posB = positionOrder.indexOf(b.player.position);
      if (posA !== posB) return posA - posB;
      return a.pick - b.pick;
    });
  };

  // Calculate overall team scores across all rounds
  const calculateOverallTeamScores = () => {
    const overallScores: { [team: string]: number } = {};

    teams.forEach((team) => {
      let totalScore = 0;

      // Sum up scores from all rounds
      PLAYOFF_ROUNDS.forEach((round) => {
        const teamPlayers = getOrderedTeamPicks(team, draftPicks);
        teamPlayers.forEach(({ player }) => {
          // Skip disabled players
          if (playerScores[round]?.[player.name]?.isDisabled) return;
          // Add player's score for this round (or 0 if not played)
          totalScore += playerScores[round]?.[player.name]?.score || 0;
        });
      });

      overallScores[team] = totalScore;
    });

    return overallScores;
  };

  // Calculate round scores for a team
  const calculateRoundScore = (team: string, round: string) => {
    let roundScore = 0;
    const teamPlayers = getOrderedTeamPicks(team, draftPicks);

    teamPlayers.forEach(({ player }) => {
      // Skip disabled players
      if (playerScores[round]?.[player.name]?.isDisabled) return;
      // Add player's score for this round
      roundScore += playerScores[round]?.[player.name]?.score || 0;
    });

    return roundScore;
  };

  const overallScores = calculateOverallTeamScores();
  
  // Sort teams by overall score (highest first)
  const sortedTeams = [...teams].sort(
    (a, b) => (overallScores[b] || 0) - (overallScores[a] || 0)
  );

  return (
    <div className="mt-4">
      <h2 className="mb-4 text-xl font-bold text-center">Overall Standings</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sortedTeams.map((team) => (
          <Card key={`overall-${team}`} className="w-full">
            <div className="mb-4 flex items-center justify-between">
              <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">
                {team}
              </h5>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {overallScores[team] || 0} pts
              </div>
            </div>

            {/* Round-by-round breakdown */}
            <div className="space-y-2">
              {PLAYOFF_ROUNDS.map((round) => {
                const roundScore = calculateRoundScore(team, round);
                return (
                  <div
                    key={`${team}-${round}`}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-700">{round}:</span>
                    <span className="text-sm font-semibold">
                      {roundScore} pts
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}