"use client";

import { Flowbite } from "flowbite-react";
import DraftTable from "./DraftTable";
import { DraftPicks, Player, Team } from "../types";
import PositionLegend from "./PositionLegend";
import AvailablePlayers from "./AvailablePlayers";
import SelectedPlayerTable from "./SelectedPlayerTable";
import { useState } from "react";

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
}: DraftBoardProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  return (
    <Flowbite>
      <main className="min-h-screen bg-gray-50 p-4">
        {/* Draft Board Section */}
        <div className="mb-1">
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl text-gray-900">Draft Board</h1>
          </div>
          <div className="mb-4">
            <DraftTable
              teams={teams}
              picks={picks}
              availablePlayers={availablePlayers}
              draftPicks={draftPicks}
              searchTerms={searchTerms}
              setDraftPicks={(newPicks) => {
                setDraftPicks(newPicks);
                setSelectedPlayer(null); // Reset selected player when draft picks change
              }}
              setAvailablePlayers={setAvailablePlayers}
              setSearchTerms={setSearchTerms}
            />
          </div>
        </div>

        {/* Two Columns: Selected Player Table and Available Players */}
        <div className="flex max-w-full flex-col gap-4 lg:flex-row">
          {/* Left Column: Selected Player Table */}
          <div className="w-full min-w-[200px] lg:w-1/3">
            <SelectedPlayerTable
              availablePlayers={availablePlayers}
              selectedPlayer={selectedPlayer}
              setSelectedPlayer={setSelectedPlayer}
            />
          </div>
          {/* Right Column: Available Players */}
          <div className="w-full min-w-0 lg:w-fit">
            <AvailablePlayers availablePlayers={availablePlayers} />
          </div>
          <div className="shrink-0">
            <PositionLegend />
          </div>
        </div>
      </main>
    </Flowbite>
  );
}