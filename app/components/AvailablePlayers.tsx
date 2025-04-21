import { Table, Dropdown } from "flowbite-react";
import { Player } from "../types";
import { useState, useRef, useEffect } from "react";
import { legendColors } from "../data/positionColors";
import { HiFilter } from "react-icons/hi";

interface AvailablePlayersProps {
    availablePlayers: Player[];
}

type PositionType = "QB" | "RB" | "WR" | "TE" | "K" | "DST" | "ALL";

export default function AvailablePlayers({ availablePlayers }: AvailablePlayersProps) {
    // Add state for the position filter
    const [positionFilter, setPositionFilter] = useState<PositionType>("ALL");
    const containerRef = useRef<HTMLDivElement>(null);

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

    return (
        <div className="w-full h-full rounded-lg border-0 bg-white shadow-xl">
            <Table className="w-full rounded-lg border-0 bg-white shadow-xl">
                <Table.Head>
                    <Table.HeadCell
                        colSpan={8}
                        className="bg-gray-200 p-2 flex justify-between items-center text-sm"
                    >
                        <div className="flex-1">
                            <span className="pl-4">Available Players</span>
                        </div>

                        <div className="flex items-center">
                            {/* Position filter dropdown */}
                            <Dropdown
                                label={
                                    <div className="flex items-center text-sm font-normal">
                                        <HiFilter className="mr-1" />
                                        {positionFilter === "ALL" ? "All Positions" : positionFilter}
                                    </div>
                                }
                                color="alternative"
                                size="sm"
                                dismissOnClick={true}
                            >
                                <Dropdown.Item onClick={() => setPositionFilter("ALL")} className="font-normal">
                                    All Positions
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                {positions.map(pos => (
                                    <Dropdown.Item
                                        key={pos}
                                        onClick={() => setPositionFilter(pos)}
                                        className="flex items-center font-normal"
                                    >
                                        <div
                                            className="w-3 h-3 rounded-full mr-2"
                                            style={{ backgroundColor: legendColors[pos] }}
                                        ></div>
                                        {pos}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown>
                        </div>
                    </Table.HeadCell>
                </Table.Head>
            </Table>

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
                                            <Table.Cell className={`flex items-center justify-between p-2 text-sm ${index === 0 ? 'text-black font-bold' : ''}`}>
                                                <span className="truncate">{player.name}</span>
                                                <span
                                                    className={`ml-2 ${index === 0 ? 'text-black font-bold' : 'text-gray-500'}`}
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
}