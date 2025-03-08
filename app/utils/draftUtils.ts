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

export const randomizeTeams = (teams: Team[]): Team[] => {
  const shuffled = [...teams];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
