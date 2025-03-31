"use client";

import { Flowbite } from "flowbite-react";
import DraftTable from "./DraftTable";
import { DraftPicks, Player, Team } from "../types";
import { initializeDraftPicks } from "../utils/draftUtils";
import PositionLegend from "./PositionLegend";
import AvailablePlayers from "./AvailablePlayers";

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
  searchTerms,
  setSearchTerms,
}: DraftBoardProps) {
  return (
    <Flowbite>
      <main className="min-h-screen p-4">
        <div className="mb-4 flex items-start justify-between">
          <div className="w-[85.7%]">
            <AvailablePlayers availablePlayers={availablePlayers} />
          </div>
          <PositionLegend />
        </div>
        <div className="draft-table-container">
          <DraftTable
            teams={teams}
            picks={picks}
            availablePlayers={availablePlayers}
            draftPicks={draftPicks}
            searchTerms={searchTerms}
            setDraftPicks={setDraftPicks}
            setAvailablePlayers={setAvailablePlayers}
            setSearchTerms={setSearchTerms}
          />
        </div>
      </main>
    </Flowbite>
  );
}