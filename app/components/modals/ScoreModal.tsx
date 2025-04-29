import { Modal, Button, Label, TextInput, Spinner } from "flowbite-react";
import { ScoreForm, FormErrors, ScoreModalProps } from "../../types";
import { useState } from "react";

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
                                    # of Touchdowns
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("touchdowns", "# of Touchdowns", "touchdowns")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="yards"
                                    color={submitAttempted && formErrors.yards ? "failure" : undefined}
                                >
                                    Total Yards
                                </Label>
                            </div>
                            <TextInput {...commonProps("yards", "Total Yards", "yards")} type="text" />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="twoPtConversions"
                                    color={submitAttempted && formErrors.twoPtConversions ? "failure" : undefined}
                                >
                                    # of 2 PT Conversions
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("twoPtConversions", "# of 2 PT Conversions", "twoPtConversions")}
                                type="text"
                            />
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
                                    # of Touchdowns
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("touchdowns", "# of Touchdowns", "touchdowns")}
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
                                    htmlFor="twoPtConversions"
                                    color={submitAttempted && formErrors.twoPtConversions ? "failure" : undefined}
                                >
                                    # of 2 PT Conversions
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("twoPtConversions", "# of 2 PT Conversions", "twoPtConversions")}
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
                                    # of Touchdowns
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("touchdowns", "# of Touchdowns", "touchdowns")}
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
                                    htmlFor="twoPtConversions"
                                    color={submitAttempted && formErrors.twoPtConversions ? "failure" : undefined}
                                >
                                    # of 2 PT Conversions
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("twoPtConversions", "# of 2 PT Conversions", "twoPtConversions")}
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
            case "DST":
                return (
                    <>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="touchdowns"
                                    color={submitAttempted && formErrors.touchdowns ? "failure" : undefined}
                                >
                                    # of Touchdowns
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("touchdowns", "# of Touchdowns", "touchdowns")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="sacks"
                                    color={submitAttempted && formErrors.sacks ? "failure" : undefined}
                                >
                                    # of Sacks
                                </Label>
                            </div>
                            <TextInput {...commonProps("sacks", "# of Sacks", "sacks")} type="text" />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="blockedKicks"
                                    color={submitAttempted && formErrors.blockedKicks ? "failure" : undefined}
                                >
                                    # of Blocked Kicks
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("blockedKicks", "# of Blocked Kicks", "blockedKicks")}
                                type="text"
                            />
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
                                    htmlFor="fumblesRecovered"
                                    color={submitAttempted && formErrors.fumblesRecovered ? "failure" : undefined}
                                >
                                    # of Fumbles Recovered
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("fumblesRecovered", "# of Fumbles Recovered", "fumblesRecovered")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="safeties"
                                    color={submitAttempted && formErrors.safeties ? "failure" : undefined}
                                >
                                    # of Safeties
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("safeties", "# of Safeties", "safeties")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="pointsAllowed"
                                    color={submitAttempted && formErrors.pointsAllowed ? "failure" : undefined}
                                >
                                    # of Points Allowed
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("pointsAllowed", "# of Points Allowed", "pointsAllowed")}
                                type="text"
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label
                                    htmlFor="yardsAllowed"
                                    color={submitAttempted && formErrors.yardsAllowed ? "failure" : undefined}
                                >
                                    Total Yards Allowed
                                </Label>
                            </div>
                            <TextInput
                                {...commonProps("yardsAllowed", "Total Yards Allowed", "yardsAllowed")}
                                type="text"
                            />
                        </div>
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