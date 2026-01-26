import React from "react";
import ScoreModal from "../modals/ScoreModal";
import ClearScoresModal from "../modals/ClearScoresModal";
import PlayerStatusModal from "../modals/PlayerStatusModal";
import PlayerReactivationModal from "../modals/PlayerReactivationModal";
import ZeroStatsModal from "../modals/ZeroStatsModal";
import SeasonEndingInjuryModal from "../modals/SeasonEndingInjuryModal";
import QBBackupModal from "../modals/QBBackupModal";
import { ExtendedPlayer, ScoreForm, FormErrors, Player } from "../../types";

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
        zeroStatsModal: {
            isOpen: boolean;
            player: ExtendedPlayer | null;
        };
        seasonEndingModal: {
            isOpen: boolean;
            player: ExtendedPlayer | null;
        };
        qbBackupModal: {
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
        zeroStatsModal: {
            onClose: () => void;
            onConfirmDeactivate: () => void;
            onKeepZeroScore: () => void;
        };
        seasonEndingModal: {
            onClose: () => void;
            onConfirmSeasonEnding: () => void;
            onConfirmNotSeasonEnding: () => void;
        };
        qbBackupModal: {
            onClose: () => void;
            onConfirm: (backupPlayer: Player | null, applyToFutureRounds: boolean, isRevert?: boolean) => void;
        };
    };
    activeRound: string;
    allPlayers: Player[];
}

/**
 * Component that contains all player-related modals
 */
export default function PlayerModals({
    modalsState,
    modalsHandlers,
    activeRound,
    allPlayers
}: PlayerModalsProps) {
    const {
        scoreModal,
        clearScoresModal,
        statusModal,
        reactivationModal,
        zeroStatsModal,
        seasonEndingModal,
        qbBackupModal
    } = modalsState;

    const {
        scoreModal: scoreModalHandlers,
        clearScoresModal: clearScoresModalHandlers,
        statusModal: statusModalHandlers,
        reactivationModal: reactivationModalHandlers,
        zeroStatsModal: zeroStatsModalHandlers,
        seasonEndingModal: seasonEndingModalHandlers,
        qbBackupModal: qbBackupModalHandlers
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

            {/* Zero Stats modal */}
            <ZeroStatsModal
                isOpen={zeroStatsModal.isOpen}
                player={zeroStatsModal.player}
                round={activeRound}
                onClose={zeroStatsModalHandlers.onClose}
                onConfirmDeactivate={zeroStatsModalHandlers.onConfirmDeactivate}
                onKeepZeroScore={zeroStatsModalHandlers.onKeepZeroScore}
            />

            {/* Season Ending Injury modal */}
            <SeasonEndingInjuryModal
                isOpen={seasonEndingModal.isOpen}
                player={seasonEndingModal.player}
                round={activeRound}
                onClose={seasonEndingModalHandlers.onClose}
                onConfirmSeasonEnding={seasonEndingModalHandlers.onConfirmSeasonEnding}
                onConfirmNotSeasonEnding={seasonEndingModalHandlers.onConfirmNotSeasonEnding}
            />

            {/* QB Backup Selection modal */}
            <QBBackupModal
                isOpen={qbBackupModal.isOpen}
                player={qbBackupModal.player}
                round={activeRound}
                allPlayers={allPlayers}
                onClose={qbBackupModalHandlers.onClose}
                onConfirm={qbBackupModalHandlers.onConfirm}
            />
        </>
    );
}