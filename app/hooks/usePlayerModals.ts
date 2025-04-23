import { useState } from 'react';
import { ExtendedPlayer, ScoreForm, FormErrors, PlayerScoresByRound } from '../types';
import { validateForm, calculatePlayerScore } from '../utils/scoreCalculator';
import { savePlayerScore, deletePlayerScore } from '../services/scoreService';
import { PLAYOFF_ROUNDS } from '../constants/playoffs';

interface UsePlayerModalsProps {
    playerScores: PlayerScoresByRound;
    setPlayerScores: React.Dispatch<React.SetStateAction<PlayerScoresByRound>>;
    activeRound: string;
}

export function usePlayerModals({
    playerScores,
    setPlayerScores,
    activeRound
}: UsePlayerModalsProps) {
    // Selected player for editing scores
    const [selectedPlayer, setSelectedPlayer] = useState<ExtendedPlayer | null>(null);

    // Score form state
    const [scoreForm, setScoreForm] = useState<ScoreForm>({});
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [fgCount, setFgCount] = useState(0);

    // Modal visibility states
    const [openScoreModal, setOpenScoreModal] = useState(false);
    const [openClearScoresModal, setOpenClearScoresModal] = useState(false);
    const [openStatusModal, setOpenStatusModal] = useState(false);
    const [openReactivationModal, setOpenReactivationModal] = useState(false);

    // Players for various modals
    const [clearScoresPlayer, setClearScoresPlayer] = useState<ExtendedPlayer | null>(null);
    const [statusPlayer, setStatusPlayer] = useState<ExtendedPlayer | null>(null);
    const [reactivationPlayer, setReactivationPlayer] = useState<ExtendedPlayer | null>(null);

    // Handler for opening the score editing modal
    const handleEditScore = (player: ExtendedPlayer) => {
        setSelectedPlayer({ ...player, currentRound: activeRound });
        // Load existing score data if available
        setScoreForm(playerScores[activeRound]?.[player.name]?.scoreData || {});
        setFgCount(parseInt(playerScores[activeRound]?.[player.name]?.scoreData?.fg || "0", 10) || 0);
        setOpenScoreModal(true);
        setFormErrors({});
        setSubmitAttempted(false);
    };

    // Handler for closing the score modal
    const handleCloseScoreModal = () => {
        setOpenScoreModal(false);
        setSelectedPlayer(null);
        setScoreForm({});
        setFgCount(0);
        setFormErrors({});
        setSubmitAttempted(false);
    };

    // Handler for toggling player disabled status
    const handleTogglePlayerDisabled = (player: ExtendedPlayer, isClearScores?: boolean) => {
        const round = activeRound;

        // If this is a clear scores action, open the confirmation modal
        if (isClearScores && playerScores[round]?.[player.name]?.scoreData) {
            setClearScoresPlayer({ ...player, currentRound: round });
            setOpenClearScoresModal(true);
            return;
        }

        // Check if player is already disabled and we're trying to re-enable
        if (playerScores[round]?.[player.name]?.isDisabled) {
            setReactivationPlayer({ ...player, currentRound: round });
            setOpenReactivationModal(true);
            return;
        }

        // For Wild Card, we can directly toggle disabled status
        if (round === "Wild Card") {
            updatePlayerStatus(player, !playerScores[round]?.[player.name]?.isDisabled, false);
        }
        // For other rounds, open the status modal to determine if elimination or just not playing
        else {
            setStatusPlayer({ ...player, currentRound: round });
            setOpenStatusModal(true);
        }
    };

    // Handler for player being eliminated
    const handlePlayerEliminated = () => {
        if (!statusPlayer) return;
        updatePlayerStatus(statusPlayer, true, true);
        setOpenStatusModal(false);
        setStatusPlayer(null);
    };

    // Handler for player just not playing this round
    const handlePlayerNotPlaying = () => {
        if (!statusPlayer) return;
        updatePlayerStatus(statusPlayer, true, false);
        setOpenStatusModal(false);
        setStatusPlayer(null);
    };

    // Handler for closing the status modal
    const handleCloseStatusModal = () => {
        setOpenStatusModal(false);
        setStatusPlayer(null);
    };

    // Handler for confirming player reactivation
    const handlePlayerReactivation = () => {
        if (!reactivationPlayer) return;
        const round = reactivationPlayer.currentRound || activeRound;

        // Update UI state by removing the player from the disabled state
        setPlayerScores((prev) => {
            // Create a deep copy of the previous state
            const newState: PlayerScoresByRound = JSON.parse(JSON.stringify(prev));

            // Remove the player's disabled status entry completely
            if (newState[round]?.[reactivationPlayer.name]) {
                delete newState[round][reactivationPlayer.name];
            }

            return newState;
        });

        // Delete the player's score entry from the database
        savePlayerScore(
            reactivationPlayer.id,
            round,
            false,
            null,
            0,
            undefined,
            true
        ).catch(err => console.error(`Error deleting player score: ${err}`));

        setOpenReactivationModal(false);
        setReactivationPlayer(null);
    };

    // Handler for closing the reactivation modal
    const handleCloseReactivationModal = () => {
        setOpenReactivationModal(false);
        setReactivationPlayer(null);
    };

    // Handler for confirming clear scores
    const handleConfirmClearScores = () => {
        if (!clearScoresPlayer) return;
        const round = clearScoresPlayer.currentRound || activeRound;

        // Update UI state
        setPlayerScores((prev) => {
            const roundScores = prev[round] || {};
            const newRoundScores = { ...roundScores };
            delete newRoundScores[clearScoresPlayer.name];

            return {
                ...prev,
                [round]: newRoundScores
            };
        });

        // Delete the player score entry from the database
        deletePlayerScore(
            clearScoresPlayer.id,
            round
        ).catch(err => console.error(`Error deleting player score: ${err}`));

        setOpenClearScoresModal(false);
        setClearScoresPlayer(null);
    };

    // Handler for closing clear scores modal
    const handleCloseClearScoresModal = () => {
        setOpenClearScoresModal(false);
        setClearScoresPlayer(null);
    };

    // Handler for input field changes
    const handleInputChange = (field: keyof ScoreForm, value: string) => {
        if (value === "" || /^-?\d*$/.test(value)) {
            setScoreForm((prev) => ({ ...prev, [field]: value }));

            // Clear error for this field if it was previously marked as error
            if (formErrors[field]) {
                setFormErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[field];
                    return newErrors;
                });
            }
        }
    };

    // Handler for field goal count changes
    const handleFgCountChange = (value: string) => {
        if (value === "" || /^-?\d*$/.test(value)) {
            const count = parseInt(value) || 0;
            setFgCount(count);
            setScoreForm((prev) => ({
                ...prev,
                fg: value,
                fgYardages: Array(count).fill(""),
            }));

            // Clear error for fg field
            if (formErrors.fg) {
                setFormErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.fg;
                    return newErrors;
                });
            }
        }
    };

    // Handler for field goal yardage changes
    const handleFgYardageChange = (index: number, value: string) => {
        if (value === "" || /^-?\d*$/.test(value)) {
            setScoreForm((prev) => {
                const newYardages = [...(prev.fgYardages || [])];
                newYardages[index] = value;
                return { ...prev, fgYardages: newYardages };
            });

            // Clear error for this specific yardage field
            if (formErrors[`fgYardage${index}`]) {
                setFormErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[`fgYardage${index}`];
                    return newErrors;
                });
            }
        }
    };

    // Form submission handler
    const handleSubmitScore = () => {
        if (!selectedPlayer) return;
        const round = selectedPlayer.currentRound || activeRound;

        setSubmitAttempted(true);

        // Validate form before submission
        const newErrors = validateForm(selectedPlayer, scoreForm, fgCount);
        setFormErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        // Calculate score
        const score = calculatePlayerScore(selectedPlayer, scoreForm);

        // Update playerScores state
        setPlayerScores((prev) => {
            const roundScores = prev[round] || {};

            return {
                ...prev,
                [round]: {
                    ...roundScores,
                    [selectedPlayer.name]: {
                        ...selectedPlayer,
                        score,
                        scoreData: { ...scoreForm },
                        isDisabled: false, // Ensure player is enabled when scores are submitted
                    }
                }
            };
        });

        // Save player score to the database
        savePlayerScore(
            selectedPlayer.id,
            round,
            false, // Not disabled since we're setting a score
            null,  // No status reason needed
            score,
            { ...scoreForm }
        ).catch(err => console.error(`Error saving player score: ${err}`));

        handleCloseScoreModal();
    };

    // Shared function to update player status
    const updatePlayerStatus = (player: ExtendedPlayer, isDisabled: boolean, cascade: boolean) => {
        const round = player.currentRound || activeRound;

        setPlayerScores((prev) => {
            // Create a deep copy of the previous state
            const newState: PlayerScoresByRound = JSON.parse(JSON.stringify(prev));

            // Initialize the round if it doesn't exist
            if (!newState[round]) {
                newState[round] = {};
            }

            // Get or create the player entry
            const currentPlayer = newState[round][player.name] || { ...player, currentRound: round };

            // If the player already has scores, don't allow toggling disabled status
            if (currentPlayer.scoreData && isDisabled) {
                return prev;
            }

            // Update status for this round
            const statusReason = isDisabled ? (cascade ? "eliminated" : "notPlaying") : null;

            // Update player in current round
            newState[round][player.name] = {
                ...currentPlayer,
                isDisabled: isDisabled,
                statusReason: statusReason,
                score: isDisabled ? 0 : currentPlayer.score,
                scoreData: isDisabled ? undefined : currentPlayer.scoreData
            };

            // If cascade is true and we're not in Wild Card round,
            // then also disable this player for all subsequent rounds
            if (cascade && isDisabled && round !== "Wild Card") {
                const roundIndex = PLAYOFF_ROUNDS.indexOf(round);
                const subsequentRounds = PLAYOFF_ROUNDS.slice(roundIndex + 1);

                subsequentRounds.forEach(futureRound => {
                    // Initialize the round if it doesn't exist
                    if (!newState[futureRound]) {
                        newState[futureRound] = {};
                    }

                    const futurePlayer = newState[futureRound][player.name] || { ...player, currentRound: futureRound };

                    // Update player in future round
                    newState[futureRound][player.name] = {
                        ...futurePlayer,
                        isDisabled: true,
                        statusReason: "eliminated", // Mark as eliminated in future rounds
                        score: 0,
                        scoreData: undefined
                    };
                });
            }

            return newState;
        });

        // Save this individual player status update to the database
        savePlayerScore(
            player.id,
            round,
            isDisabled,
            isDisabled ? (cascade ? "eliminated" : "notPlaying") : null,
            0,
            undefined
        ).catch(err => console.error(`Error saving player status: ${err}`));

        // If cascading, also save future rounds
        if (cascade && isDisabled && round !== "Wild Card") {
            const roundIndex = PLAYOFF_ROUNDS.indexOf(round);
            const subsequentRounds = PLAYOFF_ROUNDS.slice(roundIndex + 1);

            // Save each future round status
            subsequentRounds.forEach(futureRound => {
                savePlayerScore(
                    player.id,
                    futureRound,
                    true,
                    "eliminated",
                    0,
                    undefined
                ).catch(err => console.error(`Error saving cascaded player status: ${err}`));
            });
        }
    };

    // Return all state and handlers
    return {
        // Current player being edited
        selectedPlayer,

        // Main handlers
        handleEditScore,
        handleTogglePlayerDisabled,

        // Modals state
        modalsState: {
            scoreModal: {
                isOpen: openScoreModal,
                player: selectedPlayer,
                scoreForm,
                formErrors,
                submitAttempted,
                fgCount
            },
            clearScoresModal: {
                isOpen: openClearScoresModal,
                player: clearScoresPlayer
            },
            statusModal: {
                isOpen: openStatusModal,
                player: statusPlayer
            },
            reactivationModal: {
                isOpen: openReactivationModal,
                player: reactivationPlayer
            }
        },

        // Modal handlers
        modalsHandlers: {
            scoreModal: {
                onClose: handleCloseScoreModal,
                onInputChange: handleInputChange,
                onFgCountChange: handleFgCountChange,
                onFgYardageChange: handleFgYardageChange,
                onSubmit: handleSubmitScore
            },
            clearScoresModal: {
                onClose: handleCloseClearScoresModal,
                onConfirm: handleConfirmClearScores
            },
            statusModal: {
                onClose: handleCloseStatusModal,
                onConfirmEliminated: handlePlayerEliminated,
                onConfirmNotPlaying: handlePlayerNotPlaying
            },
            reactivationModal: {
                onClose: handleCloseReactivationModal,
                onConfirm: handlePlayerReactivation
            }
        }
    };
}