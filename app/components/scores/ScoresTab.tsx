import { observer } from "mobx-react-lite";
import { Card, Badge } from "flowbite-react";
import { PLAYOFF_ROUNDS } from "../../constants/playoffs";
import { getOrderedTeamPicks } from "../../utils/teamUtils";
import { useStore } from "../../stores/StoreContext";

// Map position to badge color (same as TeamCard)
const positionBadgeColors: Record<string, "info" | "gray" | "failure" | "success" | "warning" | "indigo" | "purple" | "pink"> = {
  QB: "success",
  RB: "purple",
  WR: "warning",
  TE: "failure",
  K: "info"
};

const ScoresTab = observer(() => {
  const { teamsStore, playersStore, scoresStore } = useStore();
  const { teams } = teamsStore;
  const { draftPicks } = playersStore;
  const { playerScores, isLoading } = scoresStore;

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

  const overallScores = calculateOverallTeamScores();

  // Sort teams by overall score (highest first)
  const sortedTeams = [...teams].sort(
    (a, b) => (overallScores[b] || 0) - (overallScores[a] || 0)
  );

  // Get remaining (active) players for a team - players not eliminated
  const getRemainingPlayers = (team: string) => {
    const teamPlayers = getOrderedTeamPicks(team, draftPicks);

    // Find players that are still active (not eliminated in any round)
    return teamPlayers.filter(({ player }) => {
      // Check if player has been eliminated in any round
      for (const round of PLAYOFF_ROUNDS) {
        const playerData = playerScores[round]?.[player.name];
        if (playerData?.isDisabled && playerData?.statusReason === "eliminated") {
          return false;
        }
      }
      return true;
    }).map(({ player }) => player);
  };

  if (isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-gray-500">
        Loading scores...
      </div>
    );
  }

  // Render team card with consistent styling
  const renderTeamCard = (team: string, index: number) => (
    <Card key={`overall-${team}`} className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">
            {team}
          </h5>
          <span className="text-sm text-gray-500">
            {index === 0 ? "🥇 First Place" :
              index === 1 ? "🥈 Second Place" :
                index === 2 ? "🥉 Third Place" :
                  `${index + 1}th Place`}
          </span>
        </div>
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
              className="flex items-center justify-between"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300">{round}:</span>
              <span className="text-sm font-semibold dark:text-white">
                {roundScore} pts
              </span>
            </div>
          );
        })}
      </div>

      {/* Remaining Players */}
      <div className="mt-4 border-t border-gray-200 pt-3 dark:border-gray-700">
        <span className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
          Remaining Players
        </span>
        <div className="flex flex-wrap gap-1.5">
          {getRemainingPlayers(team).map((player) => (
            <Badge
              key={player.id}
              color={positionBadgeColors[player.position] || "gray"}
              size="xs"
            >
              {player.name}
            </Badge>
          ))}
          {getRemainingPlayers(team).length === 0 && (
            <span className="text-xs text-gray-400">No players remaining</span>
          )}
        </div>
      </div>
    </Card>
  );

  // Get the teams split out for the layout
  const firstPlace = sortedTeams[0];
  const secondPlace = sortedTeams[1];
  const thirdPlace = sortedTeams[2];
  const remainingTeams = sortedTeams.slice(3);

  return (
    <div className="mt-4">
      <h2 className="mb-4 text-center text-xl font-bold">Overall Standings</h2>

      {/* First place - centered at top */}
      <div className="mb-4 flex justify-center">
        <div className="w-full max-w-md">
          {renderTeamCard(firstPlace, 0)}
        </div>
      </div>

      {/* Second and Third place - side by side */}
      {(secondPlace || thirdPlace) && (
        <div className="mb-4 flex flex-col gap-4 md:flex-row md:justify-center">
          {secondPlace && (
            <div className="mx-auto w-full max-w-md md:mx-4">
              {renderTeamCard(secondPlace, 1)}
            </div>
          )}
          {thirdPlace && (
            <div className="mx-auto w-full max-w-md md:mx-4">
              {renderTeamCard(thirdPlace, 2)}
            </div>
          )}
        </div>
      )}

      {/* Fourth place and below - stacked */}
      {remainingTeams.length > 0 && (
        <div className="flex justify-center">
          <div className="w-full max-w-md space-y-4">
            {remainingTeams.map((team, idx) =>
              renderTeamCard(team, idx + 3)
            )}
          </div>
        </div>
      )}
    </div>
  );
});

export default ScoresTab;