import { Card, Button, Badge } from "flowbite-react"; // Added Badge import
import { TeamCardProps, ExtendedPlayer } from "../types";
import { getOrderedTeamPicks, getTeamScore } from "../utils/scoreCalculator";
import { HiX } from "react-icons/hi";
import { positionColors } from "../data/positionColors";

// Map position to badge color
const positionBadgeColors: Record<string, "info" | "gray" | "failure" | "success" | "warning" | "indigo" | "purple" | "pink"> = {
    QB: "success",    // Green
    RB: "purple",     // Purple
    WR: "warning",    // Yellow
    TE: "failure",    // Red
    K: "info",        // Blue
    DST: "gray"       // Dark
};

export default function TeamCard({
    team,
    draftPicks,
    playerScores,
    onEditScore,
    onTogglePlayerDisabled,
    round // Optional prop to display which round we're showing
}: TeamCardProps & { round?: string }) {
    return (
        <Card className="w-full">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">
                        {team}
                    </h5>
                    {round && (
                        <span className="text-sm text-gray-500">
                            {round} Round
                        </span>
                    )}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    Score: {getTeamScore(team, draftPicks, playerScores)}
                </div>
            </div>
            <div className="flow-root">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {getOrderedTeamPicks(team, draftPicks).map(({ pick, player }) => {
                        const playerData = playerScores[player.name];
                        const isDisabled = playerData?.isDisabled || false;
                        const statusReason = playerData?.statusReason;

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
                                        {playerScores[player.name]?.score !== undefined && !isDisabled && (
                                            <p className="text-xs text-green-600 font-semibold">
                                                {playerScores[player.name]?.score} pts
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex space-x-2">
                                        <Button
                                            size="xs"
                                            color={playerScores[player.name]?.scoreData ? "success" : "blue"}
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
                                                <HiX className="h-4 w-4" />
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
}