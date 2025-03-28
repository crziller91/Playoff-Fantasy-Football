"use client";

import { Table } from "flowbite-react";
import { useState } from "react";
import { DraftPicks, Player, Team } from "../types";
import TeamHeader from "./TeamHeader";
import PlayerDropdown from "./PlayerDropdown";
import { canSelectPlayer } from "../utils/draftUtils";

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

  // Function to save draft picks or delete them when a player is removed
  const saveDraftPickQueue = async (teamName: string, round: number, playerId: number | null) => {
    try {
      console.log(`${playerId ? "Saving" : "Deleting"} draft pick for ${teamName}, round ${round}`);

      const response = await fetch('/api/draftpicks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamName,
          round,
          playerId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Error managing draft pick:', data);
      } else {
        const result = await response.json();
        console.log('Draft pick operation result:', result);
      }
    } catch (error) {
      console.error('Error in draft pick operation:', error);
    }
  };

  const handlePlayerSelect = async (team: Team, pick: number, player: Player) => {
    if (canSelectPlayer(team, draftPicks, picks.length)) {
      const sanitizedKey = `${team}-${pick}`.replace(/[^a-zA-Z0-9-]/g, "-");

      // Update local state immediately
      setDraftPicks({
        ...draftPicks,
        [team]: { ...draftPicks[team], [pick]: player },
      });
      setAvailablePlayers(availablePlayers.filter((p) => p.id !== player.id));
      setSearchTerms({ ...searchTerms, [sanitizedKey]: "" });
      setOpenDropdown(null);

      // Save to database in background without updating UI
      await saveDraftPickQueue(team, pick, player.id);
    }
  };

  const handleRemovePick = async (team: Team, pick: number) => {
    const removedPlayer = draftPicks[team][pick];
    if (removedPlayer) {
      // Update local state immediately
      setDraftPicks({
        ...draftPicks,
        [team]: { ...draftPicks[team], [pick]: null },
      });
      setAvailablePlayers(
        [...availablePlayers, removedPlayer].sort((a, b) => a.id - b.id),
      );
      setOpenDropdown(null);

      // Send null playerId to API to completely delete the pick
      await saveDraftPickQueue(team, pick, null);
    }
  };

  const handleSearchChange = (team: Team, pick: number, value: string) => {
    const sanitizedKey = `${team}-${pick}`.replace(/[^a-zA-Z0-9-]/g, "-");
    setSearchTerms({ ...searchTerms, [sanitizedKey]: value });
  };

  // Helper to count positions for a team
  const getTeamPositionCounts = (team: Team) => {
    const picks = Object.values(draftPicks[team]).filter(Boolean) as Player[];
    return {
      QB: picks.filter((p) => p.position === "QB").length,
      RB: picks.filter((p) => p.position === "RB").length,
      WR: picks.filter((p) => p.position === "WR").length,
      TE: picks.filter((p) => p.position === "TE").length,
      DST: picks.filter((p) => p.position === "DST").length,
      K: picks.filter((p) => p.position === "K").length,
    };
  };

  const getFilteredPlayers = (team: Team, pick: number): Player[] => {
    const sanitizedKey = `${team}-${pick}`.replace(/[^a-zA-Z0-9-]/g, "-");
    const searchTerm = searchTerms[sanitizedKey] || "";
    const counts = getTeamPositionCounts(team);
    const hasTE = counts.TE > 0;
    const hasDST = counts.DST > 0;
    const hasFlexOccupiedByTEorDST = hasTE || hasDST;
    const hasFlexOccupiedByExtra =
      (counts.RB > 1 && !hasTE && !hasDST) ||
      (counts.WR > 2 && !hasTE && !hasDST) ||
      (counts.K > 1 && !hasTE && !hasDST);
    const hasFlex = hasFlexOccupiedByTEorDST || hasFlexOccupiedByExtra;

    // Base caps
    const caps = {
      QB: 1,
      RB: hasFlex ? 1 : 2,
      WR: hasFlex ? 2 : 3,
      TE: 1,
      DST: 1,
      K: hasFlex ? 1 : 2,
    };

    return availablePlayers
      .filter((player) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .filter((player) => {
        if (!canSelectPlayer(team, draftPicks, picks.length)) return false;

        const pos = player.position;
        const count = counts[pos];

        if (pos === "QB" && count >= caps.QB) return false;

        if (
          pos === "TE" &&
          (count >= caps.TE || hasDST || hasFlexOccupiedByExtra)
        )
          return false;
        if (
          pos === "DST" &&
          (count >= caps.DST || hasTE || hasFlexOccupiedByExtra)
        )
          return false;

        if (hasFlex) {
          return count < caps[pos];
        }

        return count < caps[pos];
      });
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-lg shadow-lg">
        <Table
          hoverable
          className="w-full table-fixed bg-white"
          style={{ minWidth: `${teams.length * 192 + 80}px` }}
        >
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
                  const sanitizedKey = `${team}-${pick}`.replace(
                    /[^a-zA-Z0-9-]/g,
                    "-",
                  );
                  return (
                    <Table.Cell key={sanitizedKey} className="relative p-1">
                      <PlayerDropdown
                        team={team}
                        pick={pick}
                        selectedPlayer={draftPicks[team][pick]}
                        searchTerm={searchTerms[sanitizedKey] || ""}
                        isOpen={openDropdown === sanitizedKey}
                        filteredPlayers={getFilteredPlayers(team, pick)}
                        onToggle={setOpenDropdown}
                        onSearchChange={(value) =>
                          handleSearchChange(team, pick, value)
                        }
                        onPlayerSelect={(player) =>
                          handlePlayerSelect(team, pick, player)
                        }
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
