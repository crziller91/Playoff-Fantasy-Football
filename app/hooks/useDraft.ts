"use client";

import { useState, useEffect } from "react";
import { DraftPicks, Player, Team, TeamWithBudget, PlayerScoresByRound } from "../types";
import { DraftManager } from "../domain/DraftManager";
import {
  fetchPlayers,
  fetchDraftPicks,
  fetchTeams,
  resetDraftPicks,
  getDraftStatus,
  setDraftStatus
} from "../services/draftService";
import { usePlayerScores } from "./usePlayerScores";

export const useDraft = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamBudgets, setTeamBudgets] = useState<Map<string, number>>(new Map());
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  // Initialize draftPicks with all teams and rounds
  const [draftPicks, setDraftPicks] = useState<DraftPicks>(() => {
    const initialTeams = DraftManager.INITIAL_TEAMS; // Fallback until teams load
    return DraftManager.initializeDraftPicks(initialTeams);
  });
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDraftFinished, setIsDraftFinished] = useState(false);

  // Use the player scores hook for managing scores
  const {
    playerScores,
    setPlayerScores,
    isLoading: loadingScores,
    error: scoresError,
    resetScores
  } = usePlayerScores(isDraftFinished);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [players, picks, teamsData, draftStatus] = await Promise.all([
          fetchPlayers(),
          fetchDraftPicks(),
          fetchTeams(),
          getDraftStatus(),
        ]);

        const available = DraftManager.calculateAvailablePlayers(players, picks);

        // Extract team names and budgets
        const teamNames = teamsData.map((t: TeamWithBudget) => t.name);
        const budgetMap = new Map<string, number>();
        teamsData.forEach((t: TeamWithBudget) => {
          budgetMap.set(t.name, t.budget);
        });

        setTeams(teamNames);
        setTeamBudgets(budgetMap);
        setAvailablePlayers(available);

        // Merge fetched picks with initialized structure
        const initializedPicks = DraftManager.initializeDraftPicks(teamNames);
        setDraftPicks({ ...initializedPicks, ...picks });
        setIsDraftFinished(draftStatus);
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
      await setDraftStatus(false);
      const [players, teamsData] = await Promise.all([fetchPlayers(), fetchTeams()]);

      // Extract team names and reset budgets
      const teamNames = teamsData.map((t: TeamWithBudget) => t.name);
      const budgetMap = new Map<string, number>();
      teamsData.forEach((t: TeamWithBudget) => {
        budgetMap.set(t.name, t.budget); // Should be 200 after reset
      });

      setTeams(teamNames);
      setTeamBudgets(budgetMap);
      setAvailablePlayers(players);
      setDraftPicks(DraftManager.initializeDraftPicks(teamNames));
      setSearchTerms({});
      setIsDraftFinished(false);

      // Reset player scores
      resetScores();
    } catch (err) {
      console.error("Failed to reset board:", err);
      alert("Failed to reset board. Please try again.");
    }
  };

  const finishDraft = async () => {
    try {
      await setDraftStatus(true);
      setIsDraftFinished(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to finish draft");
    }
  };

  // Combine any errors from both hooks
  const combinedError = error || scoresError || null;

  // Consider app loading if either data or scores are loading
  const isLoading = loading || (isDraftFinished && loadingScores);

  return {
    teams,
    picks: DraftManager.PICKS,
    availablePlayers,
    draftPicks,
    searchTerms,
    teamBudgets,
    loading: isLoading,
    error: combinedError,
    isDraftFinished,
    playerScores,
    setPlayerScores,
    finishDraft,
    setDraftPicks,
    setAvailablePlayers,
    setTeams,
    setSearchTerms,
    setTeamBudgets,
    handleResetBoard,
  };
};