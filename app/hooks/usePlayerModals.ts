import { useState, useEffect } from 'react';
import { ExtendedPlayer, ScoreForm, FormErrors, PlayerScoresByRound, Player } from '../types';
import { validateForm, calculatePlayerScore } from '../utils/scoreCalculator';
import { deletePlayerScore } from '../services/scoreService';
import { PLAYOFF_ROUNDS } from '../constants/playoffs';
import { usePermissions } from './usePermissions';
import { Socket } from 'socket.io-client';
import { searchPlayerStats } from '../services/espnStatsService';
import { toast } from 'react-toastify';

interface UsePlayerModalsProps {
    playerScores: PlayerScoresByRound;
    setPlayerScores: (scores: PlayerScoresByRound) => void;
    activeRound: string;
    deletePlayerScore?: (player: ExtendedPlayer, round: string) => Promise<boolean>;
    socket?: Socket | null; // Add socket as a parameter
    allPlayers?: Player[]; // All players for QB backup selection
}

export function usePlayerModals({
    playerScores,
    setPlayerScores,
    activeRound,
    deletePlayerScore,
    socket, // Accept socket as a parameter
    allPlayers = [] // All players for QB backup selection
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
    const [openZeroStatsModal, setOpenZeroStatsModal] = useState(false);
    const [openSeasonEndingModal, setOpenSeasonEndingModal] = useState(false);
    const [openQBBackupModal, setOpenQBBackupModal] = useState(false);

    // Players for various modals
    const [clearScoresPlayer, setClearScoresPlayer] = useState<ExtendedPlayer | null>(null);
    const [statusPlayer, setStatusPlayer] = useState<ExtendedPlayer | null>(null);
    const [reactivationPlayer, setReactivationPlayer] = useState<ExtendedPlayer | null>(null);
    const [zeroStatsPlayer, setZeroStatsPlayer] = useState<ExtendedPlayer | null>(null);
    const [seasonEndingPlayer, setSeasonEndingPlayer] = useState<ExtendedPlayer | null>(null);
    const [qbBackupPlayer, setQBBackupPlayer] = useState<ExtendedPlayer | null>(null);

    // Auto-fill loading state - track which player is being auto-filled
    const [autoFillLoadingPlayerId, setAutoFillLoadingPlayerId] = useState<number | null>(null);
    const [zeroStatsData, setZeroStatsData] = useState<{ scoreForm: ScoreForm; score: number } | null>(null);

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

        // Get current player data from scores to include backup info
        const currentPlayerData = playerScores[activeRound]?.[player.name];

        setSelectedPlayer({
            ...player,
            currentRound: activeRound,
            backupPlayerId: currentPlayerData?.backupPlayerId,
            backupPlayerName: currentPlayerData?.backupPlayerName
        });
        // Load existing score data if available
        const currentScoreData = currentPlayerData?.scoreData || {};
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

    // Handler for player just not playing this round (opens season-ending injury modal)
    const handlePlayerNotPlaying = () => {
        if (!canEditScores || !statusPlayer) return;
        // Close status modal and open season-ending injury modal
        setOpenStatusModal(false);
        setSeasonEndingPlayer(statusPlayer);
        setOpenSeasonEndingModal(true);
        setStatusPlayer(null);
    };

    // Handler for closing the status modal
    const handleCloseStatusModal = () => {
        setOpenStatusModal(false);
        setStatusPlayer(null);
    };

    // Handler for season-ending injury confirmation
    const handleSeasonEndingConfirm = () => {
        if (!canEditScores || !seasonEndingPlayer) return;
        // Update with season-ending injury (cascade to future rounds)
        updatePlayerStatus(seasonEndingPlayer, true, true, "injured");
        setOpenSeasonEndingModal(false);
        setSeasonEndingPlayer(null);
    };

    // Handler for not season-ending injury confirmation
    const handleNotSeasonEndingConfirm = () => {
        if (!canEditScores || !seasonEndingPlayer) return;
        // Update without cascade (just this round)
        updatePlayerStatus(seasonEndingPlayer, true, false, "injured");
        setOpenSeasonEndingModal(false);
        setSeasonEndingPlayer(null);
    };

    // Handler for closing the season-ending injury modal
    const handleCloseSeasonEndingModal = () => {
        setOpenSeasonEndingModal(false);
        setSeasonEndingPlayer(null);
    };

    // Handler for opening the QB swap modal
    const handleOpenQBSwapModal = (player: ExtendedPlayer) => {
        if (!canEditScores) return;
        if (player.position !== "QB") return;

        // Get current player data from scores to include backup info
        const currentPlayerData = playerScores[activeRound]?.[player.name];

        setQBBackupPlayer({
            ...player,
            currentRound: activeRound,
            backupPlayerId: currentPlayerData?.backupPlayerId,
            backupPlayerName: currentPlayerData?.backupPlayerName
        });
        setOpenQBBackupModal(true);
    };

    // Handler for QB swap confirmation
    const handleQBSwapConfirm = (backupPlayer: Player | null, applyToFutureRounds: boolean, isRevert?: boolean) => {
        if (!canEditScores || !qbBackupPlayer) return;

        // If not reverting and no backup player, don't proceed
        if (!isRevert && !backupPlayer) return;

        const round = qbBackupPlayer.currentRound || activeRound;

        // Create a deep copy of the current state
        const newState = JSON.parse(JSON.stringify(playerScores));

        // Initialize the round if it doesn't exist
        if (!newState[round]) {
            newState[round] = {};
        }

        // Get or create the player entry
        const currentPlayer = newState[round][qbBackupPlayer.name] || { ...qbBackupPlayer, currentRound: round };

        if (isRevert) {
            // Revert: clear backup QB info
            newState[round][qbBackupPlayer.name] = {
                ...currentPlayer,
                backupPlayerId: undefined,
                backupPlayerName: undefined
            };
        } else {
            // Update player in current round with backup QB info
            newState[round][qbBackupPlayer.name] = {
                ...currentPlayer,
                backupPlayerId: backupPlayer!.id,
                backupPlayerName: backupPlayer!.name
            };
        }

        // If applyToFutureRounds is true, also update subsequent rounds
        if (applyToFutureRounds && round !== "Superbowl") {
            const roundIndex = PLAYOFF_ROUNDS.indexOf(round);
            const subsequentRounds = PLAYOFF_ROUNDS.slice(roundIndex + 1);

            subsequentRounds.forEach(futureRound => {
                // Initialize the round if it doesn't exist
                if (!newState[futureRound]) {
                    newState[futureRound] = {};
                }

                const futurePlayer = newState[futureRound][qbBackupPlayer.name] || { ...qbBackupPlayer, currentRound: futureRound };

                if (isRevert) {
                    // Revert: clear backup QB info
                    newState[futureRound][qbBackupPlayer.name] = {
                        ...futurePlayer,
                        backupPlayerId: undefined,
                        backupPlayerName: undefined
                    };
                } else {
                    // Update player in future round with backup QB info
                    newState[futureRound][qbBackupPlayer.name] = {
                        ...futurePlayer,
                        backupPlayerId: backupPlayer!.id,
                        backupPlayerName: backupPlayer!.name
                    };
                }
            });
        }

        // Update the scores state
        setPlayerScores(newState);

        // Clean up
        setOpenQBBackupModal(false);
        setQBBackupPlayer(null);
    };

    // Handler for closing the QB backup modal
    const handleCloseQBBackupModal = () => {
        setOpenQBBackupModal(false);
        setQBBackupPlayer(null);
    };

    // Handler for confirming player reactivation
    const handlePlayerReactivation = async () => {
        if (!canEditScores || !reactivationPlayer) return;
        const round = reactivationPlayer.currentRound || activeRound;

        try {
            // Update the local state to reactivate the player
            const newScores = JSON.parse(JSON.stringify(playerScores)); // Deep copy
            if (newScores[round]?.[reactivationPlayer.name]) {
                newScores[round][reactivationPlayer.name] = {
                    ...newScores[round][reactivationPlayer.name],
                    isDisabled: false,
                    statusReason: null,
                    score: 0,
                    scoreData: undefined
                };
            }
            setPlayerScores(newScores);

            // The setPlayerScores call above will trigger the bulk save through ScoresStore
            // No need to call savePlayerScore individually here

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

    // Handler for closing the zero stats modal
    const handleCloseZeroStatsModal = () => {
        setOpenZeroStatsModal(false);
        setZeroStatsPlayer(null);
        setZeroStatsData(null);
    };

    // Handler for deactivating player from zero stats modal
    const handleZeroStatsDeactivate = () => {
        if (!zeroStatsPlayer) return;

        const round = zeroStatsPlayer.currentRound || activeRound;

        // If Wild Card round, deactivate immediately without asking status
        if (round === "Wild Card") {
            updatePlayerStatus(zeroStatsPlayer, true, false);
            handleCloseZeroStatsModal();
        } else {
            // For other rounds, trigger the status modal to ask if eliminated or not playing
            setStatusPlayer(zeroStatsPlayer);
            setOpenZeroStatsModal(false);
            setOpenStatusModal(true);
        }
    };

    // Handler for keeping zero score from zero stats modal
    const handleZeroStatsKeepScore = async () => {
        if (!canEditScores || !zeroStatsPlayer || !zeroStatsData) return;

        const round = zeroStatsPlayer.currentRound || activeRound;
        const { scoreForm, score } = zeroStatsData;

        // Update playerScores state
        const newScores = JSON.parse(JSON.stringify(playerScores));
        if (!newScores[round]) {
            newScores[round] = {};
        }
        newScores[round][zeroStatsPlayer.name] = {
            ...zeroStatsPlayer,
            score,
            scoreData: { ...scoreForm },
            isDisabled: false
        };
        setPlayerScores(newScores);

        // The setPlayerScores call above will trigger the bulk save through ScoresStore
        // No need to call savePlayerScore individually here

        console.log(`Kept zero score for ${zeroStatsPlayer.name}`);
        handleCloseZeroStatsModal();
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

            // The setPlayerScores call above will trigger the bulk save through ScoresStore
            // No need to call savePlayerScore individually here

            handleCloseScoreModal();
        } catch (error) {
            console.error("Error calculating score:", error);
            // You may want to set an error state here to show to the user
        }
    };

    // Shared function to update player status
    const updatePlayerStatus = (
        player: ExtendedPlayer,
        isDisabled: boolean,
        cascade: boolean,
        reason?: "eliminated" | "notPlaying" | "injured",
        backupPlayerId?: number,
        backupPlayerName?: string
    ) => {
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

        // Determine status reason - use provided reason or fall back to old logic
        let statusReason: "eliminated" | "notPlaying" | "injured" | null = null;
        if (isDisabled) {
            if (reason) {
                statusReason = reason;
            } else {
                statusReason = cascade ? "eliminated" : "notPlaying";
            }
        }

        // Update player in current round
        newState[round][player.name] = {
            ...currentPlayer,
            isDisabled: isDisabled,
            statusReason: statusReason,
            score: isDisabled ? 0 : currentPlayer.score,
            scoreData: isDisabled ? undefined : currentPlayer.scoreData,
            backupPlayerId: backupPlayerId || undefined,
            backupPlayerName: backupPlayerName || undefined
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

                // Determine future round status reason
                const futureStatusReason = reason === "injured" ? "injured" : "eliminated";

                // Update player in future round
                newState[futureRound][player.name] = {
                    ...futurePlayer,
                    isDisabled: true,
                    statusReason: futureStatusReason,
                    score: 0,
                    scoreData: undefined,
                    backupPlayerId: backupPlayerId || undefined,
                    backupPlayerName: backupPlayerName || undefined
                };
            });
        }

        // Update the scores state
        setPlayerScores(newState);

        // The setPlayerScores call above will trigger the bulk save through ScoresStore
        // This will save both the current round and any cascaded future rounds
        // No need to call savePlayerScore individually here
    };

    // Handler for auto-filling scores from ESPN and submitting automatically
    const handleAutoFillScore = async (player: ExtendedPlayer) => {
        if (!canEditScores) return;

        // Set loading state for this player
        setAutoFillLoadingPlayerId(player.id);

        try {
            // Check if this is a QB with a backup assigned in the current round
            const currentPlayerData = playerScores[activeRound]?.[player.name];
            const backupPlayerName = currentPlayerData?.backupPlayerName;
            const hasBackupQB = player.position === "QB" && backupPlayerName;

            // Use backup QB name if swapped, otherwise use original player name
            const playerNameToSearch = hasBackupQB ? backupPlayerName : player.name;

            console.log(`Auto-filling scores for ${playerNameToSearch} (${player.position})${hasBackupQB ? ` [Backup for ${player.name}]` : ''}`);

            // Fetch stats from ESPN using the active QB name
            const stats = await searchPlayerStats(playerNameToSearch, player.position, player.teamName);

            if (!stats) {
                console.error("No stats found for this player");
                setAutoFillLoadingPlayerId(null);
                return;
            }

            // Build score form from stats, defaulting missing fields to "0"
            const autoScoreForm: ScoreForm = {};

            // Map stats to form fields based on position, set missing fields to "0"
            if (player.position === 'QB') {
                autoScoreForm.touchdowns = stats.touchdowns?.toString() || "0";
                autoScoreForm.yards = stats.yards?.toString() || "0";
                autoScoreForm.interceptions = stats.interceptions?.toString() || "0";
                autoScoreForm.completions = stats.completions?.toString() || "0";
                autoScoreForm.rushingTouchdowns = stats.rushingTouchdowns?.toString() || "0";
                autoScoreForm.rushingYards = stats.rushingYards?.toString() || "0";
                autoScoreForm.rushingAttempts = stats.rushingAttempts?.toString() || "0";
                autoScoreForm.twoPointConversions = "0"; // Not available in ESPN API
                autoScoreForm.fumblesLost = "0"; // Not available in ESPN API for QBs
            } else if (player.position === 'RB') {
                autoScoreForm.touchdowns = stats.touchdowns?.toString() || "0";
                autoScoreForm.rushingYards = stats.rushingYards?.toString() || "0";
                autoScoreForm.rushingAttempts = stats.rushingAttempts?.toString() || "0";
                autoScoreForm.receivingTouchdowns = stats.receivingTouchdowns?.toString() || "0";
                autoScoreForm.receivingYards = stats.receivingYards?.toString() || "0";
                autoScoreForm.receptions = stats.receptions?.toString() || "0";
                autoScoreForm.fumblesLost = stats.fumblesLost?.toString() || "0";
                autoScoreForm.passingTouchdowns = "0"; // Not available in ESPN API
                autoScoreForm.twoPointConversions = "0"; // Not available in ESPN API
            } else if (player.position === 'WR' || player.position === 'TE') {
                autoScoreForm.touchdowns = stats.touchdowns?.toString() || "0";
                autoScoreForm.receivingYards = stats.receivingYards?.toString() || "0";
                autoScoreForm.receptions = stats.receptions?.toString() || "0";
                autoScoreForm.rushingTouchdowns = stats.rushingTouchdowns?.toString() || "0";
                autoScoreForm.rushingYards = stats.rushingYards?.toString() || "0";
                autoScoreForm.rushingAttempts = stats.rushingAttempts?.toString() || "0";
                autoScoreForm.fumblesLost = stats.fumblesLost?.toString() || "0";
                autoScoreForm.passingTouchdowns = "0"; // Not available in ESPN API
                autoScoreForm.twoPointConversions = "0"; // Not available in ESPN API
            } else if (player.position === 'K') {
                autoScoreForm.pat = stats.pat?.toString() || "0";
                autoScoreForm.fg = stats.fg?.toString() || "0";
                autoScoreForm.fgMisses = stats.fgMisses?.toString() || "0";
                // Handle field goal yardages
                if (stats.fgYardages && Array.isArray(stats.fgYardages)) {
                    autoScoreForm.fgYardages = stats.fgYardages.map(y => y.toString());
                } else {
                    autoScoreForm.fgYardages = [];
                }
            }

            // Calculate score
            const score = await calculatePlayerScore(player, autoScoreForm);

            // Check if all stats are zero (score is 0)
            if (score === 0) {
                // Store the player and score data for the modal
                setZeroStatsPlayer({ ...player, currentRound: activeRound });
                setZeroStatsData({ scoreForm: autoScoreForm, score });
                setOpenZeroStatsModal(true);
                setAutoFillLoadingPlayerId(null);
                return;
            }

            // Update playerScores state
            const round = activeRound;
            const newScores = JSON.parse(JSON.stringify(playerScores));
            if (!newScores[round]) {
                newScores[round] = {};
            }
            newScores[round][player.name] = {
                ...player,
                score,
                scoreData: { ...autoScoreForm },
                isDisabled: false,
                // Preserve backup QB info if it exists
                backupPlayerId: currentPlayerData?.backupPlayerId,
                backupPlayerName: currentPlayerData?.backupPlayerName
            };
            setPlayerScores(newScores);

            // The setPlayerScores call above will trigger the bulk save through ScoresStore
            // No need to call savePlayerScore individually here

            console.log(`Successfully auto-filled and saved scores for ${playerNameToSearch}${hasBackupQB ? ` (backup for ${player.name})` : ''}`);
        } catch (error) {
            // Display user-friendly error message
            const errorMessage = error instanceof Error ? error.message : "Failed to fetch stats from ESPN";
            toast.error(errorMessage);
            // Log error without full stack trace to avoid Next.js error overlay
            console.log(`Error auto-filling score for ${player.name}:`, errorMessage);
        } finally {
            // Clear loading state
            setAutoFillLoadingPlayerId(null);
        }
    };

    // Return all state and handlers
    return {
        // Current player being edited
        selectedPlayer,

        // Main handlers
        handleEditScore,
        handleTogglePlayerDisabled,
        handleAutoFillScore,
        handleOpenQBSwapModal,

        // Loading state
        autoFillLoadingPlayerId,

        // All players (for QB backup selection)
        allPlayers,

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
            },
            zeroStatsModal: {
                isOpen: openZeroStatsModal,
                player: zeroStatsPlayer
            },
            seasonEndingModal: {
                isOpen: openSeasonEndingModal,
                player: seasonEndingPlayer
            },
            qbBackupModal: {
                isOpen: openQBBackupModal,
                player: qbBackupPlayer
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
            },
            zeroStatsModal: {
                onClose: handleCloseZeroStatsModal,
                onConfirmDeactivate: handleZeroStatsDeactivate,
                onKeepZeroScore: handleZeroStatsKeepScore
            },
            seasonEndingModal: {
                onClose: handleCloseSeasonEndingModal,
                onConfirmSeasonEnding: handleSeasonEndingConfirm,
                onConfirmNotSeasonEnding: handleNotSeasonEndingConfirm
            },
            qbBackupModal: {
                onClose: handleCloseQBBackupModal,
                onConfirm: handleQBSwapConfirm
            }
        }
    };
}