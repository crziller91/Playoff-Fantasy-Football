import { observer } from "mobx-react-lite";
import { Card, Button, Badge, Spinner } from "flowbite-react";
import { ExtendedPlayer } from "../../types";
import { getOrderedTeamPicks, getTeamScore } from "../../utils/scoreCalculator";
import { HiX, HiTrash, HiPlus, HiSparkles, HiRefresh } from "react-icons/hi";
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
    onQBSwap?: (player: ExtendedPlayer) => void;
    autoFillLoadingPlayerId?: number | null;
    round?: string;
    ranking?: number;
    canEditScores: boolean;
    onViewStats?: (player: ExtendedPlayer) => void;
}

const TeamCard = observer(({
    team,
    playerScores,
    onEditScore,
    onTogglePlayerDisabled,
    onAutoFillScore,
    onQBSwap,
    autoFillLoadingPlayerId,
    round,
    ranking,
    canEditScores,
    onViewStats
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

                        // Get backup QB info if available
                        const backupPlayerName = playerData?.backupPlayerName;
                        const hasBackupQB = player.position === "QB" && backupPlayerName;

                        // Determine status message based on the status reason
                        let statusMessage = "";
                        if (isDisabled) {
                            if (round === "Wild Card") {
                                statusMessage = " (Bye Week/Not Playing)";
                            } else if (statusReason === "eliminated") {
                                statusMessage = " (Eliminated)";
                            } else if (statusReason === "injured" && hasBackupQB) {
                                statusMessage = " (Injured)";
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
                                        {hasBackupQB ? (
                                            <>
                                                <p className={`truncate text-sm font-medium ${isDisabled ? "text-gray-400" : "text-gray-900"} dark:text-white`}>
                                                    {backupPlayerName}
                                                    <span className="ml-1 text-xs text-blue-500">(Backup)</span>
                                                </p>
                                                <p className="truncate text-xs text-gray-400">
                                                    {player.name}{isDisabled ? statusMessage : " (Starter)"}
                                                </p>
                                            </>
                                        ) : (
                                            <p className={`truncate text-sm font-medium ${isDisabled ? "text-gray-400" : "text-gray-900"} dark:text-white`}>
                                                {player.name}
                                                {isDisabled && statusMessage}
                                            </p>
                                        )}
                                        {player.teamName && (
                                            <p className="text-xs text-gray-500">
                                                {player.teamName}
                                            </p>
                                        )}
                                    </div>

                                    {/* For users WITHOUT edit permissions, show score to the right */}
                                    {!canEditScores && (showScore || showZeroScore || isDisabled) && (
                                        <>
                                            {/* Show view stats button if player has scores */}
                                            {(showScore || showZeroScore) && onViewStats && (
                                                <Button
                                                    size="xs"
                                                    color="success"
                                                    onClick={() => {
                                                        console.log('Button clicked for player:', player);
                                                        onViewStats(playerScores[player.name]);
                                                    }}
                                                >
                                                    {playerScores[player.name]?.score || 0} pts
                                                </Button>
                                            )}
                                            {/* Show badge for disabled players */}
                                            {isDisabled && (
                                                <Badge color="gray" size="sm">
                                                    {statusReason === "eliminated" ? "Eliminated" : "Not Playing"}
                                                </Badge>
                                            )}
                                        </>
                                    )}

                                    {/* Only show controls if user has permission */}
                                    {canEditScores ? (
                                        <div className="flex space-x-2">
                                            {/* QB Swap button - only show for QBs */}
                                            {onQBSwap && player.position === "QB" && !isDisabled && (
                                                <Button
                                                    size="xs"
                                                    color="blue"
                                                    onClick={() => onQBSwap(player as ExtendedPlayer)}
                                                    title="Swap QB"
                                                >
                                                    <HiRefresh className="size-4" />
                                                </Button>
                                            )}
                                            {/* Auto-fill button - only show if no scores entered and player is not disabled */}
                                            {onAutoFillScore && !playerScores[player.name]?.scoreData && !isDisabled && (
                                                <Button
                                                    size="xs"
                                                    color="purple"
                                                    disabled={autoFillLoadingPlayerId !== null}
                                                    onClick={() => onAutoFillScore(player as ExtendedPlayer)}
                                                >
                                                    {autoFillLoadingPlayerId === player.id ? (
                                                        <Spinner size="sm" light />
                                                    ) : (
                                                        <HiSparkles className="size-4" />
                                                    )}
                                                </Button>
                                            )}
                                            {/* Add/Edit score button - only show if player is not disabled */}
                                            {!isDisabled && (
                                                <Button
                                                    size="xs"
                                                    color={playerScores[player.name]?.scoreData ? "success" : "info"}
                                                    onClick={() => onEditScore(player as ExtendedPlayer)}
                                                >
                                                    {playerScores[player.name]?.scoreData ? `${playerScores[player.name]?.score || 0} pts` : <HiPlus className="size-4" />}
                                                </Button>
                                            )}
                                            {/* Show Clear Scores button if scores are entered */}
                                            {playerScores[player.name]?.scoreData && (
                                                <Button
                                                    size="xs"
                                                    color="failure"
                                                    onClick={() => onTogglePlayerDisabled(player as ExtendedPlayer, true)}
                                                >
                                                    <HiTrash className="size-4" />
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
                                    ) : null}
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