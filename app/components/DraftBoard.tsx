"use client";

import { Flowbite, Button } from "flowbite-react";
import DraftTable from "./DraftTable";
import { DraftPicks, Player, Team } from "../types";
import PositionLegend from "./PositionLegend";
import AvailablePlayers from "./AvailablePlayers";
import SelectedPlayerTable from "./SelectedPlayerTable";
import { useState, useMemo } from "react";

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
          <div className="mb-4 flex items-center justify-between">
            <h1 className="text-xl text-gray-900">Draft Board</h1>
            {isDraftComplete && !isDraftFinished && (
              <Button color="success" onClick={finishDraft}>
                Finish Draft
              </Button>
            )}
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
                setSelectedPlayer(null);
              }}
              setAvailablePlayers={setAvailablePlayers}
              setSearchTerms={setSearchTerms}
              isDraftFinished={isDraftFinished}
            />
          </div>
        </div>
        <div className="flex max-w-full flex-col gap-4 lg:flex-row">
          {!isDraftFinished && (
            <>
              <div className="w-full min-w-[200px] lg:w-1/3">
                <SelectedPlayerTable
                  availablePlayers={availablePlayers}
                  selectedPlayer={selectedPlayer}
                  setSelectedPlayer={setSelectedPlayer}
                />
              </div>
              <div className="w-full min-w-0 lg:w-fit">
                <AvailablePlayers availablePlayers={availablePlayers} />
              </div>
            </>
          )}
          <div className="shrink-0">
            <PositionLegend />
          </div>
        </div>
      </main>
    </Flowbite>
  );
}