// app/types/index.ts

export interface Player {
  id: number;
  name: string;
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DST";
}

export interface DraftPicks {
  [team: string]: {
    [round: number]: Player | null;
  };
}

// Extended DraftPick type with relations
export interface DraftPickWithRelations {
  id: number;
  teamId: number;
  round: number;
  playerId: number | null;
  team: {
    name: Team;
  };
  player: Player | null;
}

// Define the expected POST request body
export interface DraftPickRequest {
  teamName: Team;
  round: number;
  playerId: number | null;
}

export interface SearchTerms {
  [key: string]: string;
}

export type Team =
  | "Luis"
  | "Sill"
  | "Hunter & Julie"
  | "Joe"
  | "Peter"
  | "Alan"
  | "Rohan"
  | "JT"
  | "Christian"
  | "Dougie";