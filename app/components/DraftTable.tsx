"use client";

import { Table } from "flowbite-react";
import { useState } from "react";
import { DraftPicks, Player, Team } from "../types";
import TeamHeader from "./TeamHeader";
import PlayerDropdown from "./PlayerDropdown";
import PositionLegend from "./PositionLegend";
import { canSelectPlayer } from "../utils/draftUtils";

interface DraftTableProps {
  teams: Team[];
  rounds: number[];
  availablePlayers: Player[];
  draftPicks: DraftPicks;
  searchTerms: { [key: string]: string };
  setDraftPicks: (picks: DraftPicks) => void;
  setAvailablePlayers: (players: Player[]) => void;
  setSearchTerms: (terms: { [key: string]: string }) => void;
}

export default function DraftTable({
  teams,
  rounds,
  availablePlayers,
  draftPicks,
  searchTerms,
  setDraftPicks,
  setAvailablePlayers,
  setSearchTerms,
}: DraftTableProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handlePlayerSelect = (team: Team, round: number, player: Player) => {
    if (canSelectPlayer(team, draftPicks, rounds.length)) {
      const sanitizedKey = `${team}-${round}`.replace(/[^a-zA-Z0-9-]/g, "-");
      setDraftPicks({
        ...draftPicks,
        [team]: { ...draftPicks[team], [round]: player },
      });
      setAvailablePlayers(availablePlayers.filter((p) => p.id !== player.id));
      setSearchTerms({ ...searchTerms, [sanitizedKey]: "" });
      setOpenDropdown(null);
    }
  };

  const handleRemovePick = (team: Team, round: number) => {
    const removedPlayer = draftPicks[team][round];
    if (removedPlayer) {
      setDraftPicks({
        ...draftPicks,
        [team]: { ...draftPicks[team], [round]: null },
      });
      setAvailablePlayers(
        [...availablePlayers, removedPlayer].sort((a, b) => a.id - b.id),
      );
    }
    setOpenDropdown(null);
  };

  const handleSearchChange = (team: Team, round: number, value: string) => {
    const sanitizedKey = `${team}-${round}`.replace(/[^a-zA-Z0-9-]/g, "-");
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

  const getFilteredPlayers = (team: Team, round: number): Player[] => {
    const sanitizedKey = `${team}-${round}`.replace(/[^a-zA-Z0-9-]/g, "-");
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
      RB: hasFlex ? 1 : 2, // Flex allows 2 RB if not occupied
      WR: hasFlex ? 2 : 3, // Flex allows 3 WR if not occupied
      TE: 1,
      DST: 1,
      K: hasFlex ? 1 : 2, // Flex allows 2 K if not occupied
    };

    return availablePlayers
      .filter((player) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .filter((player) => {
        if (!canSelectPlayer(team, draftPicks, rounds.length)) return false;

        const pos = player.position;
        const count = counts[pos];

        // QB: strict 1 max
        if (pos === "QB" && count >= caps.QB) return false;

        // TE and DST are mutually exclusive and can only occupy Flex
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

        // If Flex is occupied (by TE, DST, or extra RB/WR/K), enforce base caps
        if (hasFlex) {
          return count < caps[pos];
        }

        // Flex is still available, allow up to cap
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
            {rounds.map((round) => (
              <Table.Row key={round}>
                <Table.Cell className="w-20 shrink-0 px-4 text-center font-medium text-gray-900">
                  Round {round}
                </Table.Cell>
                {teams.map((team) => {
                  const sanitizedKey = `${team}-${round}`.replace(
                    /[^a-zA-Z0-9-]/g,
                    "-",
                  );
                  return (
                    <Table.Cell key={sanitizedKey} className="relative p-1">
                      <PlayerDropdown
                        team={team}
                        round={round}
                        selectedPlayer={draftPicks[team][round]}
                        searchTerm={searchTerms[sanitizedKey] || ""}
                        isOpen={openDropdown === sanitizedKey}
                        filteredPlayers={getFilteredPlayers(team, round)}
                        onToggle={setOpenDropdown}
                        onSearchChange={(value) =>
                          handleSearchChange(team, round, value)
                        }
                        onPlayerSelect={(player) =>
                          handlePlayerSelect(team, round, player)
                        }
                        onRemovePick={() => handleRemovePick(team, round)}
                      />
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
      <div className="mt-4">
        <PositionLegend />
      </div>
    </div>
  );
}
