import { useState, useEffect } from 'react';
import { PlayerScoresByRound } from '../types';
import { fetchPlayerScores } from '../services/scoreService';
import { PLAYOFF_ROUNDS } from '../constants/playoffs';
import { getOrderedTeamPicks } from '../utils/teamUtils';

interface UseTeamsViewStateProps {
    initialActiveRound?: string;
    externalPlayerScores?: PlayerScoresByRound;
    externalSetPlayerScores?: React.Dispatch<React.SetStateAction<PlayerScoresByRound>>;
    isDraftFinished: boolean;
    teams: string[];
    draftPicks: any;
}

export function useTeamsViewState({
    initialActiveRound,
    externalPlayerScores,
    externalSetPlayerScores,
    isDraftFinished,
    teams,
    draftPicks
}: UseTeamsViewStateProps) {
    // Active playoff round
    const [activeRound, setActiveRound] = useState<string>(initialActiveRound || "Wild Card");

    // Local state for player scores if external state not provided
    const [localPlayerScores, setLocalPlayerScores] = useState<PlayerScoresByRound>({
        "Wild Card": {},
        "Divisional": {},
        "Conference": {},
        "Superbowl": {}
    });

    // Loading state
    const [isLoading, setIsLoading] = useState(true);

    // Use external state if provided, otherwise use local state
    const playerScores = externalPlayerScores || localPlayerScores;
    const setPlayerScores = externalSetPlayerScores || setLocalPlayerScores;

    // Round validation state: which rounds are available to access
    const [roundValidation, setRoundValidation] = useState<{ [round: string]: boolean }>({
        "Wild Card": true,
        "Divisional": false,
        "Conference": false,
        "Superbowl": false
    });

    // Load player scores from the database on component mount
    useEffect(() => {
        if (!isDraftFinished) {
            setIsLoading(false);
            return;
        }

        const loadPlayerScores = async () => {
            try {
                setIsLoading(true);
                const scores = await fetchPlayerScores();
                // Only update if we have scores and aren't using external state management
                if (scores && Object.keys(scores).length > 0 && !externalPlayerScores) {
                    setLocalPlayerScores(scores);
                }
            } catch (error) {
                console.error("Error loading player scores:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPlayerScores();
    }, [isDraftFinished, externalPlayerScores]);

    // Update round validation whenever playerScores changes
    useEffect(() => {
        // Function to check if a round is complete
        const isRoundComplete = (round: string) => {
            const allTeamPlayers: Array<{ id: number; name: string; position: string; teamName?: string }> = [];

            // Collect all players from all teams
            teams.forEach(team => {
                const teamPicks = getOrderedTeamPicks(team, draftPicks);
                teamPicks.forEach(({ player }) => {
                    allTeamPlayers.push(player);
                });
            });

            // Check if all players have been scored or marked as not playing
            return allTeamPlayers.every(player => {
                const playerData = playerScores[round]?.[player.name];
                return playerData?.scoreData || playerData?.isDisabled === true;
            });
        };

        const wildCardComplete = isRoundComplete("Wild Card");
        const divisionalComplete = isRoundComplete("Divisional");
        const conferenceComplete = isRoundComplete("Conference");

        setRoundValidation({
            "Wild Card": true, // Always enabled
            "Divisional": wildCardComplete,
            "Conference": wildCardComplete && divisionalComplete,
            "Superbowl": wildCardComplete && divisionalComplete && conferenceComplete
        });
    }, [playerScores, teams, draftPicks]);

    return {
        activeRound,
        setActiveRound,
        playerScores,
        setPlayerScores,
        isLoading,
        roundValidation
    };
}