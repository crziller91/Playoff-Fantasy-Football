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
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to reset draft";
                this.loading = false;
            });
        }
    };
}