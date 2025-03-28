import { DraftPicks, Player, Team } from "../types";

export const initializeDraftPicks = (
  teams: Team[],
  rounds: number[],
): DraftPicks => {
  return teams.reduce(
    (acc, team) => ({
      ...acc,
      [team]: rounds.reduce(
        (roundAcc, round) => ({
          ...roundAcc,
          [round]: null,
        }),
        {} as { [round: number]: Player | null },
      ),
    }),
    {} as DraftPicks,
  );
};

export const canSelectPlayer = (
  team: Team,
  draftPicks: DraftPicks,
  totalRounds: number,
): boolean => {
  const totalPicks = Object.values(draftPicks[team]).filter((p) => p).length;
  return totalPicks < totalRounds;
};
