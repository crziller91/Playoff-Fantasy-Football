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

// Additional types for the scoring functionality
export interface ExtendedPlayer extends Player {
  score?: number;
  scoreData?: ScoreForm;
  isDisabled?: boolean; // New property to track disabled status
}

export interface ScoreForm {
  touchdowns?: string;
  yards?: string;
  twoPtConversions?: string;
  interceptions?: string;
  completions?: string;
  rushingYards?: string;
  rushingAttempts?: string;
  receivingYards?: string;
  receptions?: string;
  pat?: string;
  fgMisses?: string;
  fg?: string;
  fgYardages?: string[];
  sacks?: string;
  blockedKicks?: string;
  fumblesRecovered?: string;
  safeties?: string;
  pointsAllowed?: string;
  yardsAllowed?: string;
}

// Interface for form validation errors
export interface FormErrors {
  [key: string]: boolean;
}

// Props interfaces for components
export interface TeamsViewProps {
  teams: Team[];
  draftPicks: DraftPicks;
  isDraftFinished: boolean;
}

export interface TeamCardProps {
  team: Team;
  draftPicks: DraftPicks;
  playerScores: { [key: string]: ExtendedPlayer };
  onEditScore: (player: ExtendedPlayer) => void;
  onTogglePlayerDisabled: (player: ExtendedPlayer, isClearScores?: boolean) => void; // Updated function prop
}

export interface ScoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: ExtendedPlayer | null;
  scoreForm: ScoreForm;
  formErrors: FormErrors;
  submitAttempted: boolean;
  fgCount: number;
  onInputChange: (field: keyof ScoreForm, value: string) => void;
  onFgCountChange: (value: string) => void;
  onFgYardageChange: (index: number, value: string) => void;
  onSubmit: () => void;
}