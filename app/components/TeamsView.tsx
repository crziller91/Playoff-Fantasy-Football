import { Tabs, Alert } from "flowbite-react";
import { useState, useEffect, useCallback } from "react";
import {
  TeamsViewProps,
  ExtendedPlayer,
  ScoreForm,
  FormErrors,
  PlayerScoresByRound
} from "../types";
import TeamCard from "./TeamCard";
import ScoreModal from "./ScoreModal";
import ClearScoresModal from "./ClearScoresModal";
import PlayerStatusModal from "./PlayerStatusModal";
import PlayerReactivationModal from "./PlayerReactivationModal";
import { calculatePlayerScore, validateForm } from "../utils/scoreCalculator";

// Define the playoff rounds
export const PLAYOFF_ROUNDS = ["Wild Card", "Divisional", "Conference", "Superbowl"];

export default function TeamsView({
  teams,
  draftPicks,
  isDraftFinished,
  playerScores: externalPlayerScores,
  setPlayerScores: externalSetPlayerScores
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

  // Tab state
  const [activeRound, setActiveRound] = useState<string>("Wild Card");

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

    const round = statusPlayer.currentRound || activeRound;

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

    // Reactivate the player by setting isDisabled to false
    updatePlayerStatus(reactivationPlayer, false, false);

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
  };

  // Handler for confirming clear scores
  const handleConfirmClearScores = () => {
    if (!clearScoresPlayer) return;
    const round = clearScoresPlayer.currentRound || activeRound;

    setPlayerScores((prev) => {
      const roundScores = prev[round] || {};

      return {
        ...prev,
        [round]: {
          ...roundScores,
          [clearScoresPlayer.name]: {
            ...clearScoresPlayer,
            score: 0,
            scoreData: undefined,
            isDisabled: false
          }
        }
      };
    });

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

  return (
    <div>
      <Tabs
        aria-label="Playoff rounds"
        variant="underline"
        onActiveTabChange={(tab) => {
          setActiveRound(PLAYOFF_ROUNDS[tab]);
        }}
      >
        <Tabs.Item active title="Wild Card">
          {renderTeamCards()}
        </Tabs.Item>
        <Tabs.Item
          title="Divisional"
          disabled={!roundValidation["Divisional"]}
        >
          {roundValidation["Divisional"] ? renderTeamCards() : renderDisabledRound("Divisional")}
        </Tabs.Item>
        <Tabs.Item
          title="Conference"
          disabled={!roundValidation["Conference"]}
        >
          {roundValidation["Conference"] ? renderTeamCards() : renderDisabledRound("Conference")}
        </Tabs.Item>
        <Tabs.Item
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