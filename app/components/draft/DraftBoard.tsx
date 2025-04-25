"use client";

import { observer } from "mobx-react-lite";
import { Flowbite, TabItem, Tabs, type TabsRef } from "flowbite-react";
import { useState, useRef, useEffect } from "react";
import { HiUserCircle } from "react-icons/hi";
import { MdDashboard, MdScoreboard } from "react-icons/md";
import { useStore } from "../../stores/StoreContext";
import DraftDashboard from "./DraftDashboard";
import TeamsView from "../teams/TeamsView";
import ScoresTab from "../scores/ScoresTab";
import { useRouter, useSearchParams } from "next/navigation";
import { PLAYOFF_ROUNDS } from "../../constants/playoffs";
import { DraftManager } from "../../domain/DraftManager";

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

const DraftBoard = observer(() => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabsRef = useRef<TabsRef>(null);

  const { draftStore, teamsStore, playersStore, scoresStore } = useStore();

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

  useEffect(() => {
    if (draftStore.isDraftFinished && !scoresStore.scoresLoaded) {
      scoresStore.loadPlayerScores();
    }
  }, [draftStore.isDraftFinished, scoresStore]);

  // Set the active round in the scores store based on URL parameters
  useEffect(() => {
    if (subtabParam && subtabParam in URL_PARAM_TO_ROUND) {
      const roundName = URL_PARAM_TO_ROUND[subtabParam];
      if (PLAYOFF_ROUNDS.includes(roundName)) {
        scoresStore.setActiveRound(roundName);
      }
    }
  }, [subtabParam, scoresStore]);

  // Update URL when tabs change
  useEffect(() => {
    const currentTab = TAB_NAMES[activeTab];

    // Only include subtab param for teams tab
    if (currentTab === "teams") {
      // Convert display name to URL parameter
      const subtabParam = ROUND_TO_URL_PARAM[scoresStore.activeRound] || "wildCard";
      router.push(`?tab=${currentTab}&subtab=${subtabParam}`);
    } else {
      router.push(`?tab=${currentTab}`);
    }
  }, [activeTab, scoresStore.activeRound, router]);

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
    }
  }, [tabParam]);

  // Handle tab change
  const handleTabChange = (tab: number) => {
    setActiveTab(tab);
  };

  // Handle round change from TeamsView
  const handleRoundChange = (round: string) => {
    scoresStore.setActiveRound(round);
  };

  // Determine if draft is complete (all teams have made all picks)
  const isDraftComplete = playersStore.draftPicks &&
    teamsStore.teams.every((team) =>
      DraftManager.PICKS.every((pick) =>
        playersStore.draftPicks[team]?.[pick] !== null &&
        playersStore.draftPicks[team]?.[pick] !== undefined
      )
    );

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
                <DraftDashboard isDraftComplete={isDraftComplete} />
              </TabItem>
              <TabItem active={activeTab === 1} title="Teams" icon={HiUserCircle}>
                {scoresStore.isLoading ? (
                  <div className="flex h-32 items-center justify-center text-gray-500">
                    Loading player scores...
                  </div>
                ) : (
                  <TeamsView
                    key={`teams-view-${draftStore.isDraftFinished ? 'active' : 'inactive'}`}
                    initialActiveRound={scoresStore.activeRound}
                    onRoundChange={handleRoundChange}
                  />
                )}
              </TabItem>
              <TabItem active={activeTab === 2} title="Scores" icon={MdScoreboard}>
                {draftStore.isDraftFinished ? (
                  scoresStore.isLoading ? (
                    <div className="flex h-32 items-center justify-center text-gray-500">
                      Loading scores...
                    </div>
                  ) : (
                    <ScoresTab />
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
});

export default DraftBoard;