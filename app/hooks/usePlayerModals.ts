import { useState, useEffect } from 'react';
import { ExtendedPlayer, ScoreForm, FormErrors, PlayerScoresByRound } from '../types';
import { validateForm, calculatePlayerScore } from '../utils/scoreCalculator';
import { savePlayerScore, deletePlayerScore } from '../services/scoreService';
import { PLAYOFF_ROUNDS } from '../constants/playoffs';
import { usePermissions } from './usePermissions';
import { Socket } from 'socket.io-client';

interface UsePlayerModalsProps {
    playerScores: PlayerScoresByRound;
    setPlayerScores: (scores: PlayerScoresByRound) => void;
    activeRound: string;
    deletePlayerScore?: (player: ExtendedPlayer, round: string) => Promise<boolean>;
    socket?: Socket | null; // Add socket as a parameter
}

export function usePlayerModals({
    playerScores,
    setPlayerScores,
    activeRound,
    deletePlayerScore,
    socket // Accept socket as a parameter
}: UsePlayerModalsProps) {
    // Get permissions
    const { canEditScores } = usePermissions();

    // Selected player for editing scores
    const [selectedPlayer, setSelectedPlayer] = useState<ExtendedPlayer | null>(null);

    // Score form state
    const [scoreForm, setScoreForm] = useState<ScoreForm>({});
    const [initialScoreForm, setInitialScoreForm] = useState<ScoreForm>({});
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [fgCount, setFgCount] = useState(0);
    const [initialFgCount, setInitialFgCount] = useState(0);

    // Modal visibility states
    const [openScoreModal, setOpenScoreModal] = useState(false);
    const [openClearScoresModal, setOpenClearScoresModal] = useState(false);
    const [openStatusModal, setOpenStatusModal] = useState(false);
    const [openReactivationModal, setOpenReactivationModal] = useState(false);

    // Players for various modals
    const [clearScoresPlayer, setClearScoresPlayer] = useState<ExtendedPlayer | null>(null);
    const [statusPlayer, setStatusPlayer] = useState<ExtendedPlayer | null>(null);
    const [reactivationPlayer, setReactivationPlayer] = useState<ExtendedPlayer | null>(null);

    // Helper function to check if scores have changed
    const hasScoresChanged = () => {
        // Compare each field in current form with initial form
        const formKeys = Array.from(new Set([
            ...Object.keys(scoreForm),
            ...Object.keys(initialScoreForm)
        ]));

        for (let i = 0; i < formKeys.length; i++) {
            const key = formKeys[i];
            // Skip the fgYardages array - we'll check that separately
            if (key === 'fgYardages') continue;

            if (scoreForm[key as keyof ScoreForm] !== initialScoreForm[key as keyof ScoreForm]) {
                return true;
            }
        }

        // Check if fg count changed
        if (fgCount !== initialFgCount) return true;

        // Check if any yardage values changed
        if (scoreForm.fgYardages && initialScoreForm.fgYardages) {
            if (scoreForm.fgYardages.length !== initialScoreForm.fgYardages.length) return true;

            for (let i = 0; i < scoreForm.fgYardages.length; i++) {
                if (scoreForm.fgYardages[i] !== initialScoreForm.fgYardages[i]) return true;
            }
        } else if (scoreForm.fgYardages || initialScoreForm.fgYardages) {
            // One has yardages and the other doesn't
            return true;
        }

        return false;
    };

    // Handler for opening the score editing modal
    const handleEditScore = (player: ExtendedPlayer) => {
        // Check permissions before proceeding
        if (!canEditScores) return;

        setSelectedPlayer({ ...player, currentRound: activeRound });
        // Load existing score data if available
        const currentScoreData = playerScores[activeRound]?.[player.name]?.scoreData || {};
        setScoreForm(currentScoreData);
        setInitialScoreForm(JSON.parse(JSON.stringify(currentScoreData)));

        const fgCountValue = parseInt(currentScoreData?.fg || "0", 10) || 0;
        setFgCount(fgCountValue);
        setInitialFgCount(fgCountValue);

        setOpenScoreModal(true);
        setFormErrors({});
        setSubmitAttempted(false);
    };

    // Handler for closing the score modal
    const handleCloseScoreModal = () => {
        setOpenScoreModal(false);
        setSelectedPlayer(null);
        setScoreForm({});
        setInitialScoreForm({});
        setFgCount(0);
        setInitialFgCount(0);
        setFormErrors({});
        setSubmitAttempted(false);
    };

    // Handler for closing the clear scores modal
    const handleCloseClearScoresModal = () => {
        setOpenClearScoresModal(false);
        setClearScoresPlayer(null);
    };

    // Handler for toggling player disabled status
    const handleTogglePlayerDisabled = (player: ExtendedPlayer, isClearScores?: boolean) => {
        // Check permissions before proceeding
        if (!canEditScores) return;

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
        if (!canEditScores || !statusPlayer) return;
        updatePlayerStatus(statusPlayer, true, true);
        setOpenStatusModal(false);
        setStatusPlayer(null);
    };

    // Handler for player just not playing this round
    const handlePlayerNotPlaying = () => {
        if (!canEditScores || !statusPlayer) return;
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
    const handlePlayerReactivation = async () => {
        if (!canEditScores || !reactivationPlayer) return;
        const round = reactivationPlayer.currentRound || activeRound;

        try {
            // We'll let the server handle the score update, rather than updating UI directly
            // This should prevent duplicate events

            // Save to database with reactivation flag
            await savePlayerScore(
                reactivationPlayer.id,
                round,
                false,  // Not disabled
                null,   // No status reason
                0,      // Reset score
                undefined,
                true    // This parameter indicates reactivation
            );

            // No need to emit a socket event here as the server will do that
            // when the savePlayerScore API is called

            // Just for immediate UI feedback, update the local state
            const newScores = JSON.parse(JSON.stringify(playerScores)); // Deep copy
            if (newScores[round]?.[reactivationPlayer.name]) {
                newScores[round][reactivationPlayer.name] = {
                    ...newScores[round][reactivationPlayer.name],
                    isDisabled: false,
                    statusReason: null
                };
            }
            setPlayerScores(newScores);

        } catch (err) {
            console.error(`Error reactivating player: ${err}`);
        }

        setOpenReactivationModal(false);
        setReactivationPlayer(null);
    };

    // Handler for closing the reactivation modal
    const handleCloseReactivationModal = () => {
        setOpenReactivationModal(false);
        setReactivationPlayer(null);
    };

    // Handler for confirming clear scores
    const handleConfirmClearScores = async () => {
        if (!canEditScores || !clearScoresPlayer) return;
        const round = clearScoresPlayer.currentRound || activeRound;

        // Update UI state using a plain object rather than a callback
        const newScores = JSON.parse(JSON.stringify(playerScores)); // Deep copy
        if (newScores[round] && newScores[round][clearScoresPlayer.name]) {
            delete newScores[round][clearScoresPlayer.name];
        }
        setPlayerScores(newScores);

        // If deletePlayerScore function is provided, use it
        if (deletePlayerScore) {
            await deletePlayerScore(clearScoresPlayer, round);
        } else {
            // Fallback to the old approach if function isn't provided
            // This code should not run if you pass the function correctly
            console.warn('deletePlayerScore function not provided to usePlayerModals');
            try {
                await fetch(`/api/player-scores/delete`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        playerId: clearScoresPlayer.id,
                        round
                    }),
                });
            } catch (err) {
                console.error(`Error deleting player score: ${err}`);
            }
        }

        setOpenClearScoresModal(false);
        setClearScoresPlayer(null);
    };

    // Handler for input field changes
    const handleInputChange = (field: keyof ScoreForm, value: string) => {
        if (!canEditScores) return;

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
        if (!canEditScores) return;

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
        if (!canEditScores) return;

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
    const handleSubmitScore = async () => {
        if (!canEditScores || !selectedPlayer) return;
        const round = selectedPlayer.currentRound || activeRound;

        setSubmitAttempted(true);

        // Validate form before submission
        const newErrors = validateForm(selectedPlayer, scoreForm, fgCount);
        setFormErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            return;
        }

        // Check if anything actually changed
        if (!hasScoresChanged()) {
            // Nothing changed, just close the modal without saving
            handleCloseScoreModal();
            return;
        }

        try {
            // Calculate score asynchronously
            const score = await calculatePlayerScore(selectedPlayer, scoreForm);

            // Update playerScores state - using direct object instead of callback
            const newScores = JSON.parse(JSON.stringify(playerScores));
            if (!newScores[round]) {
                newScores[round] = {};
            }
            newScores[round][selectedPlayer.name] = {
                ...selectedPlayer,
                score,
                scoreData: { ...scoreForm },
                isDisabled: false
            };
            setPlayerScores(newScores);

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
        } catch (error) {
            console.error("Error calculating score:", error);
            // You may want to set an error state here to show to the user
        }
    };

    // Shared function to update player status
    const updatePlayerStatus = (player: ExtendedPlayer, isDisabled: boolean, cascade: boolean) => {
        if (!canEditScores) return;

        const round = player.currentRound || activeRound;

        // Create a deep copy of the current state
        const newState = JSON.parse(JSON.stringify(playerScores)); // Deep copy

        // Initialize the round if it doesn't exist
        if (!newState[round]) {
            newState[round] = {};
        }

        // Get or create the player entry
        const currentPlayer = newState[round][player.name] || { ...player, currentRound: round };

        // If the player already has scores, don't allow toggling disabled status
        if (currentPlayer.scoreData && isDisabled) {
            return;
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

        // Update the scores state
        setPlayerScores(newState);

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