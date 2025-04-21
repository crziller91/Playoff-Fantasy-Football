import { PlayerScoresByRound, ExtendedPlayer } from "../types";

// Fetch all player scores from the API
export const fetchPlayerScores = async (): Promise<PlayerScoresByRound> => {
  try {
    const response = await fetch("/api/player-scores");
    if (!response.ok) {
      throw new Error(`API returned status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching player scores:", error);
    // Return empty score structure on error
    return {
      "Wild Card": {},
      "Divisional": {},
      "Conference": {},
      "Superbowl": {}
    };
  }
};

// Save a single player's score for a specific round
export const savePlayerScore = async (
    playerId: number,
    round: string,
    isDisabled: boolean,
    statusReason: "eliminated" | "notPlaying" | null,
    score: number,
    scoreData?: any,
    deleteIfReactivated: boolean = false // New parameter
  ): Promise<any> => {
    // If the player is being reactivated and deleteIfReactivated flag is true,
    // we'll delete the entry instead of updating it
    if (!isDisabled && deleteIfReactivated) {
      return deletePlayerScore(playerId, round);
    }
  
    // Otherwise proceed with normal save/update
    const response = await fetch("/api/player-scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId,
        round,
        isDisabled,
        statusReason,
        score,
        scoreData
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to save player score: ${response.status}`);
    }
    
    return response.json();
  };
  
  // New function to delete a player score entry
  export const deletePlayerScore = async (
    playerId: number,
    round: string
  ): Promise<any> => {
    const response = await fetch(`/api/player-scores/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        playerId,
        round
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to delete player score: ${response.status}`);
    }
    
    return response.json();
  };

// Bulk save multiple player scores
export const bulkSavePlayerScores = async (playerScores: {
  playerId: number;
  round: string;
  isDisabled: boolean;
  statusReason: "eliminated" | "notPlaying" | null;
  score: number;
  scoreData?: any;
}[]): Promise<any> => {
  const response = await fetch("/api/player-scores/bulk", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      playerScores
    }),
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Failed to bulk save player scores: ${response.status}`);
  }
  
  return response.json();
};

// Helper function to convert from UI state to API format
export const convertToApiFormat = (
  playerScores: PlayerScoresByRound
): any[] => {
  const apiFormatScores: any[] = [];
  
  // For each round
  Object.entries(playerScores).forEach(([round, players]) => {
    // For each player in this round
    Object.entries(players).forEach(([playerName, playerData]) => {
      if (playerData) {
        apiFormatScores.push({
          playerId: playerData.id,
          round,
          isDisabled: playerData.isDisabled || false,
          statusReason: playerData.statusReason || null,
          score: playerData.score || 0,
          scoreData: playerData.scoreData
        });
      }
    });
  });
  
  return apiFormatScores;
};