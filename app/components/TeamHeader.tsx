import { Table } from "flowbite-react";

interface TeamHeaderProps {
  teams: string[];
  teamBudgets: Map<string, number>;
}

export default function TeamHeader({ teams, teamBudgets }: TeamHeaderProps) {
  return (
    <>
      <Table.HeadCell className="w-20 shrink-0 bg-blue-600 px-4 text-center text-white">
        Pick #
      </Table.HeadCell>
      {teams.map((team) => {
        const budget = teamBudgets.get(team) || 0;
        return (
          <Table.HeadCell
            key={team}
            className="bg-blue-600 p-1 text-sm text-white"
          >
            <div className="flex flex-col">
              <span>{team}</span>
              <span className="text-xs font-normal">${budget}</span>
            </div>
          </Table.HeadCell>
        );
      })}
    </>
  );
}