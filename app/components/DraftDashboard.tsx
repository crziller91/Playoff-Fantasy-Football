import { Button } from "flowbite-react";
import DraftTable from "./DraftTable";
import { DraftPicks, Player, Team } from "../types";
import PositionLegend from "./PositionLegend";
import AvailablePlayers from "./AvailablePlayers";
import SelectedPlayerTable from "./SelectedPlayerTable";

interface DraftDashboardProps {
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
    isDraftComplete: boolean;
    finishDraft: () => void;
    selectedPlayer: Player | null;
    setSelectedPlayer: (player: Player | null) => void;
}

export default function DraftDashboard({
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
    isDraftComplete,
    finishDraft,
    selectedPlayer,
    setSelectedPlayer,
}: DraftDashboardProps) {
    return (
        <>
            <div className="mb-4">
                <DraftTable
                    teams={teams}
                    picks={picks}
                    availablePlayers={availablePlayers}
                    draftPicks={draftPicks}
                    searchTerms={searchTerms}
                    teamBudgets={teamBudgets}
                    setDraftPicks={(newPicks) => {
                        setDraftPicks(newPicks);
                        setSelectedPlayer(null);
                    }}
                    setAvailablePlayers={setAvailablePlayers}
                    setSearchTerms={setSearchTerms}
                    setTeamBudgets={setTeamBudgets}
                    isDraftFinished={isDraftFinished}
                />
            </div>
            <div className="flex max-w-full flex-col gap-4 lg:flex-row">
                {!isDraftFinished && (
                    <>
                        <div className="w-full min-w-[200px] lg:w-fit">
                            <SelectedPlayerTable
                                availablePlayers={availablePlayers}
                                selectedPlayer={selectedPlayer}
                                setSelectedPlayer={setSelectedPlayer}
                            />
                        </div>
                        <div className="w-full min-w-0 lg:flex-1">
                            <AvailablePlayers availablePlayers={availablePlayers} />
                        </div>
                    </>
                )}
                <div className="shrink-0 lg:w-auto">
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
        </>
    );
}