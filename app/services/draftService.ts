import { DraftPicks, Player, TeamWithBudget } from "../types";

// Helper to get the base URL for API calls
const getBaseUrl = () => {
  // During SSR/SSG (server-side), return empty data instead of fetching
  if (typeof window === 'undefined') {
    return null;
  }
  // Client-side: use relative URLs
  return '';
};

export const fetchPlayers = async (): Promise<Player[]> => {
  try {
    const baseUrl = getBaseUrl();

    // If we're on the server during build, return empty array
    if (baseUrl === null) {
      console.log("Server-side context detected - skipping fetch");
      return [];
    }

    const url = `${baseUrl}/api/players`;
    console.log("Fetching players from:", url);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`API returned status: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error("Error in fetchPlayers:", error);
    return []; // Return empty array instead of throwing
  }
};

// Do the same for other fetch functions
export const fetchDraftPicks = async (): Promise<DraftPicks> => {
  try {
    const baseUrl = getBaseUrl();

    // If we're on the server during build, return empty object
    if (baseUrl === null) {
      console.log("Server-side context detected - skipping fetch");
      return {};
    }

    const url = `${baseUrl}/api/draftpicks`;
    console.log("Fetching draft picks from:", url);

    const response = await fetch(url);
    if (!response.ok) throw new Error(`API returned status: ${response.status}`);
    return response.json();
  } catch (error) {
    console.error("Error in fetchDraftPicks:", error);
    return {}; // Return empty object instead of throwing
  }
};

export const fetchTeams = async (): Promise<TeamWithBudget[]> => {
  const baseUrl = getBaseUrl();

  // If we're on the server during build, return empty array
  if (baseUrl === null) {
    console.log("Server-side context detected - skipping fetch");
    return [];
  }

  const response = await fetch(`${baseUrl}/api/teams`);
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