"use client";

import { Flowbite, TabItem, Tabs } from "flowbite-react";
import { DraftPicks, Player, Team } from "../types";
import { useState, useMemo } from "react";
import { HiUserCircle } from "react-icons/hi";
import { MdDashboard } from "react-icons/md";
import DraftDashboard from "./DraftDashboard";
import TeamsView from "./TeamsView";
import { MdScoreboard } from "react-icons/md";


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
  onResetBoard,
  isDraftFinished,
  finishDraft,
}: DraftBoardProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

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
                  setDraftPicks={setDraftPicks}
                  setAvailablePlayers={setAvailablePlayers}
                  setSearchTerms={setSearchTerms}
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
                />
              </TabItem>
              <TabItem title="Scores" icon={MdScoreboard}>
              {isDraftFinished ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    Test
                  </div>
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