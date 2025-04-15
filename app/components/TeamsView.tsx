import { Tabs } from "flowbite-react";
import { useState } from "react";
import { 
  TeamsViewProps, 
  ExtendedPlayer, 
  ScoreForm, 
  FormErrors 
} from "../types";
import TeamCard from "./TeamCard";
import ScoreModal from "./ScoreModal";
import { calculatePlayerScore, validateForm } from "../utils/scoreCalculator";

export default function TeamsView({ teams, draftPicks, isDraftFinished }: TeamsViewProps) {
  // Modal state
  const [openModal, setOpenModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<ExtendedPlayer | null>(null);
  const [scoreForm, setScoreForm] = useState<ScoreForm>({});
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [fgCount, setFgCount] = useState(0);
  
  // Tab state
  const [activeTab, setActiveTab] = useState<string>("Wild Card");
  
  // Player scores state
  const [playerScores, setPlayerScores] = useState<{ [key: string]: ExtendedPlayer }>({});

  // Handler for opening the score editing modal
  const handleEditScore = (player: ExtendedPlayer) => {
    setSelectedPlayer(player);
    // Load existing score data if available
    setScoreForm(playerScores[player.name]?.scoreData || {});
    setFgCount(parseInt(playerScores[player.name]?.scoreData?.fg || "0", 10) || 0);
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
    setPlayerScores((prev) => ({
      ...prev,
      [selectedPlayer.name]: {
        ...selectedPlayer,
        score,
        scoreData: { ...scoreForm },
      },
    }));

    handleCloseModal();
  };

  // Render team cards for the current tab
  const renderTeamCards = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {teams.map((team) => (
        <TeamCard
          key={team}
          team={team}
          draftPicks={draftPicks}
          playerScores={playerScores}
          onEditScore={handleEditScore}
        />
      ))}
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
          const tabs = ["Wild Card", "Divisional", "Conference", "Superbowl"];
          setActiveTab(tabs[tab]);
        }}
      >
        <Tabs.Item active title="Wild Card">
          {renderTeamCards()}
        </Tabs.Item>
        <Tabs.Item title="Divisional">
          <div className="flex h-32 items-center justify-center text-gray-500">
            Divisional
          </div>
        </Tabs.Item>
        <Tabs.Item title="Conference">
          <div className="flex h-32 items-center justify-center text-gray-500">
            Conference
          </div>
        </Tabs.Item>
        <Tabs.Item title="Superbowl">
          <div className="flex h-32 items-center justify-center text-gray-500">
            Superbowl
          </div>
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
    </div>
  );
}