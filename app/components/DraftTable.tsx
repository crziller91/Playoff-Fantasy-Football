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

  const getFilteredPlayers = (team: Team, round: number): Player[] => {
    const sanitizedKey = `${team}-${round}`.replace(/[^a-zA-Z0-9-]/g, "-");
    const searchTerm = searchTerms[sanitizedKey] || "";
    return availablePlayers
      .filter((player) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )
      .filter(() => canSelectPlayer(team, draftPicks, rounds.length));
  };

  return (
    <div className="w-full">
      {/* Main Draft Table with styling */}
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
      {/* Legend Table */}
      <div className="mt-4">
        <PositionLegend />
      </div>
    </div>
  );
}
