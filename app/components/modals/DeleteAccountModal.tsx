import { Modal, Button } from "flowbite-react";
import { HiOutlineExclamationCircle } from "react-icons/hi";

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    isLoading: boolean;
    isAdmin: boolean;
}

export default function DeleteAccountModal({
    isOpen,
    onClose,
    onConfirm,
    isLoading,
    isAdmin
}: DeleteAccountModalProps) {
    return (
        <Modal show={isOpen} size="md" onClose={onClose} popup>
            <Modal.Header />
            <Modal.Body>
                <div className="text-center">
                    <HiOutlineExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
                    <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete your account?
                    </h3>

                    {isAdmin && (
                        <div className="mb-5 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
                            <p><strong>Note:</strong> You currently have admin privileges.</p>
                            <p>If you delete your account, admin rights will be transferred to another user if any exist.</p>
                        </div>
                    )}

                    <div className="flex justify-center gap-4">
                        <Button
                            color="failure"
                            onClick={onConfirm}
                            disabled={isLoading}
                        >
                            {isLoading ? "Deleting..." : "Yes, delete my account"}
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