import { Modal, Button } from "flowbite-react";
import { ExtendedPlayer } from "../../types";
import { HiOutlineExclamationCircle } from "react-icons/hi";

interface SeasonEndingInjuryModalProps {
    isOpen: boolean;
    player: ExtendedPlayer | null;
    round: string;
    onClose: () => void;
    onConfirmSeasonEnding: () => void;
    onConfirmNotSeasonEnding: () => void;
}

export default function SeasonEndingInjuryModal({
    isOpen,
    player,
    round,
    onClose,
    onConfirmSeasonEnding,
    onConfirmNotSeasonEnding,
}: SeasonEndingInjuryModalProps) {
    if (!player) return null;

    return (
        <Modal show={isOpen} size="md" onClose={onClose} popup>
            <Modal.Header />
            <Modal.Body>
                <div className="text-center">
                    <HiOutlineExclamationCircle className="mx-auto mb-4 size-14 text-yellow-400 dark:text-yellow-300" />
                    <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                        Is this a season-ending injury for {player.name}?
                    </h3>
                    <p className="mb-5 text-sm text-gray-400 dark:text-gray-500">
                        If season-ending, {player.name} will be marked as injured for all remaining rounds.
                    </p>
                    <div className="flex flex-col space-y-3">
                        <Button color="failure" onClick={onConfirmSeasonEnding}>
                            Yes, season-ending injury
                        </Button>
                        <Button color="warning" onClick={onConfirmNotSeasonEnding}>
                            No, just this round
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
