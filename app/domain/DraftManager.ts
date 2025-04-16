import { Player, Team, DraftPicks, DraftPickWithRelations } from "../types";

export class DraftManager {
    static readonly PICKS = Array.from({ length: 6 }, (_, i) => i + 1);

    static readonly INITIAL_TEAMS: Team[] = [
        "Christian",
        "Peter",
    ];

    static initializeDraftPicks(teams: Team[]): DraftPicks {
        const draftPicks: DraftPicks = {};
        teams.forEach((team) => {
            draftPicks[team] = {};
            this.PICKS.forEach((pick) => {
                draftPicks[team][pick] = null;
            });
        });
        return draftPicks;
    }

    static formatDraftPicks(draftPicks: DraftPickWithRelations[]): DraftPicks {
        const result: DraftPicks = {};
        draftPicks.forEach((pick) => {
            const teamName = pick.team.name as Team;
            if (!result[teamName]) result[teamName] = {};
            result[teamName][pick.round] = pick.player
                ? {
                    id: pick.player.id,
                    name: pick.player.name,
                    position: pick.player.position as "QB" | "RB" | "WR" | "TE" | "K" | "DST",
                    teamName: pick.player.teamName || undefined, // Include teamName if available
                }
                : null;
        });
        return result;
    }

    static calculateAvailablePlayers(players: Player[], draftPicks: DraftPicks): Player[] {
        const draftedPlayerIds = new Set<number>();
        for (const team of Object.keys(draftPicks)) {
            const teamPicks = draftPicks[team];
            for (const round of this.PICKS) {
                const player = teamPicks[round];
                if (player) draftedPlayerIds.add(player.id);
            }
        }
        return players.filter((player) => !draftedPlayerIds.has(player.id));
    }

    static getTeamPositionCounts(team: Team, draftPicks: DraftPicks) {
        const picks = Object.values(draftPicks[team]).filter(Boolean) as Player[];
        return {
            QB: picks.filter((p) => p.position === "QB").length,
            RB: picks.filter((p) => p.position === "RB").length,
            WR: picks.filter((p) => p.position === "WR").length,
            TE: picks.filter((p) => p.position === "TE").length,
            DST: picks.filter((p) => p.position === "DST").length,
            K: picks.filter((p) => p.position === "K").length,
        };
    }

    static canSelectPlayer(team: Team, draftPicks: DraftPicks, totalRounds: number): boolean {
        const picked = Object.values(draftPicks[team]).filter(Boolean).length;
        return picked < totalRounds;
    }

    static filterPlayers(players: Player[], team: Team, draftPicks: DraftPicks, searchTerm: string): Player[] {
        const counts = this.getTeamPositionCounts(team, draftPicks);
        const hasTE = counts.TE > 0;
        const hasDST = counts.DST > 0;
        const hasFlexOccupiedByTEorDST = hasTE || hasDST;
        const hasFlexOccupiedByExtra =
            (counts.RB > 1 && !hasTE && !hasDST) ||
            (counts.WR > 2 && !hasTE && !hasDST) ||
            (counts.K > 1 && !hasTE && !hasDST);
        const hasFlex = hasFlexOccupiedByTEorDST || hasFlexOccupiedByExtra;

        const caps = {
            QB: 1,
            RB: hasFlex ? 1 : 2,
            WR: hasFlex ? 2 : 3,
            TE: 1,
            DST: 1,
            K: hasFlex ? 1 : 2,
        };

        return players
            .filter((player) => player.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .filter((player) => {
                if (!this.canSelectPlayer(team, draftPicks, this.PICKS.length)) return false;

                const pos = player.position;
                const count = counts[pos];

                if (pos === "QB" && count >= caps.QB) return false;
                if (pos === "TE" && (count >= caps.TE || hasDST || hasFlexOccupiedByExtra)) return false;
                if (pos === "DST" && (count >= caps.DST || hasTE || hasFlexOccupiedByExtra)) return false;

                return count < caps[pos];
            });
    }
}