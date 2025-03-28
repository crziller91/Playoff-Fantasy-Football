"use client";

import { useEffect, useState } from "react";
import DraftBoard from "./components/DraftBoard";
import { Team, DraftPicks, Player } from "./types";
import { initializeDraftPicks } from "./utils/draftUtils";
import { Flowbite } from "flowbite-react";
import NavigationBar from "./components/Navbar";

export default function Page() {
  const initialTeams: Team[] = [
    "Luis",
    "Sill",
    "Hunter & Julie",
    "Joe",
    "Peter",
    "Alan",
    "Rohan",
    "JT",
    "Christian",
    "Dougie",
  ];

  const picks = Array.from({ length: 6 }, (_, i) => i + 1);

  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [draftPicks, setDraftPicks] = useState<DraftPicks>(
    initializeDraftPicks(initialTeams, picks),
  );
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        console.log("Fetching data from API...");

        // Fetch players
        const playersResponse = await fetch('/api/players');
        if (!playersResponse.ok) {
          throw new Error(`API returned status: ${playersResponse.status} when fetching players`);
        }
        const playersData = await playersResponse.json();

        // Fetch draft picks
        const draftPicksResponse = await fetch('/api/draftpicks');
        if (!draftPicksResponse.ok) {
          throw new Error(`API returned status: ${draftPicksResponse.status} when fetching draft picks`);
        }
        const draftPicksData = await draftPicksResponse.json();

        console.log("Data loaded:", {
          players: playersData.length,
          draftPicks: Object.keys(draftPicksData).length
        });

        // Calculate which players are currently available (not drafted)
        const draftedPlayerIds = new Set();

        for (const team of Object.keys(draftPicksData)) {
          const teamPicks = draftPicksData[team];
          for (const round of Object.keys(teamPicks)) {
            const player = teamPicks[round];
            if (player) {
              draftedPlayerIds.add(player.id);
            }
          }
        }

        const availablePlayers = playersData.filter(
          (player: Player) => !draftedPlayerIds.has(player.id)
        );

        setAvailablePlayers(availablePlayers);
        setDraftPicks(draftPicksData);
        setLoading(false);
      } catch (error) {
        console.error("Failed to load data:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleResetBoard = async () => {
    try {
      // First reset draft picks in the database
      const response = await fetch('/api/draftpicks', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to reset draft picks: ${response.status}`);
      }

      // Then reset local state
      setTeams([...initialTeams]);
      const playersResponse = await fetch('/api/players');
      const players = await playersResponse.json();
      setAvailablePlayers(players);
      setDraftPicks(initializeDraftPicks(initialTeams, picks));
      setSearchTerms({});
    } catch (error) {
      console.error("Failed to reset board:", error);
      alert("Failed to reset board. Please try again.");
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="text-red-600 text-xl mb-4">Error loading data: {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <Flowbite>
      <NavigationBar onResetBoard={handleResetBoard} />
      <DraftBoard
        teams={teams}
        picks={picks}
        initialPlayers={availablePlayers}
        draftPicks={draftPicks}
        setDraftPicks={setDraftPicks}
        availablePlayers={availablePlayers}
        setAvailablePlayers={setAvailablePlayers}
        setTeams={setTeams}
        searchTerms={searchTerms}
        setSearchTerms={setSearchTerms}
        onResetBoard={handleResetBoard}
      />
    </Flowbite>
  );
}
