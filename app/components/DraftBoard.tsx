"use client";

import { Flowbite, TabItem, Tabs, type TabsRef } from "flowbite-react";
import { DraftPicks, Player, Team, PlayerScoresByRound } from "../types";
import { useState, useRef, useMemo, useEffect } from "react";
import { HiUserCircle } from "react-icons/hi";
import { MdDashboard } from "react-icons/md";
import DraftDashboard from "./DraftDashboard";
import TeamsView, { PLAYOFF_ROUNDS } from "./TeamsView";
import { MdScoreboard } from "react-icons/md";
import ScoresTab from "./ScoresTab";
import { fetchPlayerScores } from "../services/scoreService";
import { useRouter, useSearchParams } from "next/navigation";

// Define constants outside the component
const TAB_NAMES = ["draft", "teams", "scores"] as const;
const TAB_MAP: Record<string, number> = {
  "draft": 0,
  "teams": 1,
  "scores": 2
};

// Define mappings between URL parameters and display names
const URL_PARAM_TO_ROUND: Record<string, string> = {
  "wildCard": "Wild Card",
  "divisional": "Divisional",
  "conference": "Conference",
  "superbowl": "Superbowl"
};

const ROUND_TO_URL_PARAM: Record<string, string> = {
  "Wild Card": "wildCard",
  "Divisional": "divisional",
  "Conference": "conference",
  "Superbowl": "superbowl"
};

interface DraftBoardProps {
  teams: Team[];
  picks: number[];
  draftPicks: DraftPicks;
  setDraftPicks: (picks: DraftPicks) => void;
  availablePlayers: Player[];
  setAvailablePlayers: (players: Player[]) => void;
  setTeams: (teams: Team[]) => void;
  searchTerms: { [key: string]: string };
  setSearchTerms: (terms: { [key: string]: string }) => void;
  teamBudgets: Map<string, number>;
  setTeamBudgets: (budgets: Map<string, number>) => void;
  onResetBoard: () => void;
  isDraftFinished: boolean;
  finishDraft: () => void;
  playerScores?: PlayerScoresByRound;
  setPlayerScores?: React.Dispatch<React.SetStateAction<PlayerScoresByRound>>;
}

export default function DraftBoard({
  teams,
  picks,
  draftPicks,
  setDraftPicks,
  availablePlayers,
  setAvailablePlayers,
  setTeams,
  searchTerms,
  setSearchTerms,
  teamBudgets,
  setTeamBudgets,
  onResetBoard,
  isDraftFinished,
  finishDraft,
}: DraftBoardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabsRef = useRef<TabsRef>(null);

  // Get tab and subtab from URL query parameters
  const tabParam = searchParams.get("tab");
  const subtabParam = searchParams.get("subtab");

  // Initialize activeTab state
  const [activeTab, setActiveTab] = useState(() => {
    if (tabParam && tabParam in TAB_MAP) {
      return TAB_MAP[tabParam];
    }
    return 0; // Default to Draft Board
  });

  // Initialize activeSubTab for Teams view
  const [activeSubTab, setActiveSubTab] = useState(() => {
    // Convert from URL parameter to display name if available
    if (subtabParam && subtabParam in URL_PARAM_TO_ROUND) {
      return URL_PARAM_TO_ROUND[subtabParam];
    }
    return "Wild Card"; // Default
  });

  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize playerScores state with all playoff rounds
  const [playerScores, setPlayerScores] = useState<PlayerScoresByRound>({
    "Wild Card": {},
    "Divisional": {},
    "Conference": {},
    "Superbowl": {}
  });

  // Update URL when tabs change
  useEffect(() => {
    const currentTab = TAB_NAMES[activeTab];

    // Only include subtab param for teams tab
    if (currentTab === "teams") {
      // Convert display name to URL parameter
      const subtabParam = ROUND_TO_URL_PARAM[activeSubTab] || "wildCard";
      router.push(`?tab=${currentTab}&subtab=${subtabParam}`);
    } else {
      router.push(`?tab=${currentTab}`);
    }
  }, [activeTab, activeSubTab, router]);

  // Set active tab based on URL params when component mounts
  useEffect(() => {
    if (tabParam && tabParam in TAB_MAP) {
      const tabIndex = TAB_MAP[tabParam];

      // Set the active tab using the ref
      if (tabsRef.current) {
        tabsRef.current.setActiveTab(tabIndex);
      }

      // Update active tab state
      setActiveTab(tabIndex);

      // Handle subtab if we're on the teams tab
      if (tabParam === 'teams' && subtabParam) {
        // Convert URL parameter to display name
        const roundDisplayName = URL_PARAM_TO_ROUND[subtabParam];

        // Only update if it's a valid round name
        if (roundDisplayName && PLAYOFF_ROUNDS.includes(roundDisplayName)) {
          setActiveSubTab(roundDisplayName);
        }
      }
    }
  }, [tabParam, subtabParam]);

  // Load player scores from the database when draft is finished
  useEffect(() => {
    if (isDraftFinished) {
      const loadScores = async () => {
        try {
          setIsLoading(true);
          const scores = await fetchPlayerScores();
          if (scores && Object.keys(scores).length > 0) {
            setPlayerScores(scores);
          }
        } catch (error) {
          console.error("Error loading player scores:", error);
        } finally {
          setIsLoading(false);
        }
      };

      loadScores();
    }
  }, [isDraftFinished]);

  // Check if all dropdowns are filled
  const isDraftComplete = useMemo(() => {
    return teams.every((team) =>
      picks.every((pick) => draftPicks[team]?.[pick] !== null && draftPicks[team]?.[pick] !== undefined)
    );
  }, [teams, picks, draftPicks]);

  const handleReset = () => {
    onResetBoard();
    // Clear scores when resetting
    setPlayerScores({
      "Wild Card": {},
      "Divisional": {},
      "Conference": {},
      "Superbowl": {}
    });
  };

  // Handle tab change
  const handleTabChange = (tab: number) => {
    setActiveTab(tab);
  };

  // Handle round change from TeamsView
  const handleRoundChange = (round: string) => {
    setActiveSubTab(round);
  };

  return (
    <Flowbite>
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mb-1">
          <div className="mb-4">
            <Tabs
              aria-label="Default tabs"
              variant="default"
              ref={tabsRef}
              onActiveTabChange={handleTabChange}
            >
              <TabItem active={activeTab === 0} title="Draft Board" icon={MdDashboard}>
                <DraftDashboard
                  teams={teams}
                  picks={picks}
                  availablePlayers={availablePlayers}
                  draftPicks={draftPicks}
                  searchTerms={searchTerms}
                  teamBudgets={teamBudgets}
                  setDraftPicks={setDraftPicks}
                  setAvailablePlayers={setAvailablePlayers}
                  setSearchTerms={setSearchTerms}
                  setTeamBudgets={setTeamBudgets}
                  isDraftFinished={isDraftFinished}
                  isDraftComplete={isDraftComplete}
                  finishDraft={finishDraft}
                  selectedPlayer={selectedPlayer}
                  setSelectedPlayer={setSelectedPlayer}
                />
              </TabItem>
              <TabItem active={activeTab === 1} title="Teams" icon={HiUserCircle}>
                {isLoading ? (
                  <div className="flex h-32 items-center justify-center text-gray-500">
                    Loading player scores...
                  </div>
                ) : (
                  <TeamsView
                    key={`teams-view-${activeSubTab}`} // Add a key prop to force remounting
                    teams={teams}
                    draftPicks={draftPicks}
                    isDraftFinished={isDraftFinished}
                    playerScores={playerScores}
                    setPlayerScores={setPlayerScores}
                    initialActiveRound={activeSubTab}
                    onRoundChange={handleRoundChange}
                  />
                )}
              </TabItem>
              <TabItem active={activeTab === 2} title="Scores" icon={MdScoreboard}>
                {isDraftFinished ? (
                  isLoading ? (
                    <div className="flex h-32 items-center justify-center text-gray-500">
                      Loading scores...
                    </div>
                  ) : (
                    <ScoresTab
                      teams={teams}
                      draftPicks={draftPicks}
                      playerScores={playerScores}
                    />
                  )
                ) : (
                  <div className="flex h-32 items-center justify-center text-gray-500">
                    Complete draft first
                  </div>
                )}
              </TabItem>
            </Tabs>
          </div>
        </div>
      </main>
    </Flowbite>
  );
}