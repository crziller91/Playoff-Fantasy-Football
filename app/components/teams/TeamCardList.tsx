import React from "react";
import TeamCard from "./TeamCard";
import { Team, DraftPicks, ExtendedPlayer } from "../../types";
import { calculateTeamRoundScore } from "../../utils/teamUtils";

interface TeamCardListProps {
    teams: Team[];
    draftPicks: DraftPicks;
    round: string;
    playerScores: { [key: string]: ExtendedPlayer };
    onEditScore: (player: ExtendedPlayer) => void;
    onTogglePlayerDisabled: (player: ExtendedPlayer, isClearScores?: boolean) => void;
}

/**
 * Component to display a list of team cards sorted by score
 */
export default function TeamCardList({
    teams,
    draftPicks,
    round,
    playerScores,
    onEditScore,
    onTogglePlayerDisabled
}: TeamCardListProps) {
    // Get team scores for sorting
    const teamScores = teams.reduce((acc, team) => {
        const score = calculateTeamRoundScore(team, draftPicks, playerScores);
        return { ...acc, [team]: score };
    }, {} as Record<string, number>);

    // Sort teams by score (highest first)
    const sortedTeams = [...teams].sort((a, b) => teamScores[b] - teamScores[a]);

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sortedTeams.map((team) => (
                <TeamCard
                    key={`${team}-${round}`}
                    team={team}
                    draftPicks={draftPicks}
                    playerScores={playerScores}
                    onEditScore={onEditScore}
                    onTogglePlayerDisabled={onTogglePlayerDisabled}
                    round={round}
                />
            ))}
        </div>
    );
}