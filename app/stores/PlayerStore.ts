import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from './RootStore';
import { Player, DraftPicks } from '../types';
import { fetchPlayers, fetchDraftPicks, saveDraftPick } from '../services/draftService';
import { DraftManager } from '../domain/DraftManager';

export class PlayersStore {
    rootStore: RootStore;
    allPlayers: Player[] = [];
    availablePlayers: Player[] = [];
    draftPicks: DraftPicks = {};
    selectedPlayer: Player | null = null;
    loading: boolean = true;
    error: string | null = null;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this, { rootStore: false });
        this.loadPlayers();
    }

    loadPlayers = async () => {
        try {
            this.loading = true;
            const [players, picks] = await Promise.all([
                fetchPlayers(),
                fetchDraftPicks(),
            ]);

            // Initialize draft picks with all teams and rounds
            const initializedPicks = DraftManager.initializeDraftPicks(this.rootStore.teamsStore.teams);
            const mergedPicks = { ...initializedPicks, ...picks };

            // Calculate available players
            const available = DraftManager.calculateAvailablePlayers(players, mergedPicks);

            runInAction(() => {
                this.allPlayers = players;
                this.availablePlayers = available;
                this.draftPicks = mergedPicks;
                this.loading = false;
            });
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to load players";
                this.loading = false;
            });
        }
    };

    setSelectedPlayer = (player: Player | null) => {
        this.selectedPlayer = player;
    };

    setDraftPicks = (draftPicks: DraftPicks) => {
        this.draftPicks = draftPicks;
        this.updateAvailablePlayers();
    };

    updateAvailablePlayers = () => {
        this.availablePlayers = DraftManager.calculateAvailablePlayers(
            this.allPlayers,
            this.draftPicks
        );
    };

    selectPlayerForTeam = async (team: string, pick: number, player: Player, cost: number) => {
        try {
            // Validate budget
            const currentBudget = this.rootStore.teamsStore.teamBudgets.get(team) || 0;
            if (cost > currentBudget) {
                throw new Error(`Insufficient budget! ${team} only has $${currentBudget} remaining.`);
            }

            // Update UI state
            const updatedDraftPicks = {
                ...this.draftPicks,
                [team]: { ...this.draftPicks[team], [pick]: player }
            };

            // Update budgets
            const newBudgets = new Map(this.rootStore.teamsStore.teamBudgets);
            newBudgets.set(team, currentBudget - cost);

            runInAction(() => {
                this.draftPicks = updatedDraftPicks;
                this.rootStore.teamsStore.teamBudgets = newBudgets;
                this.rootStore.draftStore.searchTerms = {
                    ...this.rootStore.draftStore.searchTerms,
                    [`${team}-${pick}`.replace(/[^a-zA-Z0-9-]/g, "-")]: ""
                };
            });

            this.updateAvailablePlayers();

            // Save to backend
            await saveDraftPick(team, pick, player.id, cost);

            return true;
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to select player";
            });
            return false;
        }
    };

    removePlayerFromTeam = async (team: string, pick: number) => {
        try {
            const removedPlayer = this.draftPicks[team]?.[pick];
            if (!removedPlayer) return false;

            // Update UI state
            const updatedDraftPicks = {
                ...this.draftPicks,
                [team]: { ...this.draftPicks[team], [pick]: null }
            };

            runInAction(() => {
                this.draftPicks = updatedDraftPicks;
            });

            this.updateAvailablePlayers();

            // Save to backend
            await saveDraftPick(team, pick, null);

            // Reload team budgets since the server will handle refunding
            await this.rootStore.teamsStore.loadTeams();

            return true;
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to remove player";
            });
            return false;
        }
    };
}