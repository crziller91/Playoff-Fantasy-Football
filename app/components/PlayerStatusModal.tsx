import { Modal, Button } from "flowbite-react";
import { ExtendedPlayer } from "../types";
import { HiOutlineExclamationCircle } from "react-icons/hi";

interface PlayerStatusModalProps {
    isOpen: boolean;
    player: ExtendedPlayer | null;
    round: string;
    onClose: () => void;
    onConfirmEliminated: () => void;
    onConfirmNotPlaying: () => void;
}

export default function PlayerStatusModal({
    isOpen,
    player,
    round,
    onClose,
    onConfirmEliminated,
    onConfirmNotPlaying,
}: PlayerStatusModalProps) {
    if (!player) return null;

    return (
        <Modal show={isOpen} size="md" onClose={onClose} popup>
            <Modal.Header />
            <Modal.Body>
                <div className="text-center">
                    <HiOutlineExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
                    <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                        What is {player.name}&apos;s status for the {round} round?
                    </h3>
                    <div className="flex flex-col space-y-3">
                        <Button color="failure" onClick={onConfirmEliminated}>
                            Eliminated from playoffs
                        </Button>
                        <Button color="warning" onClick={onConfirmNotPlaying}>
                            Not playing this round only (injury/inactive)
                        </Button>
                        <Button color="gray" onClick={onClose}>
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
}