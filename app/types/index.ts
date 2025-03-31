export type Player = {
  id: number;
  name: string;
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DST";
};

export type Team = string;

export type DraftPicks = {
  [team: string]: {
    [pick: number]: Player | null;
  };
};

export type DraftPickWithRelations = {
  id: number;
  teamId: number;
  team: { id: number; name: string };
  playerId: number | null;
  player: Player | null;
  round: number;
};

export type DraftPickRequest = {
  teamName: string;
  round: number;
  playerId: number | null;
};