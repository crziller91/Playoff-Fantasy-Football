import { makeAutoObservable, runInAction } from 'mobx';
import { RootStore } from './RootStore';
import { Team, TeamWithBudget } from '../types';
import { fetchTeams } from '../services/draftService';

export class TeamsStore {
    rootStore: RootStore;
    teams: Team[] = [];
    teamBudgets: Map<string, number> = new Map();
    loading: boolean = true;
    error: string | null = null;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
        makeAutoObservable(this, { rootStore: false });
        this.loadTeams();
    }

    loadTeams = async () => {
        try {
            this.loading = true;
            const teamsData = await fetchTeams();

            // Extract team names and budgets
            const teamNames = teamsData.map((t: TeamWithBudget) => t.name);
            const budgetMap = new Map<string, number>();
            teamsData.forEach((t: TeamWithBudget) => {
                budgetMap.set(t.name, t.budget);
            });

            runInAction(() => {
                this.teams = teamNames;
                this.teamBudgets = budgetMap;
                this.loading = false;
            });
        } catch (err) {
            runInAction(() => {
                this.error = err instanceof Error ? err.message : "Failed to load teams";
                this.loading = false;
            });
        }
    };

    setTeamBudgets = (budgets: Map<string, number>) => {
        this.teamBudgets = budgets;
    };

    handleRemoteTeamUpdate = (data: any) => {
        runInAction(() => {
            // Handle different types of team updates
            if (data.action === 'update_all_budgets' && data.budget) {
                // Update all team budgets
                this.teams.forEach(team => {
                    this.teamBudgets.set(team, data.budget);
                });
            } else if (data.action === 'update' && data.team) {
                // Update a specific team
                const { team } = data;
                if (team.name && team.budget) {
                    this.teamBudgets.set(team.name, team.budget);

                    // If the name changed (comparing old and new)
                    if (data.oldName && data.oldName !== team.name) {
                        // Remove old team name
                        this.teamBudgets.delete(data.oldName);

                        // Update teams array
                        const teamIndex = this.teams.findIndex(t => t === data.oldName);
                        if (teamIndex !== -1) {
                            this.teams[teamIndex] = team.name;
                        }
                    }
                }
            } else if (data.action === 'add' && data.team) {
                // Add a new team
                const { team } = data;
                if (team.name && team.budget) {
                    this.teamBudgets.set(team.name, team.budget);

                    // Add to teams array if not already present
                    if (!this.teams.includes(team.name)) {
                        this.teams.push(team.name);
                    }
                }
            } else if (data.action === 'delete' && data.teamName) {
                // Delete a team
                this.teamBudgets.delete(data.teamName);
                this.teams = this.teams.filter(team => team !== data.teamName);
            }
        });
    };
}