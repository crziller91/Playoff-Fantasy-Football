import { Modal, Button, Label, TextInput, Spinner, Alert } from "flowbite-react";
import { ScoreForm, FormErrors, ScoreModalProps } from "../../types";
import { useState } from "react";
import { searchPlayerStats } from "../../services/espnStatsService";
import { HiSparkles, HiInformationCircle } from "react-icons/hi";

export default function ScoreModal({
    isOpen,
    onClose,
    player,
    scoreForm,
    formErrors,
    submitAttempted,
    fgCount,
    onInputChange,
    onFgCountChange,
    onFgYardageChange,
    onSubmit
}: ScoreModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAutoFilling, setIsAutoFilling] = useState(false);
    const [autoFillError, setAutoFillError] = useState<string | null>(null);

    // Wrap the onSubmit to handle loading state
    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await onSubmit();
        } catch (error) {
            console.error("Error submitting score:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle auto-fill from ESPN stats
    const handleAutoFill = async () => {
        if (!player) return;

        setIsAutoFilling(true);
        setAutoFillError(null);

        try {
            const stats = await searchPlayerStats(player.name, player.position, player.teamName);

            if (!stats) {
                setAutoFillError("No stats found for this player");
                return;
            }

            // Update form fields based on the stats returned
            Object.entries(stats).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    // Handle fgYardages array specially
                    if (key === 'fgYardages' && Array.isArray(value)) {
                        // Update FG count first
                        onFgCountChange(value.length.toString());
                        // Then update each yardage
                        value.forEach((yardage, index) => {
                            onFgYardageChange(index, yardage.toString());
                        });
                    } else if (key === 'fg') {
                        // Handle field goal count specially
                        onFgCountChange(value.toString());
                    } else {
                        // Regular field update
                        onInputChange(key as keyof ScoreForm, value.toString());
                    }
                }
            });
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch stats";
            setAutoFillError(errorMessage);
            // Log error without full stack trace to avoid Next.js error overlay
            console.log(`Error auto-filling stats for ${player.name}:`, errorMessage);
        } finally {
            setIsAutoFilling(false);
        }
    };

    if (!player) return null;

    const commonProps = (id: string, label: string, field: keyof ScoreForm) => {
        const hasError = submitAttempted && formErrors[field];
        return {
            id,
            label,
            value: scoreForm[field] || "",
            onChange: (e: React.ChangeEvent<HTMLInputElement>) => onInputChange(field, e.target.value),
            required: true,
            color: hasError ? "failure" : undefined,
        };
    };

    const renderPositionFields = () => {
        switch (player.position) {
            case "QB":
                return (
                    <>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="touchdowns"
                                    color={submitAttempted && formErrors.touchdowns ? "failure" : undefined}
                                >
                                    # of Passing Touchdowns
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("touchdowns", "# of Passing Touchdowns", "touchdowns")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="yards"
                                    color={submitAttempted && formErrors.yards ? "failure" : undefined}
                                >
                                    Total Passing Yards
                                </Label>
                            </div>
                            <TextInput {...commonProps("yards", "Total Passing Yards", "yards")} type="text" />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="interceptions"
                                    color={submitAttempted && formErrors.interceptions ? "failure" : undefined}
                                >
                                    # of Interceptions
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("interceptions", "# of Interceptions", "interceptions")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="completions"
                                    color={submitAttempted && formErrors.completions ? "failure" : undefined}
                                >
                                    # of Completions
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("completions", "# of Completions", "completions")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="rushingTouchdowns"
                                    color={submitAttempted && formErrors.rushingTouchdowns ? "failure" : undefined}
                                >
                                    # of Rushing Touchdowns
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("rushingTouchdowns", "# of Rushing Touchdowns", "rushingTouchdowns")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="rushingYards"
                                    color={submitAttempted && formErrors.rushingYards ? "failure" : undefined}
                                >
                                    Total Rushing Yards
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("rushingYards", "Total Rushing Yards", "rushingYards")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="rushingAttempts"
                                    color={submitAttempted && formErrors.rushingAttempts ? "failure" : undefined}
                                >
                                    Rushing Attempts
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("rushingAttempts", "Rushing Attempts", "rushingAttempts")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="twoPointConversions"
                                    color={submitAttempted && formErrors.twoPointConversions ? "failure" : undefined}
                                >
                                    # of 2-Point Conversions
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("twoPointConversions", "# of 2-Point Conversions", "twoPointConversions")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="fumblesLost"
                                    color={submitAttempted && formErrors.fumblesLost ? "failure" : undefined}
                                >
                                    # of Fumbles Lost
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("fumblesLost", "# of Fumbles Lost", "fumblesLost")}
                                type="text"
                            />
                        </div>
                    </>
                );
            case "RB":
                return (
                    <>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="touchdowns"
                                    color={submitAttempted && formErrors.touchdowns ? "failure" : undefined}
                                >
                                    # of Rushing Touchdowns
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("touchdowns", "# of Rushing Touchdowns", "touchdowns")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="rushingYards"
                                    color={submitAttempted && formErrors.rushingYards ? "failure" : undefined}
                                >
                                    Total Rushing Yards
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("rushingYards", "Total Rushing Yards", "rushingYards")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="rushingAttempts"
                                    color={submitAttempted && formErrors.rushingAttempts ? "failure" : undefined}
                                >
                                    Rushing Attempts
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("rushingAttempts", "Rushing Attempts", "rushingAttempts")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="receivingTouchdowns"
                                    color={submitAttempted && formErrors.receivingTouchdowns ? "failure" : undefined}
                                >
                                    # of Receiving Touchdowns
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("receivingTouchdowns", "# of Receiving Touchdowns", "receivingTouchdowns")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="receivingYards"
                                    color={submitAttempted && formErrors.receivingYards ? "failure" : undefined}
                                >
                                    Total Receiving Yards
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("receivingYards", "Total Receiving Yards", "receivingYards")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="receptions"
                                    color={submitAttempted && formErrors.receptions ? "failure" : undefined}
                                >
                                    # of Receptions
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("receptions", "# of Receptions", "receptions")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="fumblesLost"
                                    color={submitAttempted && formErrors.fumblesLost ? "failure" : undefined}
                                >
                                    # of Fumbles Lost
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("fumblesLost", "# of Fumbles Lost", "fumblesLost")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="passingTouchdowns"
                                    color={submitAttempted && formErrors.passingTouchdowns ? "failure" : undefined}
                                >
                                    # of Passing Touchdowns
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("passingTouchdowns", "# of Passing Touchdowns", "passingTouchdowns")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="twoPointConversions"
                                    color={submitAttempted && formErrors.twoPointConversions ? "failure" : undefined}
                                >
                                    # of 2-Point Conversions
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("twoPointConversions", "# of 2-Point Conversions", "twoPointConversions")}
                                type="text"
                            />
                        </div>
                    </>
                );
            case "WR":
            case "TE":
                return (
                    <>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="touchdowns"
                                    color={submitAttempted && formErrors.touchdowns ? "failure" : undefined}
                                >
                                    # of Receiving Touchdowns
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("touchdowns", "# of Receiving Touchdowns", "touchdowns")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="receivingYards"
                                    color={submitAttempted && formErrors.receivingYards ? "failure" : undefined}
                                >
                                    Total Receiving Yards
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("receivingYards", "Total Receiving Yards", "receivingYards")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="receptions"
                                    color={submitAttempted && formErrors.receptions ? "failure" : undefined}
                                >
                                    # of Receptions
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("receptions", "# of Receptions", "receptions")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="rushingTouchdowns"
                                    color={submitAttempted && formErrors.rushingTouchdowns ? "failure" : undefined}
                                >
                                    # of Rushing Touchdowns
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("rushingTouchdowns", "# of Rushing Touchdowns", "rushingTouchdowns")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="rushingYards"
                                    color={submitAttempted && formErrors.rushingYards ? "failure" : undefined}
                                >
                                    Total Rushing Yards
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("rushingYards", "Total Rushing Yards", "rushingYards")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="rushingAttempts"
                                    color={submitAttempted && formErrors.rushingAttempts ? "failure" : undefined}
                                >
                                    Rushing Attempts
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("rushingAttempts", "Rushing Attempts", "rushingAttempts")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="fumblesLost"
                                    color={submitAttempted && formErrors.fumblesLost ? "failure" : undefined}
                                >
                                    # of Fumbles Lost
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("fumblesLost", "# of Fumbles Lost", "fumblesLost")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="passingTouchdowns"
                                    color={submitAttempted && formErrors.passingTouchdowns ? "failure" : undefined}
                                >
                                    # of Passing Touchdowns
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("passingTouchdowns", "# of Passing Touchdowns", "passingTouchdowns")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="twoPointConversions"
                                    color={submitAttempted && formErrors.twoPointConversions ? "failure" : undefined}
                                >
                                    # of 2-Point Conversions
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("twoPointConversions", "# of 2-Point Conversions", "twoPointConversions")}
                                type="text"
                            />
                        </div>
                    </>
                );
            case "K":
                return (
                    <>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="pat"
                                    color={submitAttempted && formErrors.pat ? "failure" : undefined}
                                >
                                    # of PAT
                                </Label>
                            </div>
                            <TextInput {...commonProps("pat", "# of PAT", "pat")} type="text" />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="fgMisses"
                                    color={submitAttempted && formErrors.fgMisses ? "failure" : undefined}
                                >
                                    # of FG/PAT Misses
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("fgMisses", "# of FG/PAT Misses", "fgMisses")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="fg"
                                    color={submitAttempted && formErrors.fg ? "failure" : undefined}
                                >
                                    # of FG
                                </Label>
                            </div>
                            <TextInput
                                id="fg"
                                type="text"
                                value={scoreForm.fg || ""}
                                onChange={(e) => onFgCountChange(e.target.value)}
                                required
                                color={submitAttempted && formErrors.fg ? "failure" : undefined}
                            />
                        </div>
                        {fgCount > 0 &&
                            Array.from({ length: fgCount }).map((_, index) => (
                                <div key={index}>
                                    <div className="mb-2 block">
                                        <Label
                                            htmlFor={`fgYardage${index}`}
                                            color={submitAttempted && formErrors[`fgYardage${index}`] ? "failure" : undefined}
                                        >
                                            Yardage of FG #{index + 1}
                                        </Label>
                                    </div>
                                    <TextInput
                                        id={`fgYardage${index}`}
                                        type="text"
                                        value={scoreForm.fgYardages?.[index] || ""}
                                        onChange={(e) => onFgYardageChange(index, e.target.value)}
                                        required
                                        color={submitAttempted && formErrors[`fgYardage${index}`] ? "failure" : undefined}
                                    />
                                </div>
                            ))}
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <Modal show={isOpen} size="md" onClose={onClose} popup>
            <Modal.Header />
            <Modal.Body>
                <div className="space-y-6">
                    <h3 className="text-xl font-medium text-gray-900 dark:text-white">
                        Add scores for {player.name}
                    </h3>

                    {/* Auto-fill button */}
                    <div className="w-full">
                        <Button
                            color="light"
                            onClick={handleAutoFill}
                            disabled={isAutoFilling || isSubmitting}
                            className="w-full"
                        >
                            {isAutoFilling ? (
                                <>
                                    <Spinner size="sm" className="mr-2" />
                                    Fetching stats...
                                </>
                            ) : (
                                <>
                                    <HiSparkles className="mr-2 size-5" />
                                    Auto-fill with ESPN Stats
                                </>
                            )}
                        </Button>
                        {autoFillError && (
                            <div className="mt-3">
                                <Alert
                                    color="failure"
                                    icon={HiInformationCircle}
                                    onDismiss={() => setAutoFillError(null)}
                                >
                                    <span className="font-medium">Error!</span> {autoFillError}
                                </Alert>
                            </div>
                        )}
                    </div>

                    {renderPositionFields()}
                    <div className="w-full">
                        <Button 
                            onClick={handleSubmit}
                            disabled={(submitAttempted && Object.keys(formErrors).length > 0) || isSubmitting}
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner size="sm" className="mr-2" />
                                    Calculating...
                                </>
                            ) : (
                                "Submit"
                            )}
                        </Button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
}