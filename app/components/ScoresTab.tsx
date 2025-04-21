import { Card } from "flowbite-react";
import { DraftPicks, Team, PlayerScoresByRound, Player, ExtendedPlayer } from "../types";
import { PLAYOFF_ROUNDS } from "./TeamsView";
import { useEffect, useState } from "react";
import { fetchPlayerScores } from "../services/scoreService";

interface ScoresTabProps {
  teams: Team[];
  draftPicks: DraftPicks;
  playerScores: PlayerScoresByRound;
}

export default function ScoresTab({ teams, draftPicks, playerScores }: ScoresTabProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [localPlayerScores, setLocalPlayerScores] = useState<PlayerScoresByRound>({
    "Wild Card": {},
    "Divisional": {},
    "Conference": {},
    "Superbowl": {}
  });

  // Use prop playerScores if provided, otherwise use local state
  const activeScores = Object.keys(playerScores).length > 0 ? playerScores : localPlayerScores;

  // Load player scores from database if not provided via props
  useEffect(() => {
    // If scores are already provided via props, don't fetch again
    if (Object.keys(playerScores).length > 0) {
      setIsLoading(false);
      return;
    }

    const loadScores = async () => {
      try {
        setIsLoading(true);
        const scores = await fetchPlayerScores();
        if (scores && Object.keys(scores).length > 0) {
          setLocalPlayerScores(scores);
        }
      } catch (error) {
        console.error("Error loading scores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScores();
  }, [playerScores]);

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
          if (activeScores[round]?.[player.name]?.isDisabled) return;
          // Add player's score for this round (or 0 if not played)
          totalScore += activeScores[round]?.[player.name]?.score || 0;
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
      if (activeScores[round]?.[player.name]?.isDisabled) return;
      // Add player's score for this round
      roundScore += activeScores[round]?.[player.name]?.score || 0;
    });

    return roundScore;
  };

  const overallScores = calculateOverallTeamScores();

  // Sort teams by overall score (highest first)
  const sortedTeams = [...teams].sort(
    (a, b) => (overallScores[b] || 0) - (overallScores[a] || 0)
  );

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-gray-500">
        Loading scores...
      </div>
    );
  }

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