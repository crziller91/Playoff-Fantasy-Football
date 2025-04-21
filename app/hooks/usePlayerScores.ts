import { useState, useEffect } from 'react';
import { PlayerScoresByRound, ExtendedPlayer } from '../types';
import { fetchPlayerScores, savePlayerScore, bulkSavePlayerScores, convertToApiFormat } from '../services/scoreService';

// This hook manages player scores with database persistence
export const usePlayerScores = (
    isDraftFinished: boolean,
    initialScores?: PlayerScoresByRound
) => {
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
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error saving player score';
            console.error(`Error saving player score: ${message}`);
            setError(message);
            throw err; // Re-throw for component handling
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

    return {
        playerScores,
        setPlayerScores,
        isLoading,
        error,
        savePlayerScoreItem,
        resetScores
    };
};