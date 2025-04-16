import { Tabs } from "flowbite-react";
import { useState } from "react";
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
  const [selectedPlayer, setSelectedPlayer] = useState<ExtendedPlayer | null>(null);
  const [clearScoresPlayer, setClearScoresPlayer] = useState<ExtendedPlayer | null>(null);
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

  // Handler for opening the score editing modal
  const handleEditScore = (player: ExtendedPlayer) => {
    setSelectedPlayer({...player, currentRound: activeRound});
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
      setClearScoresPlayer({...player, currentRound: round});
      setOpenClearScoresModal(true);
      return;
    }
    
    setPlayerScores((prev) => {
      const roundScores = prev[round] || {};
      const currentPlayer = roundScores[player.name] || { ...player, currentRound: round };
      const isCurrentlyDisabled = currentPlayer.isDisabled || false;
      
      // If the player already has scores, don't allow toggling disabled status
      if (currentPlayer.scoreData && !isCurrentlyDisabled) {
        return prev;
      }
      
      // If toggling from enabled to disabled, clear any existing score data
      const updatedPlayer = {
        ...currentPlayer,
        isDisabled: !isCurrentlyDisabled,
        score: isCurrentlyDisabled ? currentPlayer.score : 0,
        scoreData: isCurrentlyDisabled ? currentPlayer.scoreData : undefined
      };
      
      return {
        ...prev,
        [round]: {
          ...roundScores,
          [player.name]: updatedPlayer,
        }
      };
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
    const overallScores: {[team: string]: number} = {};
    
    teams.forEach(team => {
      let totalScore = 0;
      
      // Sum up scores from all rounds
      Object.values(playerScores).forEach(roundScores => {
        const teamPlayers = getOrderedTeamPicks(team, draftPicks);
        teamPlayers.forEach(({player}) => {
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
  
  // Get ordered team picks (importing from scoreCalculator.ts)
  const getOrderedTeamPicks = (team: string, draftPicks: any) => {
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
  };

  // Render team cards for the current tab
  const renderTeamCards = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {teams.map((team) => (
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
  
  // Render overall scores tab
  const renderScoresTab = () => {
    const overallScores = calculateOverallTeamScores();
    
    // Sort teams by overall score (highest first)
    const sortedTeams = [...teams].sort((a, b) => (overallScores[b] || 0) - (overallScores[a] || 0));
    
    return (
      <div className="grid grid-cols-1 gap-4">
        {sortedTeams.map(team => (
          <div key={`overall-${team}`} className="p-4 bg-white rounded-lg shadow">
            <div className="mb-4 flex items-center justify-between">
              <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">
                {team}
              </h5>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {overallScores[team] || 0} pts
              </div>
            </div>
            
            {/* Show round-by-round breakdown */}
            <div className="space-y-2">
              {PLAYOFF_ROUNDS.map(round => {
                // Calculate team score for this round
                let roundScore = 0;
                const teamPlayers = getOrderedTeamPicks(team, draftPicks);
                
                teamPlayers.forEach(({player}) => {
                  // Skip disabled players
                  if (playerScores[round]?.[player.name]?.isDisabled) return;
                  // Add player's score for this round
                  roundScore += playerScores[round]?.[player.name]?.score || 0;
                });
                
                return (
                  <div key={`${team}-${round}`} className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">{round}:</span>
                    <span className="text-sm font-semibold">{roundScore} pts</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    );
  };

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
        <Tabs.Item title="Divisional">
          {renderTeamCards()}
        </Tabs.Item>
        <Tabs.Item title="Conference">
          {renderTeamCards()}
        </Tabs.Item>
        <Tabs.Item title="Superbowl">
          {renderTeamCards()}
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
    </div>
  );
}