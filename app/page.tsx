"use client";

import { Flowbite } from "flowbite-react";
import DraftBoard from "./components/DraftBoard";
import NavigationBar from "./components/Navbar";
import { useDraft } from "./hooks/useDraft"; // Custom hook for draft logic

export default function Page() {
  const {
    teams,
    picks,
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
  } = useDraft();

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center">
        <div className="mb-4 text-xl text-red-600">Error loading data: {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
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