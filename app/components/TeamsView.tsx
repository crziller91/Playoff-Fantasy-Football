import { Button, Card, Modal, Label, TextInput, Tabs } from "flowbite-react";
import { DraftPicks, Player, Team } from "../types";
import { useState } from "react";

// Extend Player type to include score and scoreData
interface ExtendedPlayer extends Player {
  score?: number;
  scoreData?: ScoreForm;
}

interface TeamsViewProps {
  teams: Team[];
  draftPicks: DraftPicks;
  isDraftFinished: boolean;
}

interface ScoreForm {
  touchdowns?: string;
  yards?: string;
  twoPtConversions?: string;
  interceptions?: string;
  completions?: string;
  rushingYards?: string;
  rushingAttempts?: string;
  receivingYards?: string;
  receptions?: string;
  pat?: string;
  fgMisses?: string;
  fg?: string;
  fgYardages?: string[];
  sacks?: string;
  blockedKicks?: string;
  fumblesRecovered?: string;
  safeties?: string;
  pointsAllowed?: string;
  yardsAllowed?: string; // Added for DST
}

export default function TeamsView({ teams, draftPicks, isDraftFinished }: TeamsViewProps) {
  const [openModal, setOpenModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<ExtendedPlayer | null>(null);
  const [scoreForm, setScoreForm] = useState<ScoreForm>({});
  const [fgCount, setFgCount] = useState(0);
  const [activeTab, setActiveTab] = useState<string>("Wild Card");
  // State to store player scores and submission status
  const [playerScores, setPlayerScores] = useState<{ [key: string]: ExtendedPlayer }>({});

  // Function to calculate score based on player position
  const calculatePlayerScore = (player: ExtendedPlayer, form: ScoreForm): number => {
    let score = 0;
    const parseNum = (val: string | undefined) => parseInt(val || "0", 10) || 0;

    switch (player.position) {
      case "QB":
        score += parseNum(form.touchdowns) * 4; // 4 pts per passing TD
        score += Math.floor(parseNum(form.yards) / 25); // 1 pt per 25 yards
        score += parseNum(form.twoPtConversions) * 2; // 2 pts per 2-pt conversion
        score -= parseNum(form.interceptions) * 2; // -2 per INT
        score += Math.floor(parseNum(form.completions) / 10); // 1 pt per 10 completions
        break;
      case "RB":
        score += parseNum(form.touchdowns) * 6; // 6 pts per TD
        score += Math.floor(parseNum(form.rushingYards) / 10); // 1 pt per 10 rushing yards
        score += Math.floor(parseNum(form.rushingAttempts) / 5); // 1 pt per 5 attempts
        score += parseNum(form.twoPtConversions) * 2; // 2 pts per 2-pt conversion
        break;
      case "WR":
      case "TE":
        score += parseNum(form.touchdowns) * 6; // 6 pts per TD
        score += Math.floor(parseNum(form.receivingYards) / 10); // 1 pt per 10 receiving yards
        score += parseNum(form.receptions); // 1 pt per reception
        score += parseNum(form.twoPtConversions) * 2; // 2 pts per 2-pt conversion
        break;
      case "K":
        score += parseNum(form.pat); // 1 pt per PAT
        score -= parseNum(form.fgMisses); // -1 per FG/PAT miss
        if (form.fgYardages) {
          form.fgYardages.forEach((yardage) => {
            const yards = parseNum(yardage);
            if (yards >= 60) score += 6;
            else if (yards >= 50) score += 5;
            else if (yards >= 40) score += 4;
            else if (yards >= 0) score += 3;
          });
        }
        break;
      case "DST":
        score += parseNum(form.touchdowns) * 6; // 6 pts per TD
        score += parseNum(form.sacks) * 2; // 2 pts per sack
        score += parseNum(form.blockedKicks) * 2; // 2 pts per blocked kick
        score += parseNum(form.interceptions) * 2; // 2 pts per INT
        score += parseNum(form.fumblesRecovered) * 2; // 2 pts per fumble recovered
        score += parseNum(form.safeties) * 2; // 2 pts per safety
        const points = parseNum(form.pointsAllowed);
        if (points === 0) score += 10;
        else if (points <= 6) score += 5;
        else if (points <= 13) score += 3;
        else if (points <= 17) score += 1;
        else if (points <= 34) score += -1;
        else if (points <= 45) score += -3;
        else score += -5;
        // Added yards allowed scoring
        const yards = parseNum(form.yardsAllowed);
        if (yards < 100) score += 5;
        else if (yards <= 199) score += 3;
        else if (yards <= 299) score += 2;
        else if (yards <= 399) score += -1;
        else if (yards <= 449) score += -3;
        else if (yards <= 499) score += -4;
        else score += -5;
        break;
      default:
        break;
    }
    return score;
  };

  const getOrderedTeamPicks = (team: Team) => {
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

  // Calculate total team score
  const getTeamScore = (team: Team): number => {
    return getOrderedTeamPicks(team).reduce((total, { player }) => {
      return total + (playerScores[player.name]?.score || 0);
    }, 0);
  };

  const handleEditScore = (player: ExtendedPlayer) => {
    setSelectedPlayer(player);
    // Load existing score data if available
    setScoreForm(playerScores[player.name]?.scoreData || {});
    setFgCount(parseInt(playerScores[player.name]?.scoreData?.fg || "0", 10) || 0);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setSelectedPlayer(null);
    setScoreForm({});
    setFgCount(0);
  };

  const handleInputChange = (field: keyof ScoreForm, value: string) => {
    if (value === "" || /^\d*$/.test(value)) {
      setScoreForm((prev) => ({ ...prev, [field]: value }));
    }
  };

  const handleFgCountChange = (value: string) => {
    if (value === "" || /^\d*$/.test(value)) {
      const count = parseInt(value) || 0;
      setFgCount(count);
      setScoreForm((prev) => ({
        ...prev,
        fg: value,
        fgYardages: Array(count).fill(""),
      }));
    }
  };

  const handleFgYardageChange = (index: number, value: string) => {
    if (value === "" || /^\d*$/.test(value)) {
      setScoreForm((prev) => {
        const newYardages = [...(prev.fgYardages || [])];
        newYardages[index] = value;
        return { ...prev, fgYardages: newYardages };
      });
    }
  };

  const handleSubmit = () => {
    if (!selectedPlayer) return;

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

  const renderModalContent = () => {
    if (!selectedPlayer) return null;

    const commonProps = (id: string, label: string, field: keyof ScoreForm) => ({
      id,
      label,
      value: scoreForm[field] || "",
      onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(field, e.target.value),
    });

    switch (selectedPlayer.position) {
      case "QB":
        return (
          <>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Add scores for {selectedPlayer.name}
            </h3>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="touchdowns"># of Touchdowns</Label>
              </div>
              <TextInput
                {...commonProps("touchdowns", "# of Touchdowns", "touchdowns")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="yards">Total Yards</Label>
              </div>
              <TextInput {...commonProps("yards", "Total Yards", "yards")} type="text" required />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="twoPtConversions"># of 2 PT Conversions</Label>
              </div>
              <TextInput
                {...commonProps("twoPtConversions", "# of 2 PT Conversions", "twoPtConversions")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="interceptions"># of Interceptions</Label>
              </div>
              <TextInput
                {...commonProps("interceptions", "# of Interceptions", "interceptions")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="completions"># of Completions</Label>
              </div>
              <TextInput
                {...commonProps("completions", "# of Completions", "completions")}
                type="text"
                required
              />
            </div>
          </>
        );
      case "RB":
        return (
          <>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Add scores for {selectedPlayer.name}
            </h3>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="touchdowns"># of Touchdowns</Label>
              </div>
              <TextInput
                {...commonProps("touchdowns", "# of Touchdowns", "touchdowns")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="rushingYards">Total Rushing Yards</Label>
              </div>
              <TextInput
                {...commonProps("rushingYards", "Total Rushing Yards", "rushingYards")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="rushingAttempts">Rushing Attempts</Label>
              </div>
              <TextInput
                {...commonProps("rushingAttempts", "Rushing Attempts", "rushingAttempts")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="twoPtConversions"># of 2 PT Conversions</Label>
              </div>
              <TextInput
                {...commonProps("twoPtConversions", "# of 2 PT Conversions", "twoPtConversions")}
                type="text"
                required
              />
            </div>
          </>
        );
      case "WR":
      case "TE":
        return (
          <>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Add scores for {selectedPlayer.name}
            </h3>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="touchdowns"># of Touchdowns</Label>
              </div>
              <TextInput
                {...commonProps("touchdowns", "# of Touchdowns", "touchdowns")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="receivingYards">Total Receiving Yards</Label>
              </div>
              <TextInput
                {...commonProps("receivingYards", "Total Receiving Yards", "receivingYards")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="receptions"># of Receptions</Label>
              </div>
              <TextInput
                {...commonProps("receptions", "# of Receptions", "receptions")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="twoPtConversions"># of 2 PT Conversions</Label>
              </div>
              <TextInput
                {...commonProps("twoPtConversions", "# of 2 PT Conversions", "twoPtConversions")}
                type="text"
                required
              />
            </div>
          </>
        );
      case "K":
        return (
          <>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Add scores for {selectedPlayer.name}
            </h3>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="pat"># of PAT</Label>
              </div>
              <TextInput {...commonProps("pat", "# of PAT", "pat")} type="text" required />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="fgMisses"># of FG/PAT Misses</Label>
              </div>
              <TextInput
                {...commonProps("fgMisses", "# of FG/PAT Misses", "fgMisses")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="fg"># of FG</Label>
              </div>
              <TextInput
                id="fg"
                type="text"
                value={scoreForm.fg || ""}
                onChange={(e) => handleFgCountChange(e.target.value)}
                required
              />
            </div>
            {fgCount > 0 &&
              Array.from({ length: fgCount }).map((_, index) => (
                <div key={index}>
                  <div className="mb-2 block">
                    <Label htmlFor={`fgYardage${index}`}>Yardage of FG #{index + 1}</Label>
                  </div>
                  <TextInput
                    id={`fgYardage${index}`}
                    type="text"
                    value={scoreForm.fgYardages?.[index] || ""}
                    onChange={(e) => handleFgYardageChange(index, e.target.value)}
                    required
                  />
                </div>
              ))}
          </>
        );
      case "DST":
        return (
          <>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white">
              Add scores for {selectedPlayer.name}
            </h3>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="touchdowns"># of Touchdowns</Label>
              </div>
              <TextInput
                {...commonProps("touchdowns", "# of Touchdowns", "touchdowns")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="sacks"># of Sacks</Label>
              </div>
              <TextInput {...commonProps("sacks", "# of Sacks", "sacks")} type="text" required />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="blockedKicks"># of Blocked Kicks</Label>
              </div>
              <TextInput
                {...commonProps("blockedKicks", "# of Blocked Kicks", "blockedKicks")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="interceptions"># of Interceptions</Label>
              </div>
              <TextInput
                {...commonProps("interceptions", "# of Interceptions", "interceptions")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="fumblesRecovered"># of Fumbles Recovered</Label>
              </div>
              <TextInput
                {...commonProps("fumblesRecovered", "# of Fumbles Recovered", "fumblesRecovered")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="safeties"># of Safeties</Label>
              </div>
              <TextInput
                {...commonProps("safeties", "# of Safeties", "safeties")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="pointsAllowed"># of Points Allowed</Label>
              </div>
              <TextInput
                {...commonProps("pointsAllowed", "# of Points Allowed", "pointsAllowed")}
                type="text"
                required
              />
            </div>
            <div>
              <div className="mb-2 block">
                <Label htmlFor="yardsAllowed">Total Yards Allowed</Label>
              </div>
              <TextInput
                {...commonProps("yardsAllowed", "Total Yards Allowed", "yardsAllowed")}
                type="text"
                required
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  const renderTeamCards = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {teams.map((team) => (
        <Card key={team} className="w-full">
          <div className="mb-4 flex items-center justify-between">
            <h5 className="text-xl font-bold leading-none text-gray-900 dark:text-white">{team}</h5>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              Score: {getTeamScore(team)}
            </div>
          </div>
          <div className="flow-root">
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {getOrderedTeamPicks(team).map(({ pick, player }) => (
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
                      onClick={() => handleEditScore(player)}
                    >
                      {playerScores[player.name]?.scoreData ? "Edit Scores" : "Enter Scores"}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      ))}
      {selectedPlayer && (
        <Modal show={openModal} size="md" onClose={handleCloseModal} popup>
          <Modal.Header />
          <Modal.Body>
            <div className="space-y-6">
              {renderModalContent()}
              <div className="w-full">
                <Button color="blue" onClick={handleSubmit}>
                  Submit
                </Button>
              </div>
            </div>
          </Modal.Body>
        </Modal>
      )}
    </div>
  );

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
    </div>
  );
}