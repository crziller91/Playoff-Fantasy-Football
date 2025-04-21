import { Tabs, type TabsRef } from "flowbite-react";
import { useState, useEffect, useCallback, useRef, useLayoutEffect } from "react";
import {
  TeamsViewProps,
  ExtendedPlayer,
  ScoreForm,
  FormErrors,
  PlayerScoresByRound
} from "../types";
import TeamCard from "./TeamCard";
import ScoreModal from "../modals/ScoreModal";
import ClearScoresModal from "../modals/ClearScoresModal";
import PlayerStatusModal from "../modals/PlayerStatusModal";
import PlayerReactivationModal from "../modals/PlayerReactivationModal";
import { calculatePlayerScore, validateForm } from "../utils/scoreCalculator";
import { fetchPlayerScores, savePlayerScore, bulkSavePlayerScores, convertToApiFormat, deletePlayerScore } from "../services/scoreService";

// Define the playoff rounds
export const PLAYOFF_ROUNDS = ["Wild Card", "Divisional", "Conference", "Superbowl"];

export default function TeamsView({
  teams,
  draftPicks,
  isDraftFinished,
  playerScores: externalPlayerScores,
  setPlayerScores: externalSetPlayerScores,
  initialActiveRound,  // New prop with default value
  onRoundChange // New callback prop
}: TeamsViewProps) {
  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [openClearScoresModal, setOpenClearScoresModal] = useState(false);
  const [openStatusModal, setOpenStatusModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<ExtendedPlayer | null>(null);
  const [clearScoresPlayer, setClearScoresPlayer] = useState<ExtendedPlayer | null>(null);
  const [statusPlayer, setStatusPlayer] = useState<ExtendedPlayer | null>(null);
  const [openReactivationModal, setOpenReactivationModal] = useState(false);
  const [reactivationPlayer, setReactivationPlayer] = useState<ExtendedPlayer | null>(null);
  const [scoreForm, setScoreForm] = useState<ScoreForm>({});
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [fgCount, setFgCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const tabsRef = useRef<TabsRef>(null);

  // Use the initialActiveRound prop directly without a default
  const [activeRound, setActiveRound] = useState<string>(
    // If initialActiveRound is provided, use it, otherwise use "Wild Card"
    initialActiveRound || "Wild Card"
  );

  // Use local or external player scores state
  const [localPlayerScores, setLocalPlayerScores] = useState<PlayerScoresByRound>({
    "Wild Card": {},
    "Divisional": {},
    "Conference": {},
    "Superbowl": {}
  });

  // Use external state if provided, otherwise use local state
  const playerScores = externalPlayerScores || localPlayerScores;
  const setPlayerScores = externalSetPlayerScores || setLocalPlayerScores;

  // This useLayoutEffect runs BEFORE rendering to set the tab
  useLayoutEffect(() => {
    if (initialActiveRound && tabsRef.current) {
      const roundIndex = PLAYOFF_ROUNDS.indexOf(initialActiveRound);
      if (roundIndex !== -1) {
        // Directly set the active tab without delay
        tabsRef.current.setActiveTab(roundIndex);
      }
    }
  }, [initialActiveRound]); // Only depend on initialActiveRound

  // The normal useEffect to notify parent of changes
  useEffect(() => {
    if (onRoundChange && activeRound !== initialActiveRound) {
      onRoundChange(activeRound);
    }
  }, [activeRound, onRoundChange, initialActiveRound]);

  // Load player scores from the database on component mount
  useEffect(() => {
    const loadPlayerScores = async () => {
      try {
        setIsLoading(true);
        const scores = await fetchPlayerScores();
        // Only update if we have scores and aren't using external state management
        if (scores && Object.keys(scores).length > 0 && !externalPlayerScores) {
          setLocalPlayerScores(scores);
        }
      } catch (error) {
        console.error("Error loading player scores:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isDraftFinished) {
      loadPlayerScores();
    }
  }, [isDraftFinished, externalPlayerScores]);

  // Save player scores to the database when they change
  useEffect(() => {
    // Don't save if we're still loading or draft isn't finished
    if (isLoading || !isDraftFinished) return;

    // Don't run on initial render when playerScores might be empty
    if (Object.values(playerScores).every(round => Object.keys(round).length === 0)) return;

    const saveScores = async () => {
      try {
        // Convert player scores to API format
        const apiFormatScores = convertToApiFormat(playerScores);

        // Only save if we have scores to save
        if (apiFormatScores.length > 0) {
          await bulkSavePlayerScores(apiFormatScores);
        }
      } catch (error) {
        console.error("Error saving player scores:", error);
      }
    };

    // Use a debounce to prevent too many API calls
    const timeoutId = setTimeout(() => {
      saveScores();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [playerScores, isDraftFinished, isLoading]);

  // Memoize the getOrderedTeamPicks function to use in dependency arrays
  const getOrderedTeamPicks = useCallback((team: string, draftPicks: any) => {
    const positionOrder = ["QB", "RB", "WR", "TE", "DST", "K"];
    const teamPicks = Object.entries(draftPicks[team] || {})
      .filter(([_, player]) => player !== null)
      .map(([pick, player]) => ({ pick: Number(pick), player: player as ExtendedPlayer }));

    return teamPicks.sort((a, b) => {
      const posA = positionOrder.indexOf(a.player.position);
      const posB = positionOrder.indexOf(b.player.position);
      if (posA !== posB) return posA - posB;
      return a.pick - b.pick;
    });
  }, []);

  // Round validation information
  const [roundValidation, setRoundValidation] = useState<{ [round: string]: boolean }>({
    "Wild Card": true,
    "Divisional": false,
    "Conference": false,
    "Superbowl": false
  });

  // Update round validation whenever playerScores changes
  useEffect(() => {
    // Define isRoundComplete function inside the effect
    const isRoundComplete = (round: string) => {
      const allTeamPlayers: ExtendedPlayer[] = [];

      // Collect all players from all teams
      teams.forEach(team => {
        const teamPicks = getOrderedTeamPicks(team, draftPicks);
        teamPicks.forEach(({ player }) => {
          allTeamPlayers.push(player);
        });
      });

      // Check if all players have been scored or marked as not playing
      return allTeamPlayers.every(player => {
        const playerData = playerScores[round]?.[player.name];
        return playerData?.scoreData || playerData?.isDisabled === true;
      });
    };

    const wildCardComplete = isRoundComplete("Wild Card");
    const divisionalComplete = isRoundComplete("Divisional");
    const conferenceComplete = isRoundComplete("Conference");

    setRoundValidation({
      "Wild Card": true, // Always enabled
      "Divisional": wildCardComplete,
      "Conference": wildCardComplete && divisionalComplete,
      "Superbowl": wildCardComplete && divisionalComplete && conferenceComplete
    });
  }, [playerScores, teams, draftPicks, getOrderedTeamPicks]);

  // Handler for opening the score editing modal
  const handleEditScore = (player: ExtendedPlayer) => {
    setSelectedPlayer({ ...player, currentRound: activeRound });
    // Load existing score data if available
    setScoreForm(playerScores[activeRound]?.[player.name]?.scoreData || {});
    setFgCount(parseInt(playerScores[activeRound]?.[player.name]?.scoreData?.fg || "0", 10) || 0);
    setOpenModal(true);
    setFormErrors({});
    setSubmitAttempted(false);
  };

  // Handler for closing the modal
  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedPlayer(null);
    setScoreForm({});
    setFgCount(0);
    setFormErrors({});
    setSubmitAttempted(false);
  };

  // Handle tab change from user interaction
  const handleTabChange = (tab: number) => {
    const newRound = PLAYOFF_ROUNDS[tab];
    setActiveRound(newRound);
  };

  // Handler for toggling player disabled status
  const handleTogglePlayerDisabled = (player: ExtendedPlayer, isClearScores?: boolean) => {
    const round = activeRound;

    // If this is a clear scores action, open the confirmation modal
    if (isClearScores && playerScores[round]?.[player.name]?.scoreData) {
      setClearScoresPlayer({ ...player, currentRound: round });
      setOpenClearScoresModal(true);
      return;
    }

    // Check if player is already disabled and we're trying to re-enable
    if (playerScores[round]?.[player.name]?.isDisabled) {
      setReactivationPlayer({ ...player, currentRound: round });
      setOpenReactivationModal(true);
      return;
    }

    // For Wild Card, we can directly toggle disabled status
    if (round === "Wild Card") {
      updatePlayerStatus(player, !playerScores[round]?.[player.name]?.isDisabled, false);
    }
    // For other rounds, open the status modal to determine if elimination or just not playing
    else {
      setStatusPlayer({ ...player, currentRound: round });
      setOpenStatusModal(true);
    }
  };

  // Handle player being eliminated from playoffs
  const handlePlayerEliminated = () => {
    if (!statusPlayer) return;

    // Update this round and cascade to future rounds
    updatePlayerStatus(statusPlayer, true, true);

    setOpenStatusModal(false);
    setStatusPlayer(null);
  };

  // Handle player just not playing this specific round (injury)
  const handlePlayerNotPlaying = () => {
    if (!statusPlayer) return;

    // Just update the current round, don't cascade
    updatePlayerStatus(statusPlayer, true, false);

    setOpenStatusModal(false);
    setStatusPlayer(null);
  };

  // Close the status modal without taking action
  const handleCloseStatusModal = () => {
    setOpenStatusModal(false);
    setStatusPlayer(null);
  };

  // Handle player reactivation confirmation
  const handlePlayerReactivation = () => {
    if (!reactivationPlayer) return;

    const round = reactivationPlayer.currentRound || activeRound;

    // Update UI state by removing the player from the disabled state
    setPlayerScores((prev) => {
      // Create a deep copy of the previous state
      const newState: PlayerScoresByRound = JSON.parse(JSON.stringify(prev));

      // If the player has a record in this round, update it
      if (newState[round]?.[reactivationPlayer.name]) {
        // Remove the player's disabled status entry completely
        delete newState[round][reactivationPlayer.name];
      }

      return newState;
    });

    // Delete the player's score entry from the database instead of updating it
    savePlayerScore(
      reactivationPlayer.id,
      round,
      false,      // isDisabled = false
      null,       // statusReason = null
      0,          // score = 0
      undefined,  // scoreData = undefined
      true        // NEW: deleteIfReactivated = true
    ).catch(err => console.error(`Error deleting player score: ${err}`));

    setOpenReactivationModal(false);
    setReactivationPlayer(null);
  };

  // Close the reactivation modal without taking action
  const handleCloseReactivationModal = () => {
    setOpenReactivationModal(false);
    setReactivationPlayer(null);
  };

  // Shared function to update player status
  const updatePlayerStatus = (player: ExtendedPlayer, isDisabled: boolean, cascade: boolean) => {
    const round = player.currentRound || activeRound;

    setPlayerScores((prev) => {
      // Create a deep copy of the previous state
      const newState: PlayerScoresByRound = JSON.parse(JSON.stringify(prev));

      // Initialize the round if it doesn't exist
      if (!newState[round]) {
        newState[round] = {};
      }

      // Get or create the player entry
      const currentPlayer = newState[round][player.name] || { ...player, currentRound: round };

      // If the player already has scores, don't allow toggling disabled status
      if (currentPlayer.scoreData && isDisabled) {
        return prev;
      }

      // Update status for this round
      const statusReason = isDisabled ? (cascade ? "eliminated" : "notPlaying") : null;

      // Update player in current round
      newState[round][player.name] = {
        ...currentPlayer,
        isDisabled: isDisabled,
        statusReason: statusReason,
        score: isDisabled ? 0 : currentPlayer.score,
        scoreData: isDisabled ? undefined : currentPlayer.scoreData
      };

      // If cascade is true and we're not in Wild Card round,
      // then also disable this player for all subsequent rounds
      if (cascade && isDisabled && round !== "Wild Card") {
        const subsequentRounds = PLAYOFF_ROUNDS.slice(PLAYOFF_ROUNDS.indexOf(round) + 1);

        subsequentRounds.forEach(futureRound => {
          // Initialize the round if it doesn't exist
          if (!newState[futureRound]) {
            newState[futureRound] = {};
          }

          const futurePlayer = newState[futureRound][player.name] || { ...player, currentRound: futureRound };

          // Update player in future round
          newState[futureRound][player.name] = {
            ...futurePlayer,
            isDisabled: true,
            statusReason: "eliminated", // Mark as eliminated in future rounds
            score: 0,
            scoreData: undefined
          };
        });
      }

      return newState;
    });

    // Save this individual player status update to the database
    savePlayerScore(
      player.id,
      round,
      isDisabled,
      isDisabled ? (cascade ? "eliminated" : "notPlaying") : null,
      0,
      undefined
    ).catch(err => console.error(`Error saving player status: ${err}`));

    // If cascading, also save future rounds
    if (cascade && isDisabled && round !== "Wild Card") {
      const subsequentRounds = PLAYOFF_ROUNDS.slice(PLAYOFF_ROUNDS.indexOf(round) + 1);

      // Save each future round status
      subsequentRounds.forEach(futureRound => {
        savePlayerScore(
          player.id,
          futureRound,
          true,
          "eliminated",
          0,
          undefined
        ).catch(err => console.error(`Error saving cascaded player status: ${err}`));
      });
    }
  };

  // Handler for confirming clear scores
  const handleConfirmClearScores = () => {
    if (!clearScoresPlayer) return;
    const round = clearScoresPlayer.currentRound || activeRound;

    // Update UI state
    setPlayerScores((prev) => {
      const roundScores = prev[round] || {};

      // Create a new state object with the cleared player removed
      const newRoundScores = { ...roundScores };
      // Delete the player entry completely instead of just clearing scores
      delete newRoundScores[clearScoresPlayer.name];

      return {
        ...prev,
        [round]: newRoundScores
      };
    });

    // Delete the player score entry from the database
    deletePlayerScore(
      clearScoresPlayer.id,
      round
    ).catch(err => console.error(`Error deleting player score: ${err}`));

    setOpenClearScoresModal(false);
    setClearScoresPlayer(null);
  };

  // Handler for closing clear scores modal
  const handleCloseClearScoresModal = () => {
    setOpenClearScoresModal(false);
    setClearScoresPlayer(null);
  };

  // Handler for input field changes
  const handleInputChange = (field: keyof ScoreForm, value: string) => {
    if (value === "" || /^-?\d*$/.test(value)) {
      setScoreForm((prev) => ({ ...prev, [field]: value }));

      // Clear error for this field if it was previously marked as error
      if (formErrors[field]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    }
  };

  // Handler for field goal count changes
  const handleFgCountChange = (value: string) => {
    if (value === "" || /^-?\d*$/.test(value)) {
      const count = parseInt(value) || 0;
      setFgCount(count);
      setScoreForm((prev) => ({
        ...prev,
        fg: value,
        fgYardages: Array(count).fill(""),
      }));

      // Clear error for fg field if it was previously marked as error
      if (formErrors.fg) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.fg;
          return newErrors;
        });
      }
    }
  };

  // Handler for field goal yardage changes
  const handleFgYardageChange = (index: number, value: string) => {
    if (value === "" || /^-?\d*$/.test(value)) {
      setScoreForm((prev) => {
        const newYardages = [...(prev.fgYardages || [])];
        newYardages[index] = value;
        return { ...prev, fgYardages: newYardages };
      });

      // Clear error for this specific yardage field if it was previously marked as error
      if (formErrors[`fgYardage${index}`]) {
        setFormErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[`fgYardage${index}`];
          return newErrors;
        });
      }
    }
  };

  // Form submission handler
  const handleSubmit = () => {
    if (!selectedPlayer) return;
    const round = selectedPlayer.currentRound || activeRound;

    setSubmitAttempted(true);

    // Validate form before submission
    const newErrors = validateForm(selectedPlayer, scoreForm, fgCount);
    setFormErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    // Calculate score
    const score = calculatePlayerScore(selectedPlayer, scoreForm);

    // Update playerScores state
    setPlayerScores((prev) => {
      const roundScores = prev[round] || {};

      return {
        ...prev,
        [round]: {
          ...roundScores,
          [selectedPlayer.name]: {
            ...selectedPlayer,
            score,
            scoreData: { ...scoreForm },
            isDisabled: false, // Ensure player is enabled when scores are submitted
          }
        }
      };
    });

    // Save player score to the database
    savePlayerScore(
      selectedPlayer.id,
      round,
      false, // Not disabled since we're setting a score
      null,  // No status reason needed
      score,
      { ...scoreForm }
    ).catch(err => console.error(`Error saving player score: ${err}`));

    handleCloseModal();
  };

  // Calculate overall team scores across all rounds
  const calculateOverallTeamScores = () => {
    const overallScores: { [team: string]: number } = {};

    teams.forEach(team => {
      let totalScore = 0;

      // Sum up scores from all rounds
      Object.values(playerScores).forEach(roundScores => {
        const teamPlayers = getOrderedTeamPicks(team, draftPicks);
        teamPlayers.forEach(({ player }) => {
          // Skip disabled players
          if (roundScores[player.name]?.isDisabled) return;
          // Add player's score for this round (or 0 if not played)
          totalScore += roundScores[player.name]?.score || 0;
        });
      });

      overallScores[team] = totalScore;
    });

    return overallScores;
  };

  // Render team cards for the current tab
  const renderTeamCards = () => {
    // Calculate team scores for the current round
    const roundScores: { [team: string]: number } = {};

    teams.forEach(team => {
      // Calculate team score for this round
      const teamPlayers = getOrderedTeamPicks(team, draftPicks);
      let roundScore = 0;

      teamPlayers.forEach(({ player }) => {
        // Skip disabled players
        if (playerScores[activeRound]?.[player.name]?.isDisabled) return;
        // Add player's score for this round
        roundScore += playerScores[activeRound]?.[player.name]?.score || 0;
      });

      roundScores[team] = roundScore;
    });

    // Sort teams by round score (highest first)
    const sortedTeams = [...teams].sort((a, b) => roundScores[b] - roundScores[a]);

    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {sortedTeams.map((team) => (
          <TeamCard
            key={`${team}-${activeRound}`}
            team={team}
            draftPicks={draftPicks}
            playerScores={playerScores[activeRound] || {}}
            onEditScore={handleEditScore}
            onTogglePlayerDisabled={handleTogglePlayerDisabled}
            round={activeRound}
          />
        ))}
      </div>
    );
  };

  // Render placeholder for disabled rounds
  const renderDisabledRound = (round: string) => (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 text-xl font-semibold text-gray-700">
        {round} Round Locked
      </div>
      <div className="text-gray-500">
        {round === "Divisional" && (
          <p>Complete all Wild Card player scores first.</p>
        )}
        {round === "Conference" && (
          <p>Complete all Wild Card and Divisional player scores first.</p>
        )}
        {round === "Superbowl" && (
          <p>Complete all Wild Card, Divisional, and Conference player scores first.</p>
        )}
      </div>
    </div>
  );

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
        <Tabs.Item
          active={activeRound === "Wild Card"}
          title="Wild Card"
        >
          {renderTeamCards()}
        </Tabs.Item>
        <Tabs.Item
          active={activeRound === "Divisional"}
          title="Divisional"
          disabled={!roundValidation["Divisional"]}
        >
          {roundValidation["Divisional"] ? renderTeamCards() : renderDisabledRound("Divisional")}
        </Tabs.Item>
        <Tabs.Item
          active={activeRound === "Conference"}
          title="Conference"
          disabled={!roundValidation["Conference"]}
        >
          {roundValidation["Conference"] ? renderTeamCards() : renderDisabledRound("Conference")}
        </Tabs.Item>
        <Tabs.Item
          active={activeRound === "Superbowl"}
          title="Superbowl"
          disabled={!roundValidation["Superbowl"]}
        >
          {roundValidation["Superbowl"] ? renderTeamCards() : renderDisabledRound("Superbowl")}
        </Tabs.Item>
      </Tabs>

      {/* Score modal */}
      <ScoreModal
        isOpen={openModal}
        onClose={handleCloseModal}
        player={selectedPlayer}
        scoreForm={scoreForm}
        formErrors={formErrors}
        submitAttempted={submitAttempted}
        fgCount={fgCount}
        onInputChange={handleInputChange}
        onFgCountChange={handleFgCountChange}
        onFgYardageChange={handleFgYardageChange}
        onSubmit={handleSubmit}
      />

      {/* Clear Scores confirmation modal */}
      <ClearScoresModal
        isOpen={openClearScoresModal}
        player={clearScoresPlayer}
        onClose={handleCloseClearScoresModal}
        onConfirm={handleConfirmClearScores}
      />

      {/* Player Status modal */}
      <PlayerStatusModal
        isOpen={openStatusModal}
        player={statusPlayer}
        round={activeRound}
        onClose={handleCloseStatusModal}
        onConfirmEliminated={handlePlayerEliminated}
        onConfirmNotPlaying={handlePlayerNotPlaying}
      />

      {/* Player Reactivation modal */}
      <PlayerReactivationModal
        isOpen={openReactivationModal}
        player={reactivationPlayer}
        onClose={handleCloseReactivationModal}
        onConfirm={handlePlayerReactivation}
      />
    </div>
  );
}