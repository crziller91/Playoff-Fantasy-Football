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
}