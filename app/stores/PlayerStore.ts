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
            // Flag to track loading status
            this.loading = true;

            // Check if there's already data loaded
            if (this.allPlayers.length > 0) {
                console.log("Players already loaded, skipping fetch");
                this.loading = false;
                return;
            }

            console.log("Attempting to load players and draft picks...");

            try {
                const [players, picks] = await Promise.all([
                    fetchPlayers(),
                    fetchDraftPicks(),
                ]);

                console.log(`Fetched ${players.length} players and ${Object.keys(picks).length} team picks`);

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
            } catch (fetchError) {
                console.error("Error fetching data:", fetchError);

                // If in browser context, try again after a short delay
                if (typeof window !== 'undefined') {
                    console.log("Retrying fetch after delay...");
                    setTimeout(() => this.loadPlayers(), 1500);
                } else {
                    throw fetchError; // Re-throw in server context
                }
            }
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to load players";
                this.loading = false;
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

            // REMOVE THIS LINE:
            // await this.rootStore.teamsStore.loadTeams();

            // Instead of reloading all teams, just fetch the updated budget in background
            // This can happen asynchronously without blocking the UI
            fetch(`/api/teams`)
                .then(response => response.json())
                .then(teams => {
                    // Silently update budget values without causing a loading state
                    runInAction(() => {
                        teams.forEach((t: any) => {
                            this.rootStore.teamsStore.teamBudgets.set(t.name, t.budget);
                        });
                    });
                })
                .catch(error => {
                    console.error("Error fetching updated team budgets:", error);
                });

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

            // ADDED: If we have no players data yet, force reload all players
            if (this.allPlayers.length === 0) {
                console.log("Received remote update but no local players - loading all players");
                setTimeout(() => this.loadPlayers(), 300);
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