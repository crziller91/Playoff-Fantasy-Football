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
