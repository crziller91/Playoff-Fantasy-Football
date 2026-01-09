import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from './RootStore';
import { PlayerScoresByRound, ExtendedPlayer, ScoreForm } from '../types';
import {
    fetchPlayerScores,
    savePlayerScore,
    bulkSavePlayerScores,
    deletePlayerScore,
    convertToApiFormat,
    recalculatePlayerScores
} from '../services/scoreService';
import { calculatePlayerScore } from '../utils/scoreCalculator';
import { PLAYOFF_ROUNDS } from '../constants/playoffs';
import { getOrderedTeamPicks } from '../utils/teamUtils';

export class ScoresStore {
    rootStore: RootStore;
    playerScores: PlayerScoresByRound = {
        "Wild Card": {},
        "Divisional": {},
        "Conference": {},
        "Superbowl": {}
    };
    activeRound: string = "Wild Card";
    isLoading: boolean = false;
    error: string | null = null;
    lastSavedScores: string = "{}";
    scoresLoaded: boolean = false; // Track if scores have been loaded

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this, { rootStore: false });
    }

    loadPlayerScores = async () => {
        // Only load if draft is finished and scores haven't been loaded yet
        if (!this.rootStore.draftStore.isDraftFinished) {
            return;
        }

        try {
            this.isLoading = true;
            this.error = null;
            const scores = await fetchPlayerScores();

            runInAction(() => {
                if (scores && Object.keys(scores).length > 0) {
                    this.playerScores = scores;
                    this.lastSavedScores = JSON.stringify(scores);
                    // Set the active round to the first incomplete round
                    // This must be called AFTER playerScores is set
                    this.activeRound = this.getDefaultActiveRound();
                } else {
                    // If no scores loaded, still set to first incomplete round
                    this.activeRound = this.getDefaultActiveRound();
                }
                this.scoresLoaded = true;
                this.isLoading = false;
            });
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to load player scores";
                this.isLoading = false;
            });
        }
    };

    setActiveRound = (round: string) => {
        this.activeRound = round;
    };

    // Helper method to check if a round is complete
    private isRoundComplete = (round: string): boolean => {
        if (!this.rootStore.draftStore.isDraftFinished) return false;

        // Check if we have the necessary data
        if (!this.rootStore.teamsStore.teams || this.rootStore.teamsStore.teams.length === 0) {
            return false;
        }
        if (!this.rootStore.playersStore.draftPicks) {
            return false;
        }

        const allTeamPlayers: Array<any> = [];

        // Collect all players from all teams
        this.rootStore.teamsStore.teams.forEach(team => {
            const teamPicks = getOrderedTeamPicks(team, this.rootStore.playersStore.draftPicks);
            teamPicks.forEach(({ player }) => {
                allTeamPlayers.push(player);
            });
        });

        // If there are no players, the round is not complete
        if (allTeamPlayers.length === 0) return false;

        // Check if all players have been scored or marked as not playing
        return allTeamPlayers.every(player => {
            const playerData = this.playerScores[round]?.[player.name];
            return playerData?.scoreData || playerData?.isDisabled === true;
        });
    };

    // Helper method to determine the default active round
    private getDefaultActiveRound = (): string => {
        // Check each round in order and return the first incomplete one
        for (const round of PLAYOFF_ROUNDS) {
            if (!this.isRoundComplete(round)) {
                return round;
            }
        }
        // If all rounds are complete, default to the last round
        return PLAYOFF_ROUNDS[PLAYOFF_ROUNDS.length - 1];
    };

    // Update existing methods to emit socket events
    setPlayerScores = (scores: PlayerScoresByRound) => {
        const prevScores = this.playerScores;
        this.playerScores = scores;

        // Don't immediately save if we're still loading
        if (!this.isLoading && this.rootStore.draftStore.isDraftFinished) {
            this.saveScoresToServer(prevScores);
        }
    };

    saveScoresToServer = async (prevScores?: PlayerScoresByRound) => {
        // Don't save if there are no player scores
        if (Object.values(this.playerScores).every(round => Object.keys(round).length === 0)) {
            return;
        }

        // Convert the current scores to a string for comparison
        const currentScoresStr = JSON.stringify(this.playerScores);

        // Only save if scores have changed
        if (currentScoresStr === this.lastSavedScores) return;

        try {
            // Convert player scores to API format
            const apiFormatScores = convertToApiFormat(this.playerScores);

            // Only save if we have scores to save
            if (apiFormatScores.length > 0) {
                await bulkSavePlayerScores(apiFormatScores);

                // Emit socket events for scores that changed
                if (this.rootStore.socket && prevScores) {
                    // Find what changed between prevScores and this.playerScores
                    this.emitScoreChanges(prevScores);
                }

                runInAction(() => {
                    this.lastSavedScores = currentScoresStr;
                });
            }
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to save player scores";
            });
        }
    };

    // Recalculate player scores after scoring rules change
    recalculateScores = async (position?: string): Promise<any> => {
        try {
            this.isLoading = true;

            const result = await recalculatePlayerScores(position);

            // If scores were updated, reload all scores from the server
            if (result.updated > 0) {
                await this.loadPlayerScores();
            }

            return result;
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to recalculate scores";
            });
            throw err;
        } finally {
            runInAction(() => {
                this.isLoading = false;
            });
        }
    };

    handleRemoteScoreUpdate(data: any) {
        // This will be called when another user updates player scores
        runInAction(() => {
            // Handle scoring rules update
            if (data.action === 'scoring_rules_update') {
                // Reload player scores when scoring rules are updated
                this.loadPlayerScores();
                console.log(`Scoring rules updated for ${data.position} position - reloading scores`);
                return;
            }

            const { round, playerName, scoreData, isDeleted } = data;

            // Make sure we have the round initialized
            if (!this.playerScores[round]) {
                this.playerScores[round] = {};
            }

            // Update the player score or delete it
            if (isDeleted) {
                // Handle score deletion
                if (this.playerScores[round][playerName]) {
                    delete this.playerScores[round][playerName];
                    console.log(`Deleted player score for ${playerName} in ${round} round`);
                }
            } else if (scoreData) {
                // Handle score update or player reactivation
                // Check if this is a reactivation (isDisabled changing from true to false)
                const isReactivation = this.playerScores[round]?.[playerName]?.isDisabled === true &&
                    scoreData.isDisabled === false;

                if (isReactivation) {
                    console.log(`Reactivated player ${playerName} in ${round} round`);
                } else {
                    console.log(`Updated player score for ${playerName} in ${round} round`);
                }

                // In either case, update the player data
                this.playerScores[round][playerName] = {
                    ...scoreData
                };
            }
        });
    }

    resetScores = () => {
        runInAction(() => {
            this.playerScores = {
                "Wild Card": {},
                "Divisional": {},
                "Conference": {},
                "Superbowl": {}
            };
            this.lastSavedScores = "{}";
            this.scoresLoaded = false; // Reset the loaded state
        });
    };

    // Helper method to detect and emit score changes
    private emitScoreChanges(prevScores: PlayerScoresByRound) {
        if (!this.rootStore.socket) return;

        // Check each round
        Object.keys(this.playerScores).forEach(round => {
            const currentRoundScores = this.playerScores[round] || {};
            const prevRoundScores = prevScores[round] || {};

            // Check each player in current scores
            Object.entries(currentRoundScores).forEach(([playerName, playerData]) => {
                // Player was added or updated
                if (!prevRoundScores[playerName] ||
                    JSON.stringify(prevRoundScores[playerName]) !== JSON.stringify(playerData)) {

                    // Emit update event
                    this.rootStore.socket?.emit('playerScoreUpdate', {
                        round,
                        playerName,
                        scoreData: playerData
                    });
                }
            });

            // Check for deleted players
            Object.keys(prevRoundScores).forEach(playerName => {
                if (!currentRoundScores[playerName]) {
                    // Emit delete event
                    this.rootStore.socket?.emit('playerScoreUpdate', {
                        round,
                        playerName,
                        isDeleted: true
                    });
                }
            });
        });
    }
}