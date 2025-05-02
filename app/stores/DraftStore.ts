import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from './RootStore';
import { DraftPicks } from '../types';
import { getDraftStatus, setDraftStatus, resetDraftPicks } from '../services/draftService';

export class DraftStore {
    rootStore: RootStore;
    isDraftFinished: boolean = false;
    loading: boolean = true;
    error: string | null = null;
    searchTerms: { [key: string]: string } = {};

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this, { rootStore: false });
        this.loadDraftStatus();
    }

    loadDraftStatus = async () => {
        try {
            this.loading = true;
            const status = await getDraftStatus();
            runInAction(() => {
                this.isDraftFinished = status;
                this.loading = false;
            });
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to load draft status";
                this.loading = false;
            });
        }
    };

    finishDraft = async () => {
        try {
            await setDraftStatus(true);
            runInAction(() => {
                this.isDraftFinished = true;
            });

            // Emit socket event for real-time update to other clients
            if (this.rootStore.socket) {
                this.rootStore.socket.emit('draftStatusUpdate', {
                    action: 'finish',
                    isDraftFinished: true
                });
            }
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to finish draft";
            });
        }
    };

    setSearchTerms = (terms: { [key: string]: string }) => {
        this.searchTerms = terms;
    };

    resetDraft = async () => {
        try {
            this.loading = true;

            // Call the API to reset draft picks and draft status
            await resetDraftPicks();
            await setDraftStatus(false);

            // Reset local state immediately
            runInAction(() => {
                this.isDraftFinished = false;
                this.searchTerms = {};
            });

            // Reset player store state
            runInAction(() => {
                // Clear draft picks
                this.rootStore.playersStore.draftPicks = {};
                // Force refresh of available players
                this.rootStore.playersStore.updateAvailablePlayers();
            });

            // Reset scores store state
            runInAction(() => {
                this.rootStore.scoresStore.playerScores = {
                    "Wild Card": {},
                    "Divisional": {},
                    "Conference": {},
                    "Superbowl": {}
                };
                this.rootStore.scoresStore.lastSavedScores = "{}";
                this.rootStore.scoresStore.scoresLoaded = false;
            });

            // Reload data from server
            await Promise.all([
                this.rootStore.teamsStore.loadTeams(),
                this.rootStore.playersStore.loadPlayers()
            ]);

            runInAction(() => {
                this.loading = false;
                this.error = null;
            });

            // Emit socket event with a specific action type for full reset
            if (this.rootStore.socket) {
                this.rootStore.socket.emit('draftStatusUpdate', {
                    action: 'reset',
                    isDraftFinished: false
                });
            }
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to reset draft";
                this.loading = false;
            });
        }
    };

    // Handle remote draft status updates
    handleRemoteDraftStatusUpdate(data: any) {
        console.log("Received remote draft status update:", data);

        runInAction(() => {
            // Update draft status
            if (data.isDraftFinished !== undefined) {
                this.isDraftFinished = data.isDraftFinished;
            }

            // Check if this is a full reset action
            if (data.action === 'reset') {
                console.log("Received full draft reset action");

                // Let the RootStore handle the page reload for full resets
                // Just update local state here
                this.isDraftFinished = false;
                this.searchTerms = {};

                // Reset player store state
                this.rootStore.playersStore.draftPicks = {};

                // Reset scores state
                this.rootStore.scoresStore.playerScores = {
                    "Wild Card": {},
                    "Divisional": {},
                    "Conference": {},
                    "Superbowl": {}
                };
                this.rootStore.scoresStore.lastSavedScores = "{}";
                this.rootStore.scoresStore.scoresLoaded = false;

                // Update available players
                this.rootStore.playersStore.updateAvailablePlayers();
            }
            // Handle draft finished action
            else if (data.action === 'finish' || data.isDraftFinished) {
                // If draft is finished, load player scores if needed
                if (!this.rootStore.scoresStore.scoresLoaded) {
                    this.rootStore.scoresStore.loadPlayerScores();
                }
            }
        });
    }
}