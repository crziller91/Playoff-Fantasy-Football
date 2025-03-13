import { Table } from "flowbite-react";
import { Player } from "../types";

interface AvailablePlayersProps {
    availablePlayers: Player[];
}

export default function AvailablePlayers({ availablePlayers }: AvailablePlayersProps) {
    return (
        <div className="w-full max-w-lg rounded-lg border-0 bg-white shadow-lg">
            <Table className="w-full rounded-lg border-0 bg-white shadow-lg">
                <Table.Head>
                    <Table.HeadCell
                        colSpan={2}
                        className="bg-blue-600 p-2 text-center text-sm text-white"
                    >
                        Available Players
                    </Table.HeadCell>
                </Table.Head>
            </Table>
            <div className="max-h-96 overflow-y-auto">
                <Table className="w-full border-0 bg-white">
                    <Table.Body>
                        {availablePlayers.length > 0 ? (
                            availablePlayers.map((player) => (
                                <Table.Row key={player.id} className="border-b">
                                    <Table.Cell className="p-2 text-sm">
                                        {player.name}
                                    </Table.Cell>
                                    <Table.Cell className="p-2 text-sm text-gray-500">
                                        {player.position}
                                    </Table.Cell>
                                </Table.Row>
                            ))
                        ) : (
                            <Table.Row>
                                <Table.Cell colSpan={2} className="p-2 text-center text-sm text-gray-500">
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