"use client";

import { Table } from "flowbite-react";
import { useState } from "react";
import { DraftPicks, Player, Team } from "../types";
import TeamHeader from "./TeamHeader";
import PlayerDropdown from "./PlayerDropdown";
import { DraftManager } from "../domain/DraftManager";
import { saveDraftPick } from "../services/draftService";

interface DraftTableProps {
  teams: Team[];
  picks: number[];
  availablePlayers: Player[];
  draftPicks: DraftPicks;
  searchTerms: { [key: string]: string };
  setDraftPicks: (picks: DraftPicks) => void;
  setAvailablePlayers: (players: Player[]) => void;
  setSearchTerms: (terms: { [key: string]: string }) => void;
}

export default function DraftTable({
  teams,
  picks,
  availablePlayers,
  draftPicks,
  searchTerms,
  setDraftPicks,
  setAvailablePlayers,
  setSearchTerms,
}: DraftTableProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handlePlayerSelect = async (team: Team, pick: number, player: Player) => {
    if (DraftManager.canSelectPlayer(team, draftPicks, picks.length)) {
      const sanitizedKey = `${team}-${pick}`.replace(/[^a-zA-Z0-9-]/g, "-");
      setDraftPicks({ ...draftPicks, [team]: { ...draftPicks[team], [pick]: player } });
      setAvailablePlayers(availablePlayers.filter((p) => p.id !== player.id));
      setSearchTerms({ ...searchTerms, [sanitizedKey]: "" });
      setOpenDropdown(null);
      await saveDraftPick(team, pick, player.id);
    }
  };

  const handleRemovePick = async (team: Team, pick: number) => {
    const removedPlayer = draftPicks[team]?.[pick];
    if (removedPlayer) {
      setDraftPicks({ ...draftPicks, [team]: { ...draftPicks[team], [pick]: null } });
      setAvailablePlayers([...availablePlayers, removedPlayer].sort((a, b) => a.id - b.id));
      setOpenDropdown(null);
      await saveDraftPick(team, pick, null);
    }
  };

  const handleSearchChange = (team: Team, pick: number, value: string) => {
    const sanitizedKey = `${team}-${pick}`.replace(/[^a-zA-Z0-9-]/g, "-");
    setSearchTerms({ ...searchTerms, [sanitizedKey]: value });
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-lg shadow-lg">
        <Table hoverable className="w-full table-fixed bg-white" style={{ minWidth: `${teams.length * 192 + 80}px` }}>
          <Table.Head>
            <TeamHeader teams={teams} />
          </Table.Head>
          <Table.Body className="divide-y">
            {picks.map((pick) => (
              <Table.Row key={pick}>
                <Table.Cell className="w-20 shrink-0 px-4 text-center font-medium text-gray-900">
                  Pick <br /> {pick}
                </Table.Cell>
                {teams.map((team) => {
                  const sanitizedKey = `${team}-${pick}`.replace(/[^a-zA-Z0-9-]/g, "-");
                  return (
                    <Table.Cell key={sanitizedKey} className="relative p-1">
                      <PlayerDropdown
                        team={team}
                        pick={pick}
                        selectedPlayer={draftPicks[team]?.[pick] || null} // Guard against undefined
                        searchTerm={searchTerms[sanitizedKey] || ""}
                        isOpen={openDropdown === sanitizedKey}
                        filteredPlayers={DraftManager.filterPlayers(
                          availablePlayers,
                          team,
                          draftPicks,
                          searchTerms[sanitizedKey] || ""
                        )}
                        onToggle={setOpenDropdown}
                        onSearchChange={(value) => handleSearchChange(team, pick, value)}
                        onPlayerSelect={(player) => handlePlayerSelect(team, pick, player)}
                        onRemovePick={() => handleRemovePick(team, pick)}
                      />
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
    </div>
  );
}