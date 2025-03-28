import { Table } from "flowbite-react";
import { Player } from "../types";

interface AvailablePlayersProps {
    availablePlayers: Player[];
}

export default function AvailablePlayers({ availablePlayers }: AvailablePlayersProps) {
    return (
        <div className="w-full rounded-lg border-0 bg-white shadow-lg">
            <Table className="w-full rounded-lg border-0 bg-white shadow-lg">
                <Table.Head>
                    <Table.HeadCell
                        colSpan={8}
                        className="bg-blue-600 p-2 text-center text-sm text-white"
                    >
                        Available Players
                    </Table.HeadCell>
                </Table.Head>
            </Table>
            <div className="overflow-x-auto">
                <Table className="w-full border-0 bg-white">
                    <Table.Body className="flex">
                        {availablePlayers.length > 0 ? (
                            availablePlayers.map((player, index) => (
                                <Table.Row
                                    key={player.id}
                                    className={`w-36 shrink-0 border-r ${index === 0 ? 'bg-yellow-200' : ''}`}
                                >
                                    <Table.Cell className={`flex items-center justify-between p-2 text-sm ${index === 0 ? 'text-black font-bold' : ''}`}>
                                        <span className="truncate">{player.name}</span>
                                        <span className={`ml-2 ${index === 0 ? 'text-black font-bold' : 'text-gray-500'}`}>{player.position}</span>
                                    </Table.Cell>
                                </Table.Row>
                            ))
                        ) : (
                            <Table.Row className="w-full">
                                <Table.Cell className="p-2 text-center text-sm text-gray-500">
                                    No players available
                                </Table.Cell>
                            </Table.Row>
                        )}
                    </Table.Body>
                </Table>
            </div>
        </div>
    );
}