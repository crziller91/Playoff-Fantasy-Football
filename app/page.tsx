"use client";

import { observer } from "mobx-react-lite";
import { Flowbite, Spinner, Alert, Button } from "flowbite-react";
import DraftBoard from "./components/draft/DraftBoard";
import NavigationBar from "./components/layout/Navbar";
import { useStore } from "./stores/StoreContext";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

const Page = observer(() => {
  const store = useStore();
  const { draftStore, teamsStore, playersStore, scoresStore } = store;
  const { status: authStatus } = useSession();
  const [retryCount, setRetryCount] = useState(0);
  const [showRetryButton, setShowRetryButton] = useState(false);

  // The initial load is now distributed across stores
  const loading = draftStore.loading || teamsStore.loading || playersStore.loading || authStatus === "loading";
  const error = draftStore.error || teamsStore.error || playersStore.error;

  // Force a data reload if we don't have players after initial load
  useEffect(() => {
    // Only check once initial loading is complete
    if (!loading && playersStore.allPlayers.length === 0 && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`Initial load: No players available, reloading (attempt ${retryCount + 1})`);
        playersStore.loadPlayers();
        setRetryCount(prev => prev + 1);

        // If we've tried 3 times and still no players, show retry button
        if (retryCount === 2) {
          setShowRetryButton(true);
        }
      }, 1000); // Wait 1 second before retry

      return () => clearTimeout(timer);
    }
  }, [loading, playersStore, retryCount]);

  // Load scores if draft is finished
  useEffect(() => {
    if (draftStore.isDraftFinished && !scoresStore.scoresLoaded) {
      scoresStore.loadPlayerScores();
    }
  }, [draftStore.isDraftFinished, scoresStore]);

  // Manual retry handler
  const handleManualRetry = () => {
    setShowRetryButton(false);
    setRetryCount(0);

    // Force reload of all data
    teamsStore.loadTeams();
    playersStore.loadPlayers();
    draftStore.loadDraftStatus();
  };

  if (loading) {
    return (
      // eslint-disable-next-line tailwindcss/migration-from-tailwind-2
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <div className="text-center">
          <Spinner color="info" aria-label="Loading draft board" size="xl" className="mb-4" />
          <div className="text-white">Loading draft data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <div className="mb-6 text-xl text-red-600">Error loading data: {error}</div>
        <Button
          onClick={() => window.location.reload()}
          className="mb-4 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
        >
          Reload Page
        </Button>
        <Alert color="warning" className="max-w-lg">
          <div className="text-sm">
            If this error persists, try clearing your browser cache or using a private/incognito window.
          </div>
        </Alert>
      </div>
    );
  }

  // Show a message if we have no players data but no other errors
  if (playersStore.allPlayers.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-4">
        <div className="mb-6 text-xl">Unable to load player data</div>
        {showRetryButton ? (
          <>
            <Button
              onClick={handleManualRetry}
              className="mb-4 rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700"
            >
              Retry Loading Data
            </Button>
            <Button
              onClick={() => window.location.reload()}
              color="light"
              className="mb-4"
            >
              Reload Page
            </Button>
          </>
        ) : (
          <Spinner color="info" aria-label="Retrying data load" />
        )}
      </div>
    );
  }

  return (
    <Flowbite>
      <NavigationBar />
      <DraftBoard />
    </Flowbite>
  );
});

export default Page;