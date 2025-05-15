export type Player = {
  id: number;
  name: string;
  position: "QB" | "RB" | "WR" | "TE" | "K" | "DST";
  teamName?: string;
};

export interface TeamWithBudget {
  id: number;
  name: string;
  budget: number;
  originalBudget: number;
}

export type Team = string;

export type DraftPicks = {
  [team: string]: {
    [pick: number]: Player | null;
  };
};

export type DraftPickWithRelations = {
  id: number;
  teamId: number;
  team: { id: number; name: string; budget: number };
  playerId: number | null;
  player: Player | null;
  round: number;
  cost: number | null;
};

export type DraftPickRequest = {
  teamName: string;
  round: number;
  playerId: number | null;
  cost?: number | null;
};

// Additional interfaces for the budget modal
export interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  team: string;
  onConfirm: (cost: number) => void;
  budgetError?: string; // Added budgetError property
}

// Rest of the file remains the same
export interface ExtendedPlayer extends Player {
  score?: number;
  scoreData?: ScoreForm;
  isDisabled?: boolean; // Track disabled status
  statusReason?: "eliminated" | "notPlaying" | null; // Track the reason player is disabled
  currentRound?: string; // Track which playoff round this score is for
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

// New type to store player scores by playoff round
export interface PlayerScoresByRound {
  [round: string]: { [playerName: string]: ExtendedPlayer };
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
  playerScores?: PlayerScoresByRound;
  setPlayerScores?: React.Dispatch<React.SetStateAction<PlayerScoresByRound>>;
  initialActiveRound?: string;  // For initial active round
  onRoundChange?: (round: string) => void;  // For round change callback
}

export interface TeamCardProps {
  team: Team;
  draftPicks: DraftPicks;
  playerScores: { [key: string]: ExtendedPlayer };
  onEditScore: (player: ExtendedPlayer) => void;
  onTogglePlayerDisabled: (player: ExtendedPlayer, isClearScores?: boolean) => void;
  round?: string; // Optional property to indicate which playoff round is being displayed
  ranking?: number; // Optional property to indicate team ranking for medal display
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
  onSubmit: () => Promise<void>;
}

// Props for the Scores tab
export interface ScoresTabProps {
  teams: Team[];
  draftPicks: DraftPicks;
  playerScores: PlayerScoresByRound;
}

export interface PlayerScoreRequest {
  playerId: number;
  round: string;
  isDisabled: boolean;
  statusReason: "eliminated" | "notPlaying" | null;
  score: number;
  scoreData?: any;
}

export interface BulkPlayerScoreRequest {
  playerScores: PlayerScoreRequest[];
}

export interface PlayerScoreResponse {
  id: number;
  playerId: number;
  round: string;
  isDisabled: boolean;
  statusReason: string | null;
  score: number;
  scoreData: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlayerScoresByRoundResponse {
  [round: string]: {
    [playerName: string]: ExtendedPlayer;
  };
}