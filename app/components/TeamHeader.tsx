import { Table } from "flowbite-react";

interface TeamHeaderProps {
  teams: string[];
}

export default function TeamHeader({ teams }: TeamHeaderProps) {
  return (
    <>
      <Table.HeadCell className="w-20 shrink-0 bg-blue-600 px-4 text-center text-white">
        Round
      </Table.HeadCell>
      {teams.map((team) => (
        <Table.HeadCell
          key={team}
          className="bg-blue-600 p-1 text-sm text-white"
        >
          {team}
        </Table.HeadCell>
      ))}
    </>
  );
}
