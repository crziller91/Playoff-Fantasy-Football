// app/stores/ScoresStore.ts
import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from './RootStore';
import { PlayerScoresByRound, ExtendedPlayer, ScoreForm } from '../types';
import {
    fetchPlayerScores,
    savePlayerScore,
    bulkSavePlayerScores,
    deletePlayerScore,
    convertToApiFormat
} from '../services/scoreService';
import { calculatePlayerScore } from '../utils/scoreCalculator';

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

    setPlayerScores = (scores: PlayerScoresByRound) => {
        this.playerScores = scores;

        // Don't immediately save if we're still loading
        if (!this.isLoading && this.rootStore.draftStore.isDraftFinished) {
            this.saveScoresToServer();
        }
    };

    saveScoresToServer = async () => {
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

    // Rest of the store methods remain the same...
}