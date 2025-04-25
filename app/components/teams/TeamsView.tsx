import { observer } from "mobx-react-lite";
import { Tabs, type TabsRef } from "flowbite-react";
import { useEffect, useRef, useMemo } from "react";
import { useStore } from "../../stores/StoreContext";
import { PLAYOFF_ROUNDS } from "../../constants/playoffs";
import { usePlayerModals } from "../../hooks/usePlayerModals";
import PlayerModals from "../players/PlayerModals";
import RoundDisabledMessage from "../ui/RoundDisabledMessage";
import TeamCardList from "./TeamCardList";
import { PlayerScoresByRound } from "../../types";
import { getOrderedTeamPicks } from "../../utils/teamUtils";

interface TeamsViewProps {
  initialActiveRound?: string;
  onRoundChange?: (round: string) => void;
}

const TeamsView = observer(({ initialActiveRound, onRoundChange }: TeamsViewProps) => {
  const store = useStore();
  const { draftStore, teamsStore, playersStore, scoresStore } = store;
  const tabsRef = useRef<TabsRef>(null);

  // Create a wrapper function for MobX action to make it compatible with the hook
  const setPlayerScoresWrapper = (scores: PlayerScoresByRound) => {
    scoresStore.setPlayerScores(scores);
  };

  // Use the PlayerModals hook to manage modals
  const {
    selectedPlayer,
    handleEditScore,
    handleTogglePlayerDisabled,
    modalsState,
    modalsHandlers
  } = usePlayerModals({
    playerScores: scoresStore.playerScores,
    setPlayerScores: setPlayerScoresWrapper,
    activeRound: scoresStore.activeRound
  });

  // Synchronize tab UI with initialActiveRound prop
  useEffect(() => {
    if (initialActiveRound && tabsRef.current) {
      const roundIndex = PLAYOFF_ROUNDS.indexOf(initialActiveRound);
      if (roundIndex !== -1) {
        tabsRef.current.setActiveTab(roundIndex);
      }
    }
  }, [initialActiveRound]);

  // Notify parent component when round changes
  useEffect(() => {
    if (onRoundChange && scoresStore.activeRound !== initialActiveRound) {
      onRoundChange(scoresStore.activeRound);
    }
  }, [scoresStore.activeRound, onRoundChange, initialActiveRound]);

  // Handle tab change from user interaction
  const handleTabChange = (tab: number) => {
    scoresStore.setActiveRound(PLAYOFF_ROUNDS[tab]);
  };

  // Compute round validation based on completion status
  const roundValidation = useMemo(() => {
    // Helper function to check if a round is complete
    const isRoundComplete = (round: string): boolean => {
      if (!draftStore.isDraftFinished) return false;

      const allTeamPlayers: Array<any> = [];

      // Collect all players from all teams
      teamsStore.teams.forEach(team => {
        const teamPicks = getOrderedTeamPicks(team, playersStore.draftPicks);
        teamPicks.forEach(({ player }) => {
          allTeamPlayers.push(player);
        });
      });

      // Check if all players have been scored or marked as not playing
      return allTeamPlayers.every(player => {
        const playerData = scoresStore.playerScores[round]?.[player.name];
        return playerData?.scoreData || playerData?.isDisabled === true;
      });
    };

    const wildCardComplete = isRoundComplete("Wild Card");
    const divisionalComplete = isRoundComplete("Divisional");
    const conferenceComplete = isRoundComplete("Conference");

    return {
      "Wild Card": true, // Always enabled
      "Divisional": wildCardComplete,
      "Conference": wildCardComplete && divisionalComplete,
      "Superbowl": wildCardComplete && divisionalComplete && conferenceComplete
    };
  }, [draftStore.isDraftFinished, teamsStore.teams, playersStore.draftPicks, scoresStore.playerScores]);

  // If draft isn't finished, show placeholder
  if (!draftStore.isDraftFinished) {
    return (
      <div className="flex h-32 items-center justify-center text-gray-500">
        Complete draft first
      </div>
    );
  }

  // If data is still loading, show loading message
  if (scoresStore.isLoading) {
    return (
      <div className="flex h-32 items-center justify-center text-gray-500">
        Loading player scores...
      </div>
    );
  }

  return (
    <div>
      <Tabs
        aria-label="Playoff rounds"
        variant="underline"
        ref={tabsRef}
        onActiveTabChange={handleTabChange}
      >
        {PLAYOFF_ROUNDS.map((round) => (
          <Tabs.Item
            key={round}
            active={scoresStore.activeRound === round}
            title={round}
            disabled={!roundValidation[round as keyof typeof roundValidation]}
          >
            {roundValidation[round as keyof typeof roundValidation] ? (
              <TeamCardList
                round={round}
                onEditScore={handleEditScore}
                onTogglePlayerDisabled={handleTogglePlayerDisabled}
              />
            ) : (
              <RoundDisabledMessage round={round} />
            )}
          </Tabs.Item>
        ))}
      </Tabs>

      {/* All modals grouped in a single component */}
      <PlayerModals
        modalsState={modalsState}
        modalsHandlers={modalsHandlers}
        activeRound={scoresStore.activeRound}
      />
    </div>
  );
});

export default TeamsView;