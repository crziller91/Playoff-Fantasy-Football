import React from "react";
import ScoreModal from "../modals/ScoreModal";
import ClearScoresModal from "../modals/ClearScoresModal";
import PlayerStatusModal from "../modals/PlayerStatusModal";
import PlayerReactivationModal from "../modals/PlayerReactivationModal";
import { ExtendedPlayer, ScoreForm, FormErrors } from "../../types";

interface PlayerModalsProps {
    modalsState: {
        scoreModal: {
            isOpen: boolean;
            player: ExtendedPlayer | null;
            scoreForm: ScoreForm;
            formErrors: FormErrors;
            submitAttempted: boolean;
            fgCount: number;
        };
        clearScoresModal: {
            isOpen: boolean;
            player: ExtendedPlayer | null;
        };
        statusModal: {
            isOpen: boolean;
            player: ExtendedPlayer | null;
        };
        reactivationModal: {
            isOpen: boolean;
            player: ExtendedPlayer | null;
        };
    };
    modalsHandlers: {
        scoreModal: {
            onClose: () => void;
            onInputChange: (field: keyof ScoreForm, value: string) => void;
            onFgCountChange: (value: string) => void;
            onFgYardageChange: (index: number, value: string) => void;
            onSubmit: () => Promise<void>;
        };
        clearScoresModal: {
            onClose: () => void;
            onConfirm: () => void;
        };
        statusModal: {
            onClose: () => void;
            onConfirmEliminated: () => void;
            onConfirmNotPlaying: () => void;
        };
        reactivationModal: {
            onClose: () => void;
            onConfirm: () => void;
        };
    };
    activeRound: string;
}

/**
 * Component that contains all player-related modals
 */
export default function PlayerModals({
    modalsState,
    modalsHandlers,
    activeRound
}: PlayerModalsProps) {
    const {
        scoreModal,
        clearScoresModal,
        statusModal,
        reactivationModal
    } = modalsState;

    const {
        scoreModal: scoreModalHandlers,
        clearScoresModal: clearScoresModalHandlers,
        statusModal: statusModalHandlers,
        reactivationModal: reactivationModalHandlers
    } = modalsHandlers;

    return (
        <>
            {/* Score modal */}
            <ScoreModal
                isOpen={scoreModal.isOpen}
                onClose={scoreModalHandlers.onClose}
                player={scoreModal.player}
                scoreForm={scoreModal.scoreForm}
                formErrors={scoreModal.formErrors}
                submitAttempted={scoreModal.submitAttempted}
                fgCount={scoreModal.fgCount}
                onInputChange={scoreModalHandlers.onInputChange}
                onFgCountChange={scoreModalHandlers.onFgCountChange}
                onFgYardageChange={scoreModalHandlers.onFgYardageChange}
                onSubmit={scoreModalHandlers.onSubmit}
            />

            {/* Clear Scores confirmation modal */}
            <ClearScoresModal
                isOpen={clearScoresModal.isOpen}
                player={clearScoresModal.player}
                onClose={clearScoresModalHandlers.onClose}
                onConfirm={clearScoresModalHandlers.onConfirm}
            />

            {/* Player Status modal */}
            <PlayerStatusModal
                isOpen={statusModal.isOpen}
                player={statusModal.player}
                round={activeRound}
                onClose={statusModalHandlers.onClose}
                onConfirmEliminated={statusModalHandlers.onConfirmEliminated}
                onConfirmNotPlaying={statusModalHandlers.onConfirmNotPlaying}
            />

            {/* Player Reactivation modal */}
            <PlayerReactivationModal
                isOpen={reactivationModal.isOpen}
                player={reactivationModal.player}
                onClose={reactivationModalHandlers.onClose}
                onConfirm={reactivationModalHandlers.onConfirm}
            />
        </>
    );
}