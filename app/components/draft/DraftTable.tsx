"use client";

import { observer } from "mobx-react-lite";
import { Table } from "flowbite-react";
import { useState } from "react";
import { Player, Team } from "../../types";
import TeamHeader from "../layout/TeamHeader";
import PlayerDropdown from "../players/PlayerDropdown";
import { DraftManager } from "../../domain/DraftManager";
import BudgetModal from "../modals/BudgetModal";
import { useStore } from "../../stores/StoreContext";

const DraftTable = observer(() => {
  const { draftStore, teamsStore, playersStore } = useStore();
  const { teams } = teamsStore;
  const { teamBudgets } = teamsStore;
  const { availablePlayers, draftPicks, selectedPlayer, selectPlayerForTeam, removePlayerFromTeam } = playersStore;
  const { isDraftFinished, searchTerms, setSearchTerms } = draftStore;

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [currentTeam, setCurrentTeam] = useState<string>("");
  const [currentPick, setCurrentPick] = useState<number>(0);
  const [selectedPlayerForBudget, setSelectedPlayerForBudget] = useState<Player | null>(null);
  const [budgetError, setBudgetError] = useState<string>("");

  const picks = DraftManager.PICKS; // Use the picks from DraftManager

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
      // Check if team has enough budget
      const currentBudget = teamBudgets.get(currentTeam) || 0;
      if (cost > currentBudget) {
        // Set budget error to display in the modal
        setBudgetError(`Insufficient budget! ${currentTeam} only has $${currentBudget} remaining.`);
        return;
      }

      const success = await selectPlayerForTeam(currentTeam, currentPick, selectedPlayerForBudget, cost);

      if (success) {
        // Close dropdowns and modal
        setOpenDropdown(null);
        setBudgetModalOpen(false);
        setSelectedPlayerForBudget(null);
        setBudgetError("");
      }
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
    await removePlayerFromTeam(team, pick);
    setOpenDropdown(null);
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
            <TeamHeader />
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
});

export default DraftTable;