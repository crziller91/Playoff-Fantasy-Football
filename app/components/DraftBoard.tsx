"use client";

import { Button, Flowbite, Modal } from "flowbite-react";
import DraftTable from "./DraftTable";
import { DraftPicks, Player, Team } from "../types";
import { initializeDraftPicks, randomizeTeams } from "../utils/draftUtils";
import { useState } from "react";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import RandomizeSpinner from "./RandomizeSpinner";  // Add this import

interface DraftBoardProps {
  teams: Team[];
  picks: number[];
  initialPlayers: Player[];
  draftPicks: DraftPicks;
  setDraftPicks: (picks: DraftPicks) => void;
  availablePlayers: Player[];
  setAvailablePlayers: (players: Player[]) => void;
  setTeams: (teams: Team[]) => void;
  searchTerms: { [key: string]: string };
  setSearchTerms: (terms: { [key: string]: string }) => void;
}

export default function DraftBoard({
  teams,
  picks,
  initialPlayers,
  draftPicks,
  setDraftPicks,
  availablePlayers,
  setAvailablePlayers,
  setTeams,
  searchTerms,
  setSearchTerms,
}: DraftBoardProps) {
  const [openModal, setOpenModal] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);  // Add this state

  const handleResetBoard = () => {
    setTeams([...teams]);
    setAvailablePlayers(initialPlayers);
    setDraftPicks(initializeDraftPicks(teams, picks));
    setSearchTerms({});
    setOpenModal(false);
  };

  const handleRandomizeOrder = () => {
    setShowSpinner(true);  // Show spinner when button is clicked
  };

  const handleSpinnerComplete = () => {
    const shuffledTeams = randomizeTeams(teams);
    setTeams(shuffledTeams);
    setDraftPicks(initializeDraftPicks(shuffledTeams, picks));
    setAvailablePlayers(initialPlayers);
    setSearchTerms({});
    setShowSpinner(false);  // Hide spinner when complete
  };

  return (
    <Flowbite>
      <main className="min-h-screen p-4">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex gap-2">
            <Button color="purple" onClick={handleRandomizeOrder}>
              Randomize Draft Order
            </Button>
            <Button color="failure" onClick={() => setOpenModal(true)}>
              Reset Board
            </Button>
          </div>
        </div>
        <DraftTable
          teams={teams}
          picks={picks}
          availablePlayers={availablePlayers}
          draftPicks={draftPicks}
          searchTerms={searchTerms}
          setDraftPicks={setDraftPicks}
          setAvailablePlayers={setAvailablePlayers}
          setSearchTerms={setSearchTerms}
        />
      </main>
      {/* Reset Confirmation Modal */}
      <Modal
        show={openModal}
        size="md"
        onClose={() => setOpenModal(false)}
        popup
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 size-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
              Are you sure you want to reset the draft board?
            </h3>
            <div className="flex justify-center gap-4">
              <Button color="failure" onClick={handleResetBoard}>
                Yes, I&apos;m sure
              </Button>
              <Button color="gray" onClick={() => setOpenModal(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
      {/* Randomize Spinner */}
      {showSpinner && <RandomizeSpinner onComplete={handleSpinnerComplete} />}
    </Flowbite>
  );
}