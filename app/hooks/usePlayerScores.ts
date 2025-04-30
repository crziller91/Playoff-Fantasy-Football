import { useState, useEffect, useCallback } from 'react';
import { PlayerScoresByRound, ExtendedPlayer } from '../types';
import {
    fetchPlayerScores,
    savePlayerScore,
    bulkSavePlayerScores,
    deletePlayerScore,
    convertToApiFormat,
    recalculatePlayerScores
} from '../services/scoreService';
import { useStore } from '../stores/StoreContext';

// This hook manages player scores with database persistence
export const usePlayerScores = (
    isDraftFinished: boolean,
    initialScores?: PlayerScoresByRound
) => {
    const store = useStore(); // Get the store to access socket
    const [playerScores, setPlayerScores] = useState<PlayerScoresByRound>(
        initialScores || {
            "Wild Card": {},
            "Divisional": {},
            "Conference": {},
            "Superbowl": {}
        }
    );
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lastSavedScores, setLastSavedScores] = useState<string>("{}");

    // Load player scores from the database on component mount
    useEffect(() => {
        if (!isDraftFinished) {
            setIsLoading(false);
            return;
        }

        const loadPlayerScores = async () => {
            try {
                setIsLoading(true);
                setError(null);
                const scores = await fetchPlayerScores();

                if (scores && Object.keys(scores).length > 0) {
                    setPlayerScores(scores);
                    setLastSavedScores(JSON.stringify(scores));
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error loading player scores';
                console.error("Error loading player scores:", message);
                setError(message);
            } finally {
                setIsLoading(false);
            }
        };

        loadPlayerScores();
    }, [isDraftFinished]);

    // Save player scores to the database when they change
    useEffect(() => {
        // Don't save if we're still loading or draft isn't finished
        if (isLoading || !isDraftFinished) return;

        // Don't save if there are no player scores
        if (Object.values(playerScores).every(round => Object.keys(round).length === 0)) return;

        // Convert the current scores to a string for comparison
        const currentScoresStr = JSON.stringify(playerScores);

        // Only save if scores have changed
        if (currentScoresStr === lastSavedScores) return;

        const saveScores = async () => {
            try {
                // Convert player scores to API format
                const apiFormatScores = convertToApiFormat(playerScores);

                // Only save if we have scores to save
                if (apiFormatScores.length > 0) {
                    await bulkSavePlayerScores(apiFormatScores);
                    setLastSavedScores(currentScoresStr);
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Unknown error saving player scores';
                console.error("Error saving player scores:", message);
                setError(message);
            }
        };

        // Debounce to avoid too many API calls
        const timeoutId = setTimeout(() => {
            saveScores();
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [playerScores, isDraftFinished, isLoading, lastSavedScores]);

    // Save a single player score 
    const savePlayerScoreItem = async (
        player: ExtendedPlayer,
        round: string,
        isDisabled: boolean,
        statusReason: "eliminated" | "notPlaying" | null,
        score: number,
        scoreData?: any
    ) => {
        try {
            await savePlayerScore(
                player.id,
                round,
                isDisabled,
                statusReason,
                score,
                scoreData
            );

            // Emit socket event for real-time update to other clients
            if (store.socket) {
                store.socket.emit('playerScoreUpdate', {
                    round,
                    playerName: player.name,
                    scoreData: {
                        ...player,
                        score,
                        isDisabled,
                        statusReason,
                        scoreData
                    }
                });
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error saving player score';
            console.error(`Error saving player score: ${message}`);
            setError(message);
            throw err; // Re-throw for component handling
        }
    };

    // Delete player score
    const deletePlayerScoreItem = async (player: ExtendedPlayer, round: string) => {
        try {
            // Call the API service, passing only playerId and round as expected
            await deletePlayerScore(player.id, round);

            // Emit socket event for real-time update to other clients
            if (store.socket) {
                store.socket.emit('playerScoreUpdate', {
                    round,
                    playerName: player.name,
                    isDeleted: true
                });
            }

            return true;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error deleting player score';
            console.error(`Error deleting player score: ${message}`);
            setError(message);
            return false;
        }
    };

    // Reset scores
    const resetScores = () => {
        setPlayerScores({
            "Wild Card": {},
            "Divisional": {},
            "Conference": {},
            "Superbowl": {}
        });
        setLastSavedScores("{}");
    };

    // Recalculate scores after scoring rule changes
    const recalculateScores = async (position?: string) => {
        try {
            const result = await recalculatePlayerScores(position);

            // If scores were recalculated, refresh them from the server
            if (result.updated > 0) {
                const refreshedScores = await fetchPlayerScores();
                setPlayerScores(refreshedScores);
                setLastSavedScores(JSON.stringify(refreshedScores));
            }

            return result;
        } catch (error) {
            console.error('Error recalculating scores:', error);
            throw error;
        }
    };

    return {
        playerScores,
        setPlayerScores,
        isLoading,
        error,
        savePlayerScoreItem,
        deletePlayerScoreItem,
        resetScores,
        recalculateScores
    };
};