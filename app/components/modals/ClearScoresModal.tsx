import { Modal, Button } from "flowbite-react";
import { ExtendedPlayer } from "../../types";
import { HiOutlineExclamationCircle } from "react-icons/hi";

interface ClearScoresModalProps {
    isOpen: boolean;
    player: ExtendedPlayer | null;
    onClose: () => void;
    onConfirm: () => void;
}

export default function ClearScoresModal({
    isOpen,
    player,
    onClose,
    onConfirm,
}: ClearScoresModalProps) {
    if (!player) return null;

    return (
        <Modal show={isOpen} size="md" onClose={onClose} popup>
            <Modal.Header />
            <Modal.Body>
                <div className="text-center">
                    <HiOutlineExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
                    <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                        Are you sure you want to clear the scores for {player.name}?
                    </h3>
                    <div className="flex justify-center gap-4">
                        <Button color="failure" onClick={onConfirm}>
                            Yes, clear scores
                        </Button>
                        <Button color="gray" onClick={onClose}>
                            No, cancel
                        </Button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
}