"use client";

import { Button } from "flowbite-react";
import { Player, Team } from "../types";
import { positionColors } from "../data/positionColors";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface PlayerDropdownProps {
  team: Team;
  pick: number;
  selectedPlayer: Player | null;
  searchTerm: string;
  isOpen: boolean;
  filteredPlayers: Player[];
  onToggle: (key: string | null) => void;
  onSearchChange: (value: string) => void;
  onPlayerSelect: (player: Player) => void;
  onRemovePick: () => void;
}

export default function PlayerDropdown({
  team,
  pick,
  selectedPlayer,
  searchTerm,
  isOpen,
  filteredPlayers,
  onToggle,
  onSearchChange,
  onPlayerSelect,
  onRemovePick,
}: PlayerDropdownProps) {
  const dropdownKey = `${team}-${pick}`.replace(/[^a-zA-Z0-9-]/g, "-");
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Handle client-side rendering
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  const calculatePosition = useCallback(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const dropdownWidth = 192; // Matches w-48
      const viewportWidth = window.innerWidth;
      let left = rect.left + window.scrollX;

      if (left + dropdownWidth > viewportWidth) {
        left = viewportWidth - dropdownWidth;
      }
      if (left < 0) left = 0;

      return {
        top: rect.bottom + window.scrollY + 2,
        left,
      };
    }
    return null;
  }, [isOpen]);

  useEffect(() => {
    setDropdownPosition(calculatePosition());
  }, [isOpen, calculatePosition]);

  // Reset search term when dropdown closes
  useEffect(() => {
    if (!isOpen && searchTerm !== "") {
      onSearchChange(""); // Clear the search term when dropdown closes
    }
  }, [isOpen, searchTerm, onSearchChange]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdownElement = document.querySelector(
        `#dropdown-${dropdownKey}`,
      );
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        dropdownElement &&
        !dropdownElement.contains(event.target as Node)
      ) {
        onToggle(null);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onToggle, dropdownKey]);

  const handleButtonClick = () => {
    onToggle(isOpen ? null : dropdownKey);
  };

  // Memoize the dropdown content to prevent unnecessary re-renders
  const renderDropdownContent = useMemo(() => (
    <div
      id={`dropdown-${dropdownKey}`}
      className="w-48 rounded border border-gray-300 bg-white shadow-lg"
      style={{
        position: "absolute",
        zIndex: 1000,
        top: dropdownPosition?.top ?? 0,
        left: dropdownPosition?.left ?? 0,
      }}
    >
      {selectedPlayer && (
        <div
          onClick={onRemovePick}
          className="cursor-pointer px-4 py-2 text-red-600 hover:bg-gray-100"
        >
          Remove Pick
        </div>
      )}
      <div className="sticky top-0 bg-white p-2">
        <input
          autoFocus={isOpen}
          type="text"
          placeholder="Search players..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        />
      </div>
      <div className="max-h-60 overflow-y-auto">
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <div
              key={player.id}
              onClick={() => onPlayerSelect(player)}
              className="flex cursor-pointer justify-between px-4 py-2 text-sm hover:bg-gray-100"
            >
              <span>{player.name}</span>
              <span className="text-gray-500">{player.position}</span>
            </div>
          ))
        ) : (
          <div className="px-4 py-2 text-sm text-gray-500">
            No available players
          </div>
        )}
      </div>
    </div>
  ), [dropdownKey, dropdownPosition, filteredPlayers, isOpen, onPlayerSelect, onRemovePick, onSearchChange, searchTerm, selectedPlayer]);

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        onClick={handleButtonClick}
        color={
          selectedPlayer ? positionColors[selectedPlayer.position] : "gray"
        }
        className="w-48 justify-start text-sm"
      >
        {selectedPlayer?.name || `Pick ${team} R${pick}`}
      </Button>
      {isOpen &&
        dropdownPosition &&
        isMounted &&
        createPortal(
          renderDropdownContent,
          document.body,
          `dropdown-portal-${dropdownKey}`
        )}
    </div>
  );
}