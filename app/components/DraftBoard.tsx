"use client";

import { Flowbite, TabItem, Tabs } from "flowbite-react";
import { DraftPicks, Player, Team, PlayerScoresByRound } from "../types";
import { useState, useMemo } from "react";
import { HiUserCircle } from "react-icons/hi";
import { MdDashboard } from "react-icons/md";
import DraftDashboard from "./DraftDashboard";
import TeamsView, { PLAYOFF_ROUNDS } from "./TeamsView";
import { MdScoreboard } from "react-icons/md";
import ScoresTab from "./ScoresTab";

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
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  
  // Initialize playerScores state with all playoff rounds
  const [playerScores, setPlayerScores] = useState<PlayerScoresByRound>({
    "Wild Card": {},
    "Divisional": {},
    "Conference": {},
    "Superbowl": {}
  });

  // Check if all dropdowns are filled
  const isDraftComplete = useMemo(() => {
    return teams.every((team) =>
      picks.every((pick) => draftPicks[team]?.[pick] !== null && draftPicks[team]?.[pick] !== undefined)
    );
  }, [teams, picks, draftPicks]);

  const handleReset = () => {
    onResetBoard();
  };

  return (
    <Flowbite>
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mb-1">
          <div className="mb-4">
            <Tabs aria-label="Default tabs" variant="default">
              <TabItem active title="Draft Board" icon={MdDashboard}>
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
              <TabItem title="Teams" icon={HiUserCircle}>
                <TeamsView
                  teams={teams}
                  draftPicks={draftPicks}
                  isDraftFinished={isDraftFinished}
                  playerScores={playerScores}
                  setPlayerScores={setPlayerScores}
                />
              </TabItem>
              <TabItem title="Scores" icon={MdScoreboard}>
              {isDraftFinished ? (
                  <ScoresTab
                    teams={teams}
                    draftPicks={draftPicks}
                    playerScores={playerScores}
                  />
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