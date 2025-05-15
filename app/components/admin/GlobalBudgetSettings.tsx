import { useState } from "react";
import { Card, Spinner, Button, TextInput, Label } from "flowbite-react";

interface GlobalBudgetSettingsProps {
    currentBudget: number;
    onSaveBudget: (budget: number) => Promise<void>;
    isLoading: boolean;
    draftFinished: boolean;
}

export default function GlobalBudgetSettings({
    currentBudget,
    onSaveBudget,
    isLoading,
    draftFinished
}: GlobalBudgetSettingsProps) {
    const [budget, setBudget] = useState(currentBudget.toString());
    const [isValid, setIsValid] = useState(true);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validate the budget
        const budgetValue = parseInt(budget, 10);
        if (isNaN(budgetValue) || budgetValue <= 0) {
            setIsValid(false);
            return;
        }

        // Submit the budget change
        onSaveBudget(budgetValue);
    };

    return (
        <div className="mb-8">
            <div className="mb-4">
                <h2 className="text-xl font-semibold">Global Budget Settings</h2>
                <p className="text-sm text-gray-500">
                    Set the budget amount for all teams. This will also be the default when resetting teams.
                </p>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="flex items-end gap-4">
                    <div className="flex-1">
                        <div className="mb-2 block">
                            <Label htmlFor="globalBudget" value="Budget for all teams" />
                        </div>
                        <TextInput
                            id="globalBudget"
                            placeholder="200"
                            value={budget}
                            onChange={(e) => {
                                setBudget(e.target.value);
                                setIsValid(true);
                            }}
                            disabled={draftFinished || isLoading}
                            color={isValid ? undefined : "failure"}
                            helperText={!isValid ? "Budget must be a positive number" : undefined}
                        />
                    </div>
                    <Button
                        type="submit"
                        disabled={draftFinished || isLoading}
                        color={draftFinished ? "gray" : "success"}
                    >
                        {isLoading ? (
                            <>
                                <Spinner size="sm" className="mr-2" />
                                Saving...
                            </>
                        ) : (
                            "Save Budget"
                        )}
                    </Button>
                </form>
            </Card>
        </div>
    );
} 