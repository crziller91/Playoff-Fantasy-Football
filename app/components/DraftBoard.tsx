"use client";

import { Flowbite, Button, TabItem, Tabs, Table } from "flowbite-react";
import DraftTable from "./DraftTable";
import { DraftPicks, Player, Team } from "../types";
import PositionLegend from "./PositionLegend";
import AvailablePlayers from "./AvailablePlayers";
import SelectedPlayerTable from "./SelectedPlayerTable";
import { useState, useMemo } from "react";
import { HiUserCircle } from "react-icons/hi";
import { MdDashboard } from "react-icons/md";

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

  const getOrderedTeamPicks = (team: Team) => {
    const positionOrder = ["QB", "RB", "WR", "TE", "DST", "K"];
    const teamPicks = Object.entries(draftPicks[team] || {})
      .filter(([_, player]) => player !== null)
      .map(([pick, player]) => ({ pick: Number(pick), player: player as Player }));

    return teamPicks.sort((a, b) => {
      const posA = positionOrder.indexOf(a.player.position);
      const posB = positionOrder.indexOf(b.player.position);
      if (posA !== posB) return posA - posB;
      return a.pick - b.pick;
    });
  };

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
                {isDraftComplete && !isDraftFinished && (
                  <div className="mt-4 flex justify-center">
                    <Button color="success" onClick={finishDraft}>
                      Finish Draft
                    </Button>
                  </div>
                )}
              </TabItem>
              <TabItem title="Teams" icon={HiUserCircle}>
                {isDraftFinished ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {teams.map((team) => (
                      <div key={team} className="w-full">
                        <div className="overflow-x-auto rounded-lg shadow-lg">
                          <Table className="w-full bg-white">
                            <Table.Head>
                              <Table.HeadCell className="bg-blue-600 p-2 text-center text-sm text-white">
                                {team}
                              </Table.HeadCell>
                            </Table.Head>
                            <Table.Body className="divide-y">
                              {getOrderedTeamPicks(team).map(({ pick, player }) => (
                                <Table.Row key={pick}>
                                  <Table.Cell className="p-2 text-center text-sm">
                                    {player.name} ({player.position})
                                  </Table.Cell>
                                </Table.Row>
                              ))}
                            </Table.Body>
                          </Table>
                        </div>
                      </div>
                    ))}
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