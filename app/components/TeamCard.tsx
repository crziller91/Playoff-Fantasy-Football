import { Card, Button } from "flowbite-react";
import { TeamCardProps, ExtendedPlayer } from "../types";
import { getOrderedTeamPicks, getTeamScore } from "../utils/scoreCalculator";

export default function TeamCard({
    team,
    draftPicks,
    playerScores,
    onEditScore
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
                    {getOrderedTeamPicks(team, draftPicks).map(({ pick, player }) => (
                        <li key={pick} className="py-3 sm:py-4">
                            <div className="flex items-center space-x-4">
                                <div className="inline-flex items-center text-base font-semibold text-gray-900 dark:text-white">
                                    {player.position}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                                        {player.name}
                                    </p>
                                </div>
                                <Button
                                    size="xs"
                                    color={playerScores[player.name]?.scoreData ? "success" : "blue"}
                                    onClick={() => onEditScore(player as ExtendedPlayer)}
                                >
                                    {playerScores[player.name]?.scoreData ? "Edit Scores" : "Enter Scores"}
                                </Button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </Card>
    );
}