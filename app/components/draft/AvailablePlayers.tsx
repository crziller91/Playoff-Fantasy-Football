import { observer } from "mobx-react-lite";
import { Table, Dropdown } from "flowbite-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { legendColors } from "../../data/positionColors";
import { HiFilter } from "react-icons/hi";
import { useStore } from "../../stores/StoreContext";
import { createPortal } from "react-dom";

type PositionType = "QB" | "RB" | "WR" | "TE" | "K" | "DST" | "ALL";

const AvailablePlayers = observer(() => {
    const { playersStore } = useStore();
    const { availablePlayers } = playersStore;

    // Add state for the position filter
    const [positionFilter, setPositionFilter] = useState<PositionType>("ALL");
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const filterButtonRef = useRef<HTMLButtonElement>(null);
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
    const [isMounted, setIsMounted] = useState(false);

    // Client-side only
    useEffect(() => {
        setIsMounted(true);
        return () => setIsMounted(false);
    }, []);

    // Calculate dropdown position
    const updateDropdownPosition = useCallback(() => {
        if (filterButtonRef.current) {
            const rect = filterButtonRef.current.getBoundingClientRect();
            setDropdownPosition({
                top: rect.bottom + window.scrollY,
                left: rect.left + window.scrollX
            });
        }
    }, []);

    // Update position when dropdown opens
    useEffect(() => {
        if (isDropdownOpen) {
            updateDropdownPosition();
        }
    }, [isDropdownOpen, updateDropdownPosition]);

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isDropdownOpen &&
                filterButtonRef.current &&
                !filterButtonRef.current.contains(event.target as Node) &&
                !document.getElementById('position-dropdown-menu')?.contains(event.target as Node)
            ) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [isDropdownOpen]);

    // Filter players based on the selected position
    const filteredPlayers = positionFilter === "ALL"
        ? availablePlayers
        : availablePlayers.filter(player => player.position === positionFilter);

    // Get unique positions for creating filter dropdown
    const positions: ("QB" | "RB" | "WR" | "TE" | "K" | "DST")[] = ["QB", "RB", "WR", "TE", "K", "DST"];

    // Use the TOTAL number of players for width, not the filtered count
    // This ensures the container size never changes
    const tableWidth = `${Math.max(availablePlayers.length, 1) * 144}px`;

    // Adjust scroll position on filter change
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollLeft = 0;
        }
    }, [positionFilter]);

    // Handle position selection
    const handleSelectPosition = (position: PositionType) => {
        setPositionFilter(position);
        setIsDropdownOpen(false);
    };

    return (
        <div className="size-full overflow-hidden rounded-lg border-0 bg-white shadow-xl">
            <Table className="w-full rounded-lg border-0 bg-white shadow-xl">
                <Table.Head>
                    <Table.HeadCell
                        colSpan={8}
                        className="flex items-center justify-between bg-gray-200 p-2 text-sm"
                    >
                        <div className="flex-1">
                            <span className="pl-4">Available Players</span>
                        </div>

                        <div className="flex items-center">
                            {/* Custom dropdown trigger button */}
                            <button
                                ref={filterButtonRef}
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="inline-flex items-center rounded-lg bg-gray-50 px-3 py-1.5 text-center text-sm font-medium text-gray-500 hover:bg-gray-100 focus:outline-none"
                            >
                                <HiFilter className="mr-1" />
                                {positionFilter === "ALL" ? "All Positions" : positionFilter}
                                <svg className="ms-2 size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>
                        </div>
                    </Table.HeadCell>
                </Table.Head>
            </Table>

            {/* Custom dropdown menu rendered in portal */}
            {isDropdownOpen && isMounted && createPortal(
                <div
                    id="position-dropdown-menu"
                    className="z-50 w-44 divide-y divide-gray-100 rounded-lg bg-white shadow"
                    style={{
                        position: 'absolute',
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                    }}
                >
                    <ul className="py-2 text-sm text-gray-700">
                        <li>
                            <a
                                href="#"
                                className="block px-4 py-2 hover:bg-gray-100"
                                onClick={(e) => { e.preventDefault(); handleSelectPosition("ALL"); }}
                            >
                                All Positions
                            </a>
                        </li>
                        {positions.map(pos => (
                            <li key={pos}>
                                <a
                                    href="#"
                                    className="flex items-center px-4 py-2 hover:bg-gray-100"
                                    onClick={(e) => { e.preventDefault(); handleSelectPosition(pos); }}
                                >
                                    <div
                                        className="mr-2 size-3 rounded-full"
                                        style={{ backgroundColor: legendColors[pos] }}
                                    ></div>
                                    {pos}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>,
                document.body
            )}

            {/* Fixed width container with hidden scrollbar for layout */}
            <div className="w-full" style={{ position: 'relative', height: '60px' }}>
                {/* Hidden full-width container to maintain layout */}
                <div
                    style={{
                        width: tableWidth,
                        position: 'absolute',
                        visibility: 'hidden',
                        height: '1px'
                    }}
                />

                {/* Visible scrollable container with dynamic content */}
                <div
                    ref={containerRef}
                    className="overflow-x-auto"
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                    }}
                >
                    <div style={{ width: `${Math.max(filteredPlayers.length, 1) * 144}px` }} className="min-w-full">
                        <Table className="w-full border-0 bg-white">
                            <Table.Body className="flex">
                                {filteredPlayers.length > 0 ? (
                                    filteredPlayers.map((player, index) => (
                                        <Table.Row
                                            key={player.id}
                                            className={`w-36 shrink-0 border-r ${index === 0 ? 'bg-yellow-200' : ''}`}
                                        >
                                            <Table.Cell className={`flex items-center justify-between p-2 text-sm ${index === 0 ? 'font-bold text-black' : ''}`}>
                                                <span className="truncate">{player.name}</span>
                                                <span
                                                    className={`ml-2 ${index === 0 ? 'font-bold text-black' : 'text-gray-500'}`}
                                                    style={{ color: index === 0 ? 'black' : legendColors[player.position] }}
                                                >
                                                    {player.position}
                                                </span>
                                            </Table.Cell>
                                        </Table.Row>
                                    ))
                                ) : (
                                    <Table.Row className="w-full">
                                        <Table.Cell className="p-2 text-center text-sm text-gray-500">
                                            No players available with {positionFilter === "ALL" ? "any" : positionFilter} position
                                        </Table.Cell>
                                    </Table.Row>
                                )}
                            </Table.Body>
                        </Table>
                    </div>
                </div>
            </div>
        </div>
    );
});

export default AvailablePlayers;