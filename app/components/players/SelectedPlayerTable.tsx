"use client";

import { observer } from "mobx-react-lite";
import { Table, Button } from "flowbite-react";
import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { positionColors } from "../../data/positionColors";
import { useStore } from "../../stores/StoreContext";
import { Player } from "../../types";
import { usePermissions } from "../../hooks/usePermissions"; // Import the permission hook

const SelectedPlayerTable = observer(() => {
    const { playersStore } = useStore();
    const { availablePlayers, selectedPlayer, setSelectedPlayer } = playersStore;
    const { canEditScores, isAdmin } = usePermissions(); // Get permissions

    // User can edit if they have edit scores permission or admin rights
    const canEdit = isAdmin;

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
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

    // Calculate dropdown position
    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const dropdownWidth = 192; // Matches w-48
            const viewportWidth = window.innerWidth;
            let left = rect.left + window.scrollX;

            if (left + dropdownWidth > viewportWidth) {
                left = viewportWidth - dropdownWidth;
            }
            if (left < 0) left = 0;

            setDropdownPosition({
                top: rect.bottom + window.scrollY + 2,
                left,
            });
        } else {
            setDropdownPosition(null);
        }
    }, [isOpen]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const dropdownElement = document.querySelector("#dropdown-selected-player");
            if (
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node) &&
                dropdownElement &&
                !dropdownElement.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    // Clear search term when dropdown closes
    useEffect(() => {
        if (!isOpen && searchTerm !== "") {
            setSearchTerm("");
        }
    }, [isOpen, searchTerm]);

    // Memoize handlePlayerSelect
    const handlePlayerSelect = useCallback((player: Player) => {
        if (!canEdit) return; // Add permission check

        setSelectedPlayer(player);
        setIsOpen(false);
        setSearchTerm("");
    }, [setSelectedPlayer, canEdit]);

    // Memoize handleRemovePick
    const handleRemovePick = useCallback(() => {
        if (!canEdit) return; // Add permission check

        setSelectedPlayer(null);
        setIsOpen(false);
    }, [setSelectedPlayer, canEdit]);

    const filteredPlayers = availablePlayers.filter((player) =>
        player.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const dropdownContent = useMemo(
        () => (
            <div
                id="dropdown-selected-player"
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
                        onClick={handleRemovePick}
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
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded border px-2 py-1 text-sm"
                    />
                </div>
                <div className="max-h-60 overflow-y-auto">
                    {filteredPlayers.length > 0 ? (
                        filteredPlayers.map((player) => (
                            <div
                                key={player.id}
                                onClick={() => handlePlayerSelect(player)}
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
        ),
        [
            dropdownPosition,
            filteredPlayers,
            isOpen,
            searchTerm,
            selectedPlayer,
            handlePlayerSelect,
            handleRemovePick,
        ]
    );

    // Handle button click with permission check
    const handleButtonClick = () => {
        if (canEdit) {
            setIsOpen(!isOpen);
        }
    };

    return (
        <Table className="w-auto rounded-lg border-0 bg-white shadow-xl">
            <Table.Head>
                <Table.HeadCell className="bg-gray-200 p-2 text-center text-sm">
                    Player For Auction
                </Table.HeadCell>
            </Table.Head>
            <Table.Body>
                <Table.Row>
                    <Table.Cell className="p-1">
                        <div className="relative">
                            <Button
                                ref={buttonRef}
                                onClick={handleButtonClick}
                                color={
                                    selectedPlayer
                                        ? positionColors[selectedPlayer.position]
                                        : "gray"
                                }
                                className={`w-48 justify-start text-sm ${!canEdit ? 'disabled:cursor-not-allowed disabled:opacity-100' : ''}`}
                                disabled={!canEdit} // Disable the button if the user doesn't have permission
                            >
                                {selectedPlayer?.name || "Select Player"}
                            </Button>
                            {isOpen &&
                                dropdownPosition &&
                                isMounted &&
                                canEdit && // Only render the dropdown if the user has permission
                                createPortal(
                                    dropdownContent,
                                    document.body,
                                    "dropdown-portal-selected-player"
                                )}
                        </div>
                    </Table.Cell>
                </Table.Row>
            </Table.Body>
        </Table>
    );
});

export default SelectedPlayerTable;