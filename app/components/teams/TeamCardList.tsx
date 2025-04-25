import { observer } from "mobx-react-lite";
import TeamCard from "./TeamCard";
import { ExtendedPlayer } from "../../types";
import { calculateTeamRoundScore } from "../../utils/teamUtils";
import { useStore } from "../../stores/StoreContext";

interface TeamCardListProps {
    round: string;
    onEditScore: (player: ExtendedPlayer) => void;
    onTogglePlayerDisabled: (player: ExtendedPlayer, isClearScores?: boolean) => void;
}

const TeamCardList = observer(({
    round,
    onEditScore,
    onTogglePlayerDisabled
}: TeamCardListProps) => {
    const { teamsStore, playersStore, scoresStore } = useStore();
    const { teams } = teamsStore;
    const { draftPicks } = playersStore;
    const playerScores = scoresStore.playerScores[round] || {};

    // Get team scores for sorting
    const teamScores = teams.reduce((acc, team) => {
        const score = calculateTeamRoundScore(team, draftPicks, playerScores);
        return { ...acc, [team]: score };
    }, {} as Record<string, number>);

    // Sort teams by score (highest first)
    const sortedTeams = [...teams].sort((a, b) => teamScores[b] - teamScores[a]);

    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {sortedTeams.map((team, index) => (
                <TeamCard
                    key={`${team}-${round}`}
                    team={team}
                    playerScores={playerScores}
                    onEditScore={onEditScore}
                    onTogglePlayerDisabled={onTogglePlayerDisabled}
                    round={round}
                    ranking={index} // Pass the ranking to display medals
                />
            ))}
        </div>
    );
});

export default TeamCardList;