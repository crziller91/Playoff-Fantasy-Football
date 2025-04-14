"use client";

import { useState, useEffect } from "react";
import { DraftPicks, Player } from "../types";
import { DraftManager } from "../domain/DraftManager";
import { fetchPlayers, fetchDraftPicks, fetchTeams, resetDraftPicks } from "../services/draftService";

export const useDraft = () => {
  const [teams, setTeams] = useState<string[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  // Initialize draftPicks with all teams and rounds
  const [draftPicks, setDraftPicks] = useState<DraftPicks>(() => {
    const initialTeams = DraftManager.INITIAL_TEAMS; // Fallback until teams load
    return DraftManager.initializeDraftPicks(initialTeams);
  });
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [players, picks, dbTeams] = await Promise.all([
          fetchPlayers(),
          fetchDraftPicks(),
          fetchTeams(),
        ]);
        const available = DraftManager.calculateAvailablePlayers(players, picks);
        setTeams(dbTeams);
        setAvailablePlayers(available);
        // Merge fetched picks with initialized structure
        const initializedPicks = DraftManager.initializeDraftPicks(dbTeams);
        setDraftPicks({ ...initializedPicks, ...picks });
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleResetBoard = async () => {
    try {
      await resetDraftPicks();
      const [players, dbTeams] = await Promise.all([fetchPlayers(), fetchTeams()]);
      setTeams(dbTeams);
      setAvailablePlayers(players);
      setDraftPicks(DraftManager.initializeDraftPicks(dbTeams));
      setSearchTerms({});
    } catch (err) {
      console.error("Failed to reset board:", err);
      alert("Failed to reset board. Please try again.");
    }
  };

  return {
    teams,
    picks: DraftManager.PICKS,
    availablePlayers,
    draftPicks,
    searchTerms,
    loading,
    error,
    setDraftPicks,
    setAvailablePlayers,
    setTeams,
    setSearchTerms,
    handleResetBoard,
  };
};