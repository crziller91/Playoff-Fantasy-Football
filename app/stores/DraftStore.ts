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

    // Update the finishDraft method to emit a socket event
    finishDraft = async () => {
        try {
            await setDraftStatus(true);
            runInAction(() => {
                this.isDraftFinished = true;
            });

            // Emit socket event for real-time update to other clients
            if (this.rootStore.socket) {
                this.rootStore.socket.emit('draftStatusUpdate', {
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

    // Update the resetDraft method to emit a socket event
    resetDraft = async () => {
        try {
            this.loading = true;
            await resetDraftPicks();
            await setDraftStatus(false);

            // Reset all related stores
            await this.rootStore.teamsStore.loadTeams();
            await this.rootStore.playersStore.loadPlayers();

            runInAction(() => {
                this.isDraftFinished = false;
                this.searchTerms = {};
                this.loading = false;
                this.error = null;
            });

            // Emit socket event for real-time update to other clients
            if (this.rootStore.socket) {
                this.rootStore.socket.emit('draftStatusUpdate', {
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

    // New method to handle remote draft status updates
    handleRemoteDraftStatusUpdate(data: any) {
        runInAction(() => {
            if (data.isDraftFinished !== undefined) {
                const wasReset = this.isDraftFinished && !data.isDraftFinished;
                this.isDraftFinished = data.isDraftFinished;

                // If draft is finished, trigger loading of player scores
                if (data.isDraftFinished && !this.rootStore.scoresStore.scoresLoaded) {
                    this.rootStore.scoresStore.loadPlayerScores();
                }

                // If draft was reset, reload all relevant data
                if (wasReset) {
                    // Reload teams, players, and clear local draft data
                    this.rootStore.teamsStore.loadTeams();
                    this.rootStore.playersStore.loadPlayers();
                    this.searchTerms = {};
                }
            }
        });
    }
}