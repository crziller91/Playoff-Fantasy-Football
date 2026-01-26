import { useState } from "react";
import { Modal, Button, Select, Label, Checkbox } from "flowbite-react";
import { ExtendedPlayer, Player } from "../../types";
import { HiRefresh, HiArrowLeft } from "react-icons/hi";

interface QBBackupModalProps {
    isOpen: boolean;
    player: ExtendedPlayer | null;
    round: string;
    allPlayers: Player[];
    onClose: () => void;
    onConfirm: (backupPlayer: Player | null, applyToFutureRounds: boolean, isRevert?: boolean) => void;
}

export default function QBBackupModal({
    isOpen,
    player,
    round,
    allPlayers,
    onClose,
    onConfirm,
}: QBBackupModalProps) {
    const [selectedBackupId, setSelectedBackupId] = useState<string>("");
    const [applyToFutureRounds, setApplyToFutureRounds] = useState<boolean>(true);

    // Check if player already has a backup QB assigned
    const hasExistingBackup = player?.backupPlayerId && player?.backupPlayerName;

    // Reset state and close modal
    const handleClose = () => {
        setSelectedBackupId("");
        setApplyToFutureRounds(true);
        onClose();
    };

    if (!player) return null;

    // Get QBs from the same NFL team (excluding the current player)
    const teamQBs = allPlayers.filter(
        (p) =>
            p.position === "QB" &&
            p.teamName === player.teamName &&
            p.id !== player.id
    );

    const handleConfirm = () => {
        if (selectedBackupId) {
            const backupPlayer = teamQBs.find((p) => p.id === parseInt(selectedBackupId));
            onConfirm(backupPlayer || null, applyToFutureRounds, false);
        } else {
            onConfirm(null, applyToFutureRounds, false);
        }
        // Reset state after confirm
        setSelectedBackupId("");
        setApplyToFutureRounds(true);
    };

    const handleRevert = () => {
        onConfirm(null, applyToFutureRounds, true);
        // Reset state after revert
        setSelectedBackupId("");
        setApplyToFutureRounds(true);
    };

    // If player has an existing backup, show revert UI
    if (hasExistingBackup) {
        return (
            <Modal show={isOpen} size="md" onClose={handleClose} popup>
                <Modal.Header />
                <Modal.Body>
                    <div className="text-center">
                        <HiArrowLeft className="mx-auto mb-4 size-14 text-orange-500 dark:text-orange-400" />
                        <h3 className="mb-2 text-lg font-normal text-gray-500 dark:text-gray-400">
                            QB Swap Active for {player.teamName}
                        </h3>
                        <p className="mb-2 text-sm text-gray-400 dark:text-gray-500">
                            Original QB: <span className="font-medium text-gray-600 dark:text-gray-300">{player.name}</span>
                        </p>
                        <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
                            Current Backup: <span className="font-medium text-blue-600 dark:text-blue-400">{player.backupPlayerName}</span>
                        </p>

                        <div className="mb-6 flex items-center gap-2 text-left">
                            <Checkbox
                                id="applyRevertToFuture"
                                checked={applyToFutureRounds}
                                onChange={(e) => setApplyToFutureRounds(e.target.checked)}
                            />
                            <Label htmlFor="applyRevertToFuture" className="text-sm">
                                Apply this change to remaining rounds
                            </Label>
                        </div>

                        <div className="flex flex-col space-y-3">
                            <Button
                                color="warning"
                                onClick={handleRevert}
                            >
                                Revert to Original QB
                            </Button>
                            <Button color="gray" onClick={handleClose}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        );
    }

    // Default UI for selecting a new backup
    return (
        <Modal show={isOpen} size="md" onClose={handleClose} popup>
            <Modal.Header />
            <Modal.Body>
                <div className="text-center">
                    <HiRefresh className="mx-auto mb-4 size-14 text-blue-500 dark:text-blue-400" />
                    <h3 className="mb-2 text-lg font-normal text-gray-500 dark:text-gray-400">
                        Swap QB for {player.teamName}
                    </h3>
                    <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
                        Current QB: {player.name}
                    </p>
                    <p className="mb-4 text-sm text-gray-400 dark:text-gray-500">
                        Select a backup QB to replace {player.name} for the {round} round.
                    </p>

                    <div className="mb-4 text-left">
                        <Label htmlFor="backupQB" className="mb-2 block">
                            Select Backup QB
                        </Label>
                        <Select
                            id="backupQB"
                            value={selectedBackupId}
                            onChange={(e) => setSelectedBackupId(e.target.value)}
                        >
                            <option value="">Select a backup QB...</option>
                            {teamQBs.map((qb) => (
                                <option key={qb.id} value={qb.id}>
                                    {qb.name}
                                </option>
                            ))}
                        </Select>
                        {teamQBs.length === 0 && (
                            <p className="mt-2 text-sm text-red-500">
                                No other QBs found for {player.teamName}
                            </p>
                        )}
                    </div>

                    <div className="mb-6 flex items-center gap-2 text-left">
                        <Checkbox
                            id="applyToFuture"
                            checked={applyToFutureRounds}
                            onChange={(e) => setApplyToFutureRounds(e.target.checked)}
                        />
                        <Label htmlFor="applyToFuture" className="text-sm">
                            Apply this change to remaining rounds
                        </Label>
                    </div>

                    <div className="flex flex-col space-y-3">
                        <Button
                            color="success"
                            onClick={handleConfirm}
                            disabled={!selectedBackupId}
                        >
                            Confirm Swap
                        </Button>
                        <Button color="gray" onClick={handleClose}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
}
