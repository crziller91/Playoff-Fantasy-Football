import { observer } from "mobx-react-lite";
import { Table } from "flowbite-react";
import { useStore } from "../../stores/StoreContext";

const TeamHeader = observer(() => {
  const { teamsStore } = useStore();
  const { teams, teamBudgets } = teamsStore;

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
});

export default TeamHeader;