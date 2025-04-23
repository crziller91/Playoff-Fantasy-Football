import { Tabs, type TabsRef } from "flowbite-react";
import { useEffect, useRef } from "react";
import { TeamsViewProps } from "../types";
import { PLAYOFF_ROUNDS } from "../constants/playoffs";
import { useTeamsViewState } from "../hooks/useTeamsViewState";
import { usePlayerModals } from "../hooks/usePlayerModals";
import PlayerModals from "./PlayerModals";
import RoundDisabledMessage from "./RoundDisabledMessage";
import TeamCardList from "./TeamCardList";

export default function TeamsView({
  teams,
  draftPicks,
  isDraftFinished,
  playerScores: externalPlayerScores,
  setPlayerScores: externalSetPlayerScores,
  initialActiveRound,
  onRoundChange
}: TeamsViewProps) {
  const tabsRef = useRef<TabsRef>(null);

  // Use the TeamsViewState hook to manage state
  const {
    activeRound,
    setActiveRound,
    playerScores,
    setPlayerScores,
    isLoading,
    roundValidation
  } = useTeamsViewState({
    initialActiveRound,
    externalPlayerScores,
    externalSetPlayerScores,
    isDraftFinished,
    teams,
    draftPicks
  });

  // Use the PlayerModals hook to manage modals
  const {
    selectedPlayer,
    handleEditScore,
    handleTogglePlayerDisabled,
    modalsState,
    modalsHandlers
  } = usePlayerModals({
    playerScores,
    setPlayerScores,
    activeRound
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
    if (onRoundChange && activeRound !== initialActiveRound) {
      onRoundChange(activeRound);
    }
  }, [activeRound, onRoundChange, initialActiveRound]);

  // Handle tab change from user interaction
  const handleTabChange = (tab: number) => {
    setActiveRound(PLAYOFF_ROUNDS[tab]);
  };

  // If draft isn't finished, show placeholder
  if (!isDraftFinished) {
    return (
      <div className="flex h-32 items-center justify-center text-gray-500">
        Complete draft first
      </div>
    );
  }

  // If data is still loading, show loading message
  if (isLoading) {
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
            active={activeRound === round}
            title={round}
            disabled={!roundValidation[round]}
          >
            {roundValidation[round] ? (
              <TeamCardList
                teams={teams}
                draftPicks={draftPicks}
                round={round}
                playerScores={playerScores[round] || {}}
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
        activeRound={activeRound}
      />
    </div>
  );
}