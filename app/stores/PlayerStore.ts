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
    private isLoadingPlayers: boolean = false; // Guard against concurrent fetches
    private retryCount: number = 0; // Track retry attempts
    private readonly MAX_RETRIES: number = 3; // Maximum retry attempts

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this, { rootStore: false });
        this.loadPlayers();
    }

    loadPlayers = async () => {
        try {
            // Prevent operations if page is reloading
            if (this.rootStore.isReloading) {
                return;
            }

            // Flag to track loading status
            this.loading = true;

            // Check if there's already data loaded
            if (this.allPlayers.length > 0) {
                this.loading = false;
                return;
            }

            // Prevent concurrent fetches
            if (this.isLoadingPlayers) {
                return;
            }

            this.isLoadingPlayers = true;

            try {
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
                    this.isLoadingPlayers = false;
                    this.retryCount = 0; // Reset retry count on success
                });
            } catch (fetchError) {
                console.error("Error fetching data:", fetchError);

                // Reset loading guard on error
                runInAction(() => {
                    this.isLoadingPlayers = false;
                });

                // If in browser context and haven't exceeded max retries, try again after a short delay
                if (typeof window !== 'undefined' && this.retryCount < this.MAX_RETRIES) {
                    this.retryCount++;
                    setTimeout(() => this.loadPlayers(), 1500);
                } else {
                    throw fetchError; // Re-throw in server context or after max retries
                }
            }
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to load players";
                this.loading = false;
                this.isLoadingPlayers = false;
            });
            console.error("Error in loadPlayers:", err);
        }
    };

    setSelectedPlayer = (player: Player | null) => {
        this.selectedPlayer = player;

        // Emit socket event for real-time update to other clients
        if (this.rootStore.socket) {
            this.rootStore.socket.emit('selectedPlayerUpdate', {
                player: player
            });
        }
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

    // Update the selectPlayerForTeam method in PlayersStore
    selectPlayerForTeam = async (team: string, pick: number, player: Player, cost: number) => {
        try {
            // Validate budget
            const currentBudget = this.rootStore.teamsStore.teamBudgets.get(team) || 0;
            if (cost > currentBudget) {
                runInAction(() => {
                    this.error = `Insufficient budget! ${team} only has $${currentBudget} remaining.`;
                });
                return false;
            }

            // Calculate remaining roster spots after this pick
            const remainingSpots = DraftManager.getRemainingRosterSpots(team, this.draftPicks);
            const minReserve = remainingSpots - 1; // -1 because this pick will fill one spot
            const budgetAfterPick = currentBudget - cost;

            if (budgetAfterPick < minReserve) {
                runInAction(() => {
                    this.error = `Insufficient budget. Only $${currentBudget} remaining. Must keep at least $${minReserve} to fill remaining ${minReserve} roster spot${minReserve !== 1 ? 's' : ''}.`;
                });
                return false;
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
            try {
                await saveDraftPick(team, pick, player.id, cost);
            } catch (saveError) {
                // Backend validation failed - revert the changes
                runInAction(() => {
                    this.draftPicks = { ...this.draftPicks };
                    this.rootStore.teamsStore.teamBudgets = new Map(this.rootStore.teamsStore.teamBudgets);
                });
                this.updateAvailablePlayers();

                // Set the error message from the backend
                runInAction(() => {
                    this.error = saveError instanceof Error ? saveError.message : "Failed to save draft pick";
                });
                return false;
            }

            // Emit socket event for real-time update to other clients
            if (this.rootStore.socket) {
                this.rootStore.socket.emit('draftPickUpdate', {
                    action: 'add',
                    team,
                    pick,
                    player,
                    cost
                });
            }

            return true;
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to select player";
            });
            return false;
        }
    };

    // Update the removePlayerFromTeam method in PlayersStore
    removePlayerFromTeam = async (team: string, pick: number) => {
        try {
            const removedPlayer = this.draftPicks[team]?.[pick];
            if (!removedPlayer) return false;

            // Store the cost for refund calculation
            const removedPlayerCost = await this.getPlayerCost(team, pick);

            // Update UI state immediately for better responsiveness
            runInAction(() => {
                // Update draft picks without waiting for the server
                this.draftPicks = {
                    ...this.draftPicks,
                    [team]: { ...this.draftPicks[team], [pick]: null }
                };

                // Also update the team budget locally to avoid needing a full reload
                if (removedPlayerCost > 0 && this.rootStore.teamsStore.teamBudgets.has(team)) {
                    const currentBudget = this.rootStore.teamsStore.teamBudgets.get(team) || 0;
                    this.rootStore.teamsStore.teamBudgets.set(team, currentBudget + removedPlayerCost);
                }

                // Update available players list
                this.updateAvailablePlayers();
            });

            // Now save to backend
            await saveDraftPick(team, pick, null);

            // Note: Budget is already refunded locally above (line 218)
            // Backend will handle persistence, no need for additional fetch

            // Emit socket event for real-time update to other clients
            if (this.rootStore.socket) {
                this.rootStore.socket.emit('draftPickUpdate', {
                    action: 'remove',
                    team,
                    pick,
                    refundAmount: removedPlayerCost
                });
            }

            return true;
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to remove player";
            });
            return false;
        }
    };

    // Add a helper method to get the cost of a draft pick
    private async getPlayerCost(team: string, pick: number): Promise<number> {
        try {
            // Fetch the draft pick from the server to get its cost
            const response = await fetch(`/api/draftpicks/cost?team=${encodeURIComponent(team)}&pick=${pick}`);
            if (!response.ok) return 0;

            const data = await response.json();
            return data.cost || 0;
        } catch (error) {
            console.error("Error fetching draft pick cost:", error);
            return 0;
        }
    }

    // Add these methods to the PlayersStore class
    handleRemoteDraftPickUpdate(data: any) {
        // The existing code
        runInAction(() => {
            // Update local state with the new draft pick
            if (!this.draftPicks[data.team]) {
                this.draftPicks[data.team] = {};
            }
            this.draftPicks[data.team][data.pick] = data.player;

            // If we have no players data yet, skip update
            // Don't trigger a reload as it might cause infinite loops
            if (this.allPlayers.length === 0) {
                return;
            }

            // Update available players
            this.updateAvailablePlayers();

            // Update team budgets if a cost was involved
            if (data.cost && this.rootStore.teamsStore.teamBudgets.has(data.team)) {
                const currentBudget = this.rootStore.teamsStore.teamBudgets.get(data.team) || 0;
                this.rootStore.teamsStore.teamBudgets.set(data.team, currentBudget - data.cost);
            }
        });
    }

    handleRemoteDraftPickRemoval(data: any) {
        // This will be called when another user removes a draft pick
        runInAction(() => {
            if (this.draftPicks[data.team] && this.draftPicks[data.team][data.pick]) {
                // Remove the draft pick
                this.draftPicks[data.team][data.pick] = null;

                // Update available players
                this.updateAvailablePlayers();

                // Update team budgets if a refund was involved
                if (data.refundAmount && this.rootStore.teamsStore.teamBudgets.has(data.team)) {
                    const currentBudget = this.rootStore.teamsStore.teamBudgets.get(data.team) || 0;
                    this.rootStore.teamsStore.teamBudgets.set(data.team, currentBudget + data.refundAmount);
                }
            }
        });
    }

    // Handle remotely selected player updates
    handleRemoteSelectedPlayerUpdate(data: any) {
        runInAction(() => {
            // Update the selected player
            this.selectedPlayer = data.player;
        });
    }
}