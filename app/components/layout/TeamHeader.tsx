import { observer } from "mobx-react-lite";
import { Table } from "flowbite-react";
import { useStore } from "../../stores/StoreContext";
import { useState, useEffect, useRef } from "react";

const TeamHeader = observer(() => {
  const { teamsStore } = useStore();
  const { teams, teamBudgets } = teamsStore;

  // Store previous budgets to detect changes
  const prevBudgetsRef = useRef<Map<string, number>>(new Map());

  // Track the single team that is currently animating
  const [animatingTeam, setAnimatingTeam] = useState<string | null>(null);

  // Initialize previous budgets on first render
  useEffect(() => {
    if (prevBudgetsRef.current.size === 0 && teams.length > 0) {
      const initialBudgets = new Map<string, number>();
      teams.forEach(team => {
        initialBudgets.set(team, teamBudgets.get(team) || 0);
      });
      prevBudgetsRef.current = initialBudgets;
    }
  }, [teams, teamBudgets]);

  // Check for budget changes and trigger animation
  useEffect(() => {
    // Skip first render when previous budgets aren't set
    if (prevBudgetsRef.current.size === 0) return;

    let changedTeam: string | null = null;
    let mostRecentChange = 0;

    // Check each team for budget decreases
    teams.forEach(team => {
      const currentBudget = teamBudgets.get(team) || 0;
      const prevBudget = prevBudgetsRef.current.get(team) || 0;

      // If budget decreased, consider it for animation
      if (currentBudget < prevBudget) {
        // We'll only animate the most recently changed team
        // (simplified approach - in a real app you might want to
        // track the exact time of change for each team)
        if (changedTeam === null) {
          changedTeam = team;
          mostRecentChange = currentBudget;
        }
      }
    });

    // Animate only the changed team
    if (changedTeam) {
      setAnimatingTeam(changedTeam);

      // Clear animation after 1 second
      const timerId = setTimeout(() => {
        setAnimatingTeam(null);
      }, 1000);

      // Update previous budgets for next comparison
      const newPrevBudgets = new Map<string, number>();
      teams.forEach(team => {
        newPrevBudgets.set(team, teamBudgets.get(team) || 0);
      });
      prevBudgetsRef.current = newPrevBudgets;

      return () => clearTimeout(timerId);
    } else {
      // Still update previous budgets even if no changes
      const newPrevBudgets = new Map<string, number>();
      teams.forEach(team => {
        newPrevBudgets.set(team, teamBudgets.get(team) || 0);
      });
      prevBudgetsRef.current = newPrevBudgets;
    }
  }, [teams, teamBudgets]);

  return (
    <>
      <Table.HeadCell className="w-20 shrink-0 bg-gray-200 px-4 text-center">
        Pick #
      </Table.HeadCell>
      {teams.map((team) => {
        const budget = teamBudgets.get(team) || 0;
        const isAnimating = team === animatingTeam;

        return (
          <Table.HeadCell
            key={team}
            className="bg-gray-200 px-3 py-2 text-sm"
          >
            <div className="flex flex-col">
              <div className="flex items-center justify-between gap-1">
                <span className="font-bold">{team}</span>
                <span
                  className={`rounded border px-3 py-1 font-bold shadow-sm transition-colors duration-300 ${isAnimating
                      ? "animate-pulse border-red-300 bg-red-100 text-red-800"
                      : "border-green-300 bg-green-100 text-green-800"
                    }`}
                >
                  ${budget}
                </span>
              </div>
            </div>
          </Table.HeadCell>
        );
      })}
    </>
  );
});

export default TeamHeader;