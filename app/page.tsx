"use client";

import { observer } from "mobx-react-lite";
import { Flowbite, Spinner } from "flowbite-react";
import DraftBoard from "./components/draft/DraftBoard";
import NavigationBar from "./components/layout/Navbar";
import { useStore } from "./stores/StoreContext";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

const Page = observer(() => {
  const store = useStore();
  const { draftStore, teamsStore, playersStore, scoresStore } = store;
  const { status: authStatus } = useSession();

  // The initial load is now distributed across stores
  const loading = draftStore.loading || teamsStore.loading || playersStore.loading || authStatus === "loading";
  const error = draftStore.error || teamsStore.error || playersStore.error;

  // Load scores if draft is finished
  useEffect(() => {
    if (draftStore.isDraftFinished && !scoresStore.scoresLoaded) {
      scoresStore.loadPlayerScores();
    }
  }, [draftStore.isDraftFinished, scoresStore]);

  if (loading) {
    return (
      // eslint-disable-next-line tailwindcss/migration-from-tailwind-2
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
        <Spinner color="info" aria-label="Loading draft board" size="xl" />
      </div>
    );
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
      <NavigationBar />
      <DraftBoard />
    </Flowbite>
  );
});

export default Page;