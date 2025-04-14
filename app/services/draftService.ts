import { DraftPicks, Player } from "../types";

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

export const fetchTeams = async (): Promise<string[]> => {
  const response = await fetch("/api/teams");
  if (!response.ok) throw new Error(`API returned status: ${response.status}`);
  return response.json();
};

export const saveDraftPick = async (team: string, round: number, playerId: number | null) => {
  const response = await fetch("/api/draftpicks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teamName: team, round, playerId }),
  });
  if (!response.ok) throw new Error(`Failed to save draft pick: ${response.status}`);
  return response.json();
};

export const resetDraftPicks = async (): Promise<void> => {
  const response = await fetch("/api/draftpicks", { method: "DELETE" });
  if (!response.ok) throw new Error(`Failed to reset draft picks: ${response.status}`);
};