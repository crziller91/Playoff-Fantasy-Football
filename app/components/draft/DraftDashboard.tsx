import { observer } from "mobx-react-lite";
import { Button } from "flowbite-react";
import { useStore } from "../../stores/StoreContext";
import DraftTable from "./DraftTable";
import PositionLegend from "./PositionLegend";
import AvailablePlayers from "./AvailablePlayers";
import SelectedPlayerTable from "../players/SelectedPlayerTable";
import { usePermissions } from "../../hooks/usePermissions"; // Import the permission hook
import { useSession } from "next-auth/react"; // Import useSession

interface DraftDashboardProps {
    isDraftComplete: boolean;
}

const DraftDashboard = observer(({ isDraftComplete }: DraftDashboardProps) => {
    const { draftStore } = useStore();
    const { canEditScores, isAdmin } = usePermissions(); // Get permissions
    const { status } = useSession(); // Get auth status

    // User can edit if they have edit scores permission or admin rights
    const canEdit = isAdmin;

    return (
        <>
            <div className="mb-4">
                <DraftTable />
            </div>

            <div className="flex max-w-full flex-col gap-4 lg:flex-row">
                {/* Only show these components if not finished and user has edit permissions */}
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

            {/* Only show finish draft button to users with edit permissions */}
            {isDraftComplete && !draftStore.isDraftFinished && canEdit && (
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