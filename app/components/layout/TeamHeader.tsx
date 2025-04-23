import { Table } from "flowbite-react";

interface TeamHeaderProps {
  teams: string[];
  teamBudgets: Map<string, number>;
}

export default function TeamHeader({ teams, teamBudgets }: TeamHeaderProps) {
  return (
    <>
      <Table.HeadCell className="w-20 shrink-0 bg-gray-200 px-4 text-center">
        Pick #
      </Table.HeadCell>
      {teams.map((team) => {
        const budget = teamBudgets.get(team) || 0;
        return (
          <Table.HeadCell
            key={team}
            className="bg-gray-200 p-1 text-sm"
          >
            <div className="flex flex-col">
              <span>{team} <span style={{ fontWeight: 'normal' }}>${budget}</span></span>
            </div>
          </Table.HeadCell>
        );
      })}
    </>
  );
}