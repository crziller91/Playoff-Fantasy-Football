import { Modal, Button } from "flowbite-react";
import { ExtendedPlayer } from "../../types";
import { HiOutlineExclamationCircle } from "react-icons/hi";

interface ZeroStatsModalProps {
    isOpen: boolean;
    player: ExtendedPlayer | null;
    round: string;
    onClose: () => void;
    onConfirmDeactivate: () => void;
    onKeepZeroScore: () => void;
}

export default function ZeroStatsModal({
    isOpen,
    player,
    round,
    onClose,
    onConfirmDeactivate,
    onKeepZeroScore,
}: ZeroStatsModalProps) {
    if (!player) return null;

    return (
        <Modal show={isOpen} size="md" onClose={onClose} popup>
            <Modal.Header />
            <Modal.Body>
                <div className="text-center">
                    <HiOutlineExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
                    <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                        {player.name} has 0 points. Would you like to deactivate this player?
                    </h3>
                    <div className="flex flex-col space-y-3">
                        <Button color="warning" onClick={onConfirmDeactivate}>
                            Yes, deactivate player
                        </Button>
                        <Button color="gray" onClick={onKeepZeroScore}>
                            No, keep 0 score
                        </Button>
                        <Button color="light" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
}
