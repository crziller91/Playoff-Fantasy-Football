import { observer } from "mobx-react-lite";
import { Card, Button, Badge, Tooltip, Spinner } from "flowbite-react";
import { ExtendedPlayer } from "../../types";
import { getOrderedTeamPicks, getTeamScore } from "../../utils/scoreCalculator";
import { HiX, HiTrash, HiPencil, HiPlus, HiSparkles } from "react-icons/hi";
import { useStore } from "../../stores/StoreContext";

// Map position to badge color
const positionBadgeColors: Record<string, "info" | "gray" | "failure" | "success" | "warning" | "indigo" | "purple" | "pink"> = {
    QB: "success",
    RB: "purple",
    WR: "warning",
    TE: "failure",
    K: "info"
};

// Array of rank labels with medals
const rankLabels = ["🥇", "🥈", "🥉"];

interface TeamCardProps {
    team: string;
    playerScores: { [key: string]: ExtendedPlayer };
    onEditScore: (player: ExtendedPlayer) => void;
    onTogglePlayerDisabled: (player: ExtendedPlayer, isClearScores?: boolean) => void;
    onAutoFillScore?: (player: ExtendedPlayer) => void;
    autoFillLoadingPlayerId?: number | null;
    round?: string;
    ranking?: number;
    canEditScores: boolean;
}

const TeamCard = observer(({
    team,
    playerScores,
    onEditScore,
    onTogglePlayerDisabled,
    onAutoFillScore,
    autoFillLoadingPlayerId,
    round,
    ranking,
    canEditScores
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
                        const hasScore = playerData?.scoreData !== undefined;
                        const score = playerData?.score || 0;
                        const showScore = hasPositiveScore(player.name) && !isDisabled;
                        const showZeroScore = hasScore && score === 0 && !isDisabled;

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
                                        {/* For users with edit permissions, show score below player name/team */}
                                        {canEditScores && (
                                            <>
                                                {showScore && (
                                                    <p className="text-xs font-semibold text-green-600">
                                                        {playerScores[player.name]?.score} pts
                                                    </p>
                                                )}
                                                {showZeroScore && (
                                                    <p className="text-xs font-semibold text-green-600">
                                                        0 pts
                                                    </p>
                                                )}
                                                {isDisabled && (
                                                    <p className="text-xs font-semibold text-green-600">
                                                        0 pts
                                                    </p>
                                                )}
                                            </>
                                        )}
                                    </div>

                                    {/* For users WITHOUT edit permissions, show score to the right */}
                                    {!canEditScores && (showScore || showZeroScore || isDisabled) && (
                                        <Badge color="success" size="sm">
                                            {showScore && `${playerScores[player.name]?.score} pts`}
                                            {(showZeroScore || isDisabled) && "0 pts"}
                                        </Badge>
                                    )}

                                    {/* Only show controls if user has permission */}
                                    {canEditScores ? (
                                        <div className="flex space-x-2">
                                            {/* Auto-fill button - only show if no scores entered */}
                                            {onAutoFillScore && !playerScores[player.name]?.scoreData && (
                                                <Tooltip content="Auto-fill scores from ESPN" animation="duration-500" arrow={false}>
                                                    <Button
                                                        size="xs"
                                                        color="purple"
                                                        disabled={isDisabled || autoFillLoadingPlayerId !== null}
                                                        onClick={() => onAutoFillScore(player as ExtendedPlayer)}
                                                    >
                                                        {autoFillLoadingPlayerId === player.id ? (
                                                            <Spinner size="sm" light />
                                                        ) : (
                                                            <HiSparkles className="size-4" />
                                                        )}
                                                    </Button>
                                                </Tooltip>
                                            )}
                                            <Tooltip content={playerScores[player.name]?.scoreData ? "Edit player score" : "Add player score"} animation="duration-500" arrow={false}>
                                                <Button
                                                    size="xs"
                                                    color={playerScores[player.name]?.scoreData ? "success" : "info"}
                                                    disabled={isDisabled}
                                                    onClick={() => onEditScore(player as ExtendedPlayer)}
                                                >
                                                    {playerScores[player.name]?.scoreData ? <HiPencil className="size-4" /> : <HiPlus className="size-4" />}
                                                </Button>
                                            </Tooltip>
                                            {/* Show Clear Scores button if scores are entered */}
                                            {playerScores[player.name]?.scoreData && (
                                                <Tooltip content="Delete player scores" animation="duration-500" arrow={false}>
                                                    <Button
                                                        size="xs"
                                                        color="failure"
                                                        onClick={() => onTogglePlayerDisabled(player as ExtendedPlayer, true)}
                                                    >
                                                        <HiTrash className="size-4" />
                                                    </Button>
                                                </Tooltip>
                                            )}
                                            {/* Only show X button if no scores entered */}
                                            {!playerScores[player.name]?.scoreData && (
                                                <Tooltip content={isDisabled ? "Re-activate player" : "Deactivate player"} animation="duration-500" arrow={false}>
                                                    <Button
                                                        size="xs"
                                                        color={isDisabled ? "failure" : "light"}
                                                        onClick={() => onTogglePlayerDisabled(player as ExtendedPlayer)}
                                                    >
                                                        <HiX className="size-4" />
                                                    </Button>
                                                </Tooltip>
                                            )}
                                        </div>
                                    ) : (
                                        // Read-only indicator for users without edit permissions
                                        playerScores[player.name]?.isDisabled && (
                                            <Badge color="gray" size="xs">
                                                {statusReason === "eliminated" ? "Eliminated" : "Not Playing"}
                                            </Badge>
                                        )
                                    )}
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