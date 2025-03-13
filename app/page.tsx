"use client";

import { useState } from "react";
import DraftBoard from "./components/DraftBoard";
import { initialPlayers } from "./data/initialPlayers";
import { Team, DraftPicks } from "./types";
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
  const [availablePlayers, setAvailablePlayers] = useState(initialPlayers);
  const [draftPicks, setDraftPicks] = useState<DraftPicks>(
    initializeDraftPicks(initialTeams, picks),
  );
  const [searchTerms, setSearchTerms] = useState<{ [key: string]: string }>({});

  return (
    <Flowbite>
      <NavigationBar />
      <DraftBoard
        teams={teams}
        picks={picks}
        initialPlayers={initialPlayers}
        draftPicks={draftPicks}
        setDraftPicks={setDraftPicks}
        availablePlayers={availablePlayers}
        setAvailablePlayers={setAvailablePlayers}
        setTeams={setTeams}
        searchTerms={searchTerms}
        setSearchTerms={setSearchTerms}
      />
    </Flowbite>
  );
}
