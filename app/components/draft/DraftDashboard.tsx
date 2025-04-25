import { observer } from "mobx-react-lite";
import { Button } from "flowbite-react";
import { useStore } from "../../stores/StoreContext";
import DraftTable from "./DraftTable";
import PositionLegend from "./PositionLegend";
import AvailablePlayers from "./AvailablePlayers";
import SelectedPlayerTable from "../players/SelectedPlayerTable";

interface DraftDashboardProps {
    isDraftComplete: boolean;
}

const DraftDashboard = observer(({ isDraftComplete }: DraftDashboardProps) => {
    const { draftStore, teamsStore, playersStore } = useStore();

    return (
        <>
            <div className="mb-4">
                <DraftTable />
            </div>
            <div className="flex max-w-full flex-col gap-4 lg:flex-row">
                {!draftStore.isDraftFinished && (
                    <>
                        <div className="w-full min-w-[200px] lg:w-fit">
                            <SelectedPlayerTable />
                        </div>
                        <div className="w-full min-w-0 lg:flex-1">
                            <AvailablePlayers />
                        </div>
                    </>
                )}
                <div className="shrink-0 lg:w-auto">
                    <PositionLegend />
                </div>
            </div>
            {isDraftComplete && !draftStore.isDraftFinished && (
                <div className="mt-4 flex justify-center">
                    <Button color="success" onClick={draftStore.finishDraft}>
                        Finish Draft
                    </Button>
                </div>
            )}
        </>
    );
});

export default DraftDashboard;