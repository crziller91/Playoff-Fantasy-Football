import { observer } from "mobx-react-lite";
import { Card, Button, Badge } from "flowbite-react";
import { ExtendedPlayer } from "../../types";
import { getOrderedTeamPicks, getTeamScore } from "../../utils/scoreCalculator";
import { HiX } from "react-icons/hi";
import { positionColors } from "../../data/positionColors";
import { useStore } from "../../stores/StoreContext";

// Map position to badge color
const positionBadgeColors: Record<string, "info" | "gray" | "failure" | "success" | "warning" | "indigo" | "purple" | "pink"> = {
    QB: "success",
    RB: "purple",
    WR: "warning",
    TE: "failure",
    K: "info",
    DST: "gray"
};

// Array of rank labels with medals
const rankLabels = ["🥇", "🥈", "🥉"];

interface TeamCardProps {
    team: string;
    playerScores: { [key: string]: ExtendedPlayer };
    onEditScore: (player: ExtendedPlayer) => void;
    onTogglePlayerDisabled: (player: ExtendedPlayer, isClearScores?: boolean) => void;
    round?: string;
    ranking?: number;
}

const TeamCard = observer(({
    team,
    playerScores,
    onEditScore,
    onTogglePlayerDisabled,
    round,
    ranking
}: TeamCardProps) => {
    const { playersStore } = useStore();
    const { draftPicks } = playersStore;

    // Helper function to safely check if a player's score is greater than 0
    const hasPositiveScore = (playerName: string): boolean => {
        if (!playerScores || !playerScores[playerName]) return false;

        const score = playerScores[playerName].score;
        return typeof score === 'number' && score > 0;
    };

    return (
        <Card className="w-full">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">
                        {team}
                        {ranking !== undefined && ranking < 3 && (
                            <span>
                                {rankLabels[ranking]}
                            </span>
                        )}
                    </h5>
                </div>
                <Badge size="lg" color="gray">{getTeamScore(team, draftPicks, playerScores)} pts</Badge>
            </div>
            <div className="flow-root">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {getOrderedTeamPicks(team, draftPicks).map(({ pick, player }) => {
                        const playerData = playerScores[player.name];
                        const isDisabled = playerData?.isDisabled || false;
                        const statusReason = playerData?.statusReason;
                        const showScore = hasPositiveScore(player.name) && !isDisabled;

                        // Determine status message based on the status reason
                        let statusMessage = "";
                        if (isDisabled) {
                            if (round === "Wild Card") {
                                statusMessage = " (Bye Week/Not Playing)";
                            } else if (statusReason === "eliminated") {
                                statusMessage = " (Eliminated)";
                            } else {
                                statusMessage = " (Inactive/Injured)";
                            }
                        }

                        // Get the badge color based on position
                        const badgeColor = positionBadgeColors[player.position];

                        return (
                            <li key={pick} className="py-3 sm:py-4">
                                <div className="flex items-center space-x-4">
                                    {/* Position Badge */}
                                    <Badge
                                        color={badgeColor}
                                        size="sm"
                                        className={isDisabled ? "opacity-50" : ""}
                                    >
                                        {player.position}
                                    </Badge>
                                    <div className="min-w-0 flex-1">
                                        <p className={`truncate text-sm font-medium ${isDisabled ? "text-gray-400" : "text-gray-900"} dark:text-white`}>
                                            {player.name}
                                            {isDisabled && statusMessage}
                                        </p>
                                        {player.teamName && (
                                            <p className="text-xs text-gray-500">
                                                {player.teamName}
                                            </p>
                                        )}
                                        {showScore && (
                                            <p className="text-xs font-semibold text-green-600">
                                                {playerScores[player.name]?.score} pts
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            size="xs"
                                            color={playerScores[player.name]?.scoreData ? "success" : "info"}
                                            disabled={isDisabled}
                                            onClick={() => onEditScore(player as ExtendedPlayer)}
                                        >
                                            {playerScores[player.name]?.scoreData ? "Edit Scores" : "Enter Scores"}
                                        </Button>
                                        {/* Show Clear Scores button if scores are entered */}
                                        {playerScores[player.name]?.scoreData && (
                                            <Button
                                                size="xs"
                                                color="failure"
                                                onClick={() => onTogglePlayerDisabled(player as ExtendedPlayer, true)}
                                            >
                                                Clear Scores
                                            </Button>
                                        )}
                                        {/* Only show X button if no scores entered */}
                                        {!playerScores[player.name]?.scoreData && (
                                            <Button
                                                size="xs"
                                                color={isDisabled ? "failure" : "light"}
                                                onClick={() => onTogglePlayerDisabled(player as ExtendedPlayer)}
                                            >
                                                <HiX className="size-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </Card>
    );
});

export default TeamCard;