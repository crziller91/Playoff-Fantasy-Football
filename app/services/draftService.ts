import { DraftPicks, Player, TeamWithBudget } from "../types";

export const fetchPlayers = async (): Promise<Player[]> => {
  const response = await fetch("/api/players");
  if (!response.ok) throw new Error(`API returned status: ${response.status}`);
  return response.json();
};

export const fetchDraftPicks = async (): Promise<DraftPicks> => {
  const response = await fetch("/api/draftpicks");
  if (!response.ok) throw new Error(`API returned status: ${response.status}`);
  return response.json();
};

export const fetchTeams = async (): Promise<TeamWithBudget[]> => {
  const response = await fetch("/api/teams");
  if (!response.ok) throw new Error(`API returned status: ${response.status}`);
  return response.json();
};

export const saveDraftPick = async (team: string, round: number, playerId: number | null, cost?: number) => {
  const response = await fetch("/api/draftpicks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamName: team, round, playerId, cost }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to save draft pick: ${response.status}`);
  }
  return response.json();
};

export const resetDraftPicks = async (): Promise<void> => {
  const response = await fetch("/api/draftpicks", { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to reset draft picks: ${response.status}`);
};

export const getDraftStatus = async (): Promise<boolean> => {
  const response = await fetch('/api/draft-status');
  if (!response.ok) throw new Error(`API returned status: ${response.status}`);
  const data = await response.json();
  return data.isDraftFinished;
};

export const setDraftStatus = async (isDraftFinished: boolean): Promise<void> => {
  const response = await fetch('/api/draft-status', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isDraftFinished }),
  });
  if (!response.ok) throw new Error(`API returned status: ${response.status}`);
};