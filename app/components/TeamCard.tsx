import { Card, Button } from "flowbite-react";
import { TeamCardProps, ExtendedPlayer } from "../types";
import { getOrderedTeamPicks, getTeamScore } from "../utils/scoreCalculator";
import { HiX } from "react-icons/hi";

export default function TeamCard({
    team,
    draftPicks,
    playerScores,
    onEditScore,
    onTogglePlayerDisabled
}: TeamCardProps) {
    return (
        <Card className="w-full">
            <div className="mb-4 flex items-center justify-between">
                <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">
                    {team}
                </h5>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    Score: {getTeamScore(team, draftPicks, playerScores)}
                </div>
            </div>
            <div className="flow-root">
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                    {getOrderedTeamPicks(team, draftPicks).map(({ pick, player }) => {
                        const isDisabled = playerScores[player.name]?.isDisabled || false;
                        return (
                            <li key={pick} className="py-3 sm:py-4">
                                <div className="flex items-center space-x-4">
                                    <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                                        {player.position}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={`truncate text-sm font-medium ${isDisabled ? "text-gray-400" : "text-gray-900"} dark:text-white`}>
                                            {player.name}
                                            {isDisabled && " (Not Playing)"}
                                        </p>
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