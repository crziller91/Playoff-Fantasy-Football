// app/modals/BudgetModal.tsx
import { Modal, Button, Label, TextInput, Alert } from "flowbite-react";
import { useState, useEffect } from "react";
import { BudgetModalProps } from "../types";
import { HiExclamation, HiX } from "react-icons/hi";

export default function BudgetModal({
    isOpen,
    onClose,
    player,
    team,
    onConfirm,
    budgetError
}: BudgetModalProps) {
    const [cost, setCost] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [showAlert, setShowAlert] = useState(false);

    // Reset state when modal opens/closes or when budgetError changes
    useEffect(() => {
        if (isOpen) {
            setCost("");
            setError("");
            setShowAlert(!!budgetError);
        }
    }, [isOpen, budgetError]);

    const handleSubmit = () => {
        // Validate input - only positive whole numbers
        const costValue = parseInt(cost, 10);
        
        if (!cost || isNaN(costValue)) {
            setError("Please enter a valid amount");
            return;
        }
        
        if (costValue <= 0) {
            setError("Please enter a positive amount");
            return;
        }
        
        // Clear error and submit
        setError("");
        setShowAlert(true); // Ensure alert is visible if budget error comes back
        onConfirm(costValue);
    };

    const handleClose = () => {
        setCost(""); // Reset state
        setError("");
        setShowAlert(false);
        onClose();
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Only allow positive integers
        if (value === "" || /^[0-9]+$/.test(value)) {
            setCost(value);
            setError("");
            
            // Hide alert when user starts typing
            setShowAlert(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Submit form when Enter key is pressed
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const handleDismissAlert = () => {
        setShowAlert(false);
    };

    if (!player) return null;

    return (
        <Modal show={isOpen} size="md" onClose={handleClose} popup>
            <Modal.Header />
            <Modal.Body>
                <div className="space-y-6">
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                        Purchase Price
                    </h3>
                    
                    {/* Budget Error Alert - Dismissible */}
                    {budgetError && showAlert && (
                        <Alert 
                            color="failure" 
                            icon={HiExclamation}
                            onDismiss={handleDismissAlert}
                        >
                            <span className="font-medium">Budget Error!</span> {budgetError}
                        </Alert>
                    )}
                    
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="cost" color={error ? "failure" : undefined}>
                                How much did {team} spend on {player.name}?
                            </Label>
                        </div>
                        <TextInput
                            id="cost"
                            type="text"
                            value={cost}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            color={error ? "failure" : undefined}
                            helperText={error || undefined}
                            placeholder="Enter amount"
                            autoFocus={true}
                            required
                        />
                    </div>
                    <div className="flex justify-center gap-4">
                        <Button color="blue" onClick={handleSubmit}>
                            Submit
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