import { Modal, Button } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";

interface SignOutModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
}

export default function SignOutModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading
}: SignOutModalProps) {
    return (
        <Modal show={isOpen} size="md" onClose={onClose} popup>
            <Modal.Header />
            <Modal.Body>
                <div className="text-center">
                    <HiOutlineExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
                    <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                        Are you sure you want to sign out?
                    </h3>
                    <div className="flex justify-center gap-4">
                        <Button
                            color="info"
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing out..." : "Yes, sign me out"}
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