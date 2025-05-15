import React, { useState, useEffect } from "react";
import { Card, Table, Button, Spinner, Alert, TextInput, Tabs, TabItem } from "flowbite-react";
import { HiCheckCircle, HiSave } from "react-icons/hi";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores/StoreContext";

interface ScoringRule {
    id: number;
    position: string;
    category: string;
    value: number;
    description: string;
}

// Helper to format category names for display
const formatCategoryName = (category: string): string => {
    return category
        .replace(/([A-Z])/g, ' $1') // Add space before capital letters
        .replace(/^./, (str) => str.toUpperCase()); // Capitalize first letter
};

const ScoringRulesEditor = observer(() => {
    const { scoresStore } = useStore();
    const [rules, setRules] = useState<ScoringRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [recalculating, setRecalculating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);

    // Keep both the original values and the changed values separately
    const [originalValues, setOriginalValues] = useState<Record<number, number>>({});
    const [changedRules, setChangedRules] = useState<Record<number, boolean>>({});

    // Positions in the order we want to display them
    const positions = ["QB", "RB", "WR", "TE", "K", "DST"];

    // Fetch scoring rules on component mount
    useEffect(() => {
        const fetchRules = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await fetch("/api/scoring-rules");
                if (!response.ok) {
                    throw new Error(`Failed to fetch scoring rules: ${response.status}`);
                }

                const data = await response.json();
                setRules(data);

                // Store original values when first loaded
                const origValues: Record<number, number> = {};
                data.forEach((rule: ScoringRule) => {
                    origValues[rule.id] = rule.value;
                });
                setOriginalValues(origValues);

                setChangedRules({}); // Reset changed rules tracking
            } catch (err) {
                console.error("Error fetching scoring rules:", err);
                setError(err instanceof Error ? err.message : "Failed to fetch scoring rules");
            } finally {
                setLoading(false);
            }
        };

        fetchRules();
    }, []);

    // Handle value change
    const handleValueChange = (id: number, newValue: string) => {
        // Only update if the value is a valid number
        if (newValue === "" || (!isNaN(Number(newValue)) && !isNaN(parseFloat(newValue)))) {
            setRules(prevRules =>
                prevRules.map(rule => {
                    if (rule.id === id) {
                        const newNumValue = newValue === "" ? 0 : Number(newValue);
                        // Compare with original value to determine if it's changed
                        const isChanged = newNumValue !== originalValues[id];

                        // Update the changedRules state accordingly
                        setChangedRules(prev => ({
                            ...prev,
                            [id]: isChanged
                        }));

                        return { ...rule, value: newNumValue };
                    }
                    return rule;
                })
            );
        }
    };

    // Save changes to all rules for the current position
    const handleSaveChanges = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccessMessage(null);

            const currentPosition = positions[activeTab];
            const positionRules = rules.filter(rule => rule.position === currentPosition);

            // Check if any rules for this position have changed
            const hasChanges = positionRules.some(rule => changedRules[rule.id]);

            if (!hasChanges) {
                setSuccessMessage("No changes to save");
                setTimeout(() => setSuccessMessage(null), 3000);
                setSaving(false);
                return;
            }

            const response = await fetch("/api/scoring-rules", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(positionRules),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to save scoring rules: ${response.status}`);
            }

            // After saving, recalculate scores for this position
            setRecalculating(true);
            try {
                await scoresStore.recalculateScores(currentPosition);
            } finally {
                setRecalculating(false);
            }

            // After a successful save, update the original values
            const newOrigValues = { ...originalValues };
            positionRules.forEach(rule => {
                newOrigValues[rule.id] = rule.value;
            });
            setOriginalValues(newOrigValues);

            // Clear the changed flags for this position's rules
            const newChangedRules = { ...changedRules };
            positionRules.forEach(rule => {
                delete newChangedRules[rule.id];
            });
            setChangedRules(newChangedRules);

            // Emit socket event for real-time updates on scoring rules
            const socket = scoresStore.rootStore.socket;
            if (socket) {
                socket.emit("playerScoreUpdate", {
                    action: "scoring_rules_update",
                    position: currentPosition
                });
            }

            setSuccessMessage(`${currentPosition} scoring rules updated and scores recalculated successfully`);

            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (err) {
            console.error("Error saving scoring rules:", err);
            setError(err instanceof Error ? err.message : "Failed to save scoring rules");
        } finally {
            setSaving(false);
        }
    };

    // Render rules for a specific position
    const renderPositionRules = (position: string) => {
        const positionRules = rules.filter(rule => rule.position === position);

        if (positionRules.length === 0) {
            return (
                <div className="p-4 text-center text-gray-500">
                    No scoring rules found for {position}
                </div>
            );
        }

        return (
            <Table>
                <Table.Head>
                    <Table.HeadCell>Rule</Table.HeadCell>
                    <Table.HeadCell>Description</Table.HeadCell>
                    <Table.HeadCell>Value</Table.HeadCell>
                </Table.Head>
                <Table.Body className="divide-y">
                    {positionRules.map(rule => (
                        <Table.Row key={rule.id} className="bg-white">
                            <Table.Cell className="whitespace-nowrap font-medium text-gray-900">
                                {formatCategoryName(rule.category)}
                            </Table.Cell>
                            <Table.Cell>
                                {rule.description}
                            </Table.Cell>
                            <Table.Cell width={150}>
                                <TextInput
                                    sizing="sm"
                                    value={rule.value.toString()}
                                    onChange={(e) => handleValueChange(rule.id, e.target.value)}
                                    type="number"
                                    step="any"
                                    className={changedRules[rule.id] ? "border-blue-500" : ""}
                                />
                            </Table.Cell>
                        </Table.Row>
                    ))}
                </Table.Body>
            </Table>
        );
    };

    // Count how many rules have been changed in the current position
    const getChangedRuleCount = () => {
        const currentPosition = positions[activeTab];
        const positionRules = rules.filter(rule => rule.position === currentPosition);
        return positionRules.filter(rule => changedRules[rule.id]).length;
    };

    if (loading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Spinner size="xl" />
            </div>
        );
    }

    const changedCount = getChangedRuleCount();
    const isProcessing = saving || recalculating || scoresStore.isLoading;

    return (
        <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                    Scoring System
                    {changedCount > 0 && (
                        <span className="ml-2 text-sm font-normal text-blue-600">
                            ({changedCount} rule{changedCount > 1 ? 's' : ''} changed)
                        </span>
                    )}
                </h2>

                <Button
                    onClick={handleSaveChanges}
                    disabled={isProcessing || changedCount === 0}
                    color="success"
                >
                    {isProcessing ? (
                        <>
                            <Spinner size="sm" className="mr-2" />
                            {saving ? "Saving..." : "Recalculating Scores..."}
                        </>
                    ) : (
                        <>
                            <HiSave className="mr-1 size-5" />
                            Save Changes & Recalculate
                        </>
                    )}
                </Button>
            </div>

            {/* Error/Success messages */}
            {error && (
                <Alert color="failure" className="mb-4">
                    {error}
                </Alert>
            )}

            {successMessage && (
                <Alert color="success" className="mb-4" icon={HiCheckCircle}>
                    {successMessage}
                </Alert>
            )}

            <Card>
                <Tabs
                    aria-label="Position tabs"
                    variant="underline"
                    onActiveTabChange={setActiveTab}
                >
                    {positions.map((position, index) => (
                        <TabItem key={position} active={activeTab === index} title={position}>
                            {renderPositionRules(position)}
                        </TabItem>
                    ))}
                </Tabs>
            </Card>
        </div>
    );
});

export default ScoringRulesEditor;