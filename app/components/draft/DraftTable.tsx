"use client";

import { Table } from "flowbite-react";
import { useState } from "react";
import { DraftPicks, Player, Team } from "../../types";
import TeamHeader from "../layout/TeamHeader";
import PlayerDropdown from "../players/PlayerDropdown";
import { DraftManager } from "../../domain/DraftManager";
import { saveDraftPick } from "../../services/draftService";
import BudgetModal from "../modals/BudgetModal";

interface DraftTableProps {
  teams: Team[];
  picks: number[];
  availablePlayers: Player[];
  draftPicks: DraftPicks;
  searchTerms: { [key: string]: string };
  teamBudgets: Map<string, number>;
  setDraftPicks: (picks: DraftPicks) => void;
  setAvailablePlayers: (players: Player[]) => void;
  setSearchTerms: (terms: { [key: string]: string }) => void;
  setTeamBudgets: (budgets: Map<string, number>) => void;
  isDraftFinished: boolean;
}

export default function DraftTable({
  teams,
  picks,
  availablePlayers,
  draftPicks,
  searchTerms,
  teamBudgets,
  setDraftPicks,
  setAvailablePlayers,
  setSearchTerms,
  setTeamBudgets,
  isDraftFinished,
}: DraftTableProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<string>("");
  const [currentPick, setCurrentPick] = useState<number>(0);
  const [selectedPlayerForBudget, setSelectedPlayerForBudget] = useState<Player | null>(null);
  const [budgetError, setBudgetError] = useState<string>("");

  const handlePlayerSelect = (team: Team, pick: number, player: Player) => {
    if (DraftManager.canSelectPlayer(team, draftPicks, picks.length)) {
      // Close the dropdown immediately
      setOpenDropdown(null);

      // Reset any previous budget errors
      setBudgetError("");

      // Then open the budget modal
      setCurrentTeam(team);
      setCurrentPick(pick);
      setSelectedPlayerForBudget(player);
      setBudgetModalOpen(true);
    }
  };

  const handleBudgetConfirm = async (cost: number) => {
    if (!selectedPlayerForBudget) return;

    try {
      const team = currentTeam;
      const pick = currentPick;
      const player = selectedPlayerForBudget;

      // Check if team has enough budget
      const currentBudget = teamBudgets.get(team) || 0;
      if (cost > currentBudget) {
        // Set budget error to display in the modal
        setBudgetError(`Insufficient budget! ${team} only has $${currentBudget} remaining.`);
        return;
      }

      const sanitizedKey = `${team}-${pick}`.replace(/[^a-zA-Z0-9-]/g, "-");

      // Update UI state
      setDraftPicks({ ...draftPicks, [team]: { ...draftPicks[team], [pick]: player } });
      setAvailablePlayers(availablePlayers.filter((p) => p.id !== player.id));
      setSearchTerms({ ...searchTerms, [sanitizedKey]: "" });

      // Update budget in UI
      const newBudgets = new Map(teamBudgets);
      newBudgets.set(team, currentBudget - cost);
      setTeamBudgets(newBudgets);

      // Save to backend
      await saveDraftPick(team, pick, player.id, cost);

      // Close dropdowns and modal
      setOpenDropdown(null);
      setBudgetModalOpen(false);
      setSelectedPlayerForBudget(null);
      setBudgetError("");
    } catch (err) {
      // Show error in the modal
      setBudgetError(err instanceof Error ? err.message : "Failed to save draft pick");
      console.error("Error saving draft pick:", err);
    }
  };

  const handleBudgetCancel = () => {
    setBudgetModalOpen(false);
    setSelectedPlayerForBudget(null);
    setBudgetError("");
  };

  const handleRemovePick = async (team: Team, pick: number) => {
    const removedPlayer = draftPicks[team]?.[pick];
    if (removedPlayer) {
      setDraftPicks({ ...draftPicks, [team]: { ...draftPicks[team], [pick]: null } });
      setAvailablePlayers([...availablePlayers, removedPlayer].sort((a, b) => a.id - b.id));
      setOpenDropdown(null);

      try {
        // Remove the pick and refund the cost
        await saveDraftPick(team, pick, null);

        // Fetch updated team budgets (the API will handle refunding)
        const response = await fetch("/api/teams");
        if (response.ok) {
          const teamsData = await response.json();
          const budgetMap = new Map<string, number>();
          teamsData.forEach((t: any) => {
            budgetMap.set(t.name, t.budget);
          });
          setTeamBudgets(budgetMap);
        }
      } catch (err) {
        console.error("Error removing draft pick:", err);
        alert("Failed to remove draft pick. Please try again.");
      }
    }
  };

  const handleSearchChange = (team: Team, pick: number, value: string) => {
    const sanitizedKey = `${team}-${pick}`.replace(/[^a-zA-Z0-9-]/g, "-");
    setSearchTerms({ ...searchTerms, [sanitizedKey]: value });
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-lg shadow-xl">
        <Table hoverable className="w-full table-fixed bg-white" style={{ minWidth: `${teams.length * 192 + 80}px` }}>
          <Table.Head>
            <TeamHeader teams={teams} teamBudgets={teamBudgets} />
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
                        selectedPlayer={draftPicks[team]?.[pick] || null}
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
                        isDraftFinished={isDraftFinished}
                      />
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* Budget Modal */}
      <BudgetModal
        isOpen={budgetModalOpen}
        onClose={handleBudgetCancel}
        player={selectedPlayerForBudget}
        team={currentTeam}
        onConfirm={handleBudgetConfirm}
        budgetError={budgetError}
      />
    </div>
  );
}