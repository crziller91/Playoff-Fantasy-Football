"use client";

import { Modal, Button, Label, TextInput, Alert } from "flowbite-react";
import { useState, useMemo, useEffect } from "react";
import { Player, DraftPicks } from "../../types";
import { HiExclamation } from "react-icons/hi";
import { legendColors } from "../../data/positionColors";
import { DraftManager } from "../../domain/DraftManager";
import Image from "next/image";

interface AuctionPlayerModalProps {
    isOpen: boolean;
    onClose: () => void;
    player: Player | null;
    teams: string[];
    draftPicks: DraftPicks;
    teamBudgets: Map<string, number>;
    onConfirm: (team: string, cost: number) => void;
    budgetError?: string;
}

export default function AuctionPlayerModal({
    isOpen,
    onClose,
    player,
    teams,
    draftPicks,
    teamBudgets,
    onConfirm,
    budgetError
}: AuctionPlayerModalProps) {
    const [selectedTeam, setSelectedTeam] = useState<string>("");
    const [cost, setCost] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [alertDismissed, setAlertDismissed] = useState(false);
    const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);
    const [isLoadingHeadshot, setIsLoadingHeadshot] = useState(false);

    // Derive showAlert from budgetError and dismissal state
    const showAlert = !!budgetError && !alertDismissed;

    // Fetch player headshot when modal opens with a player
    useEffect(() => {
        const fetchHeadshot = async () => {
            if (!player || !isOpen) {
                setHeadshotUrl(null);
                return;
            }

            setIsLoadingHeadshot(true);
            console.log(`Fetching headshot for ${player.name}`);

            try {
                const params = new URLSearchParams({
                    playerName: player.name,
                });

                if (player.teamName) {
                    params.append('teamName', player.teamName);
                }

                const response = await fetch(`/api/espn/player/headshot?${params.toString()}`);

                const data = await response.json();

                if (response.ok && data.headshot) {
                    console.log(`Headshot found: ${data.headshot}`);
                    setHeadshotUrl(data.headshot);
                } else {
                    console.log('No headshot available for this player');
                    setHeadshotUrl(null);
                }
            } catch (error) {
                console.error('Error fetching headshot:', error);
                setHeadshotUrl(null);
            } finally {
                setIsLoadingHeadshot(false);
            }
        };

        fetchHeadshot();
    }, [player, isOpen]);

    // Filter teams based on position rules - only show teams that can select this player
    const eligibleTeams = useMemo(() => {
        if (!player) return teams;

        return teams.filter(team => {
            // Use DraftManager to check if this player can be selected by this team
            // We create a dummy player array with just this player to test if it passes the filter
            const canSelectPlayer = DraftManager.filterPlayers([player], team, draftPicks, "");
            return canSelectPlayer.length > 0;
        });
    }, [player, teams, draftPicks]);

    // Calculate maximum bid for each team (budget minus $1 per remaining roster spot after this pick)
    const getMaxBid = (team: string): number => {
        const budget = teamBudgets.get(team) || 0;
        const remainingSpots = DraftManager.getRemainingRosterSpots(team, draftPicks);
        // After this pick, they'll have (remainingSpots - 1) spots left
        // They need to reserve $1 for each of those spots
        const reserve = Math.max(0, remainingSpots - 1);
        return Math.max(0, budget - reserve);
    };

    const handleSubmit = () => {
        // Validate team selection
        if (!selectedTeam) {
            setError("Please select a team");
            return;
        }

        // Validate cost input - only positive whole numbers
        const costValue = parseInt(cost, 10);

        if (!cost || isNaN(costValue)) {
            setError("Please enter a valid amount");
            return;
        }

        if (costValue <= 0) {
            setError("Please enter a positive amount");
            return;
        }

        // Clear error and submit
        setError("");
        setAlertDismissed(false); // Reset dismissal state so alert shows if budget error comes back
        onConfirm(selectedTeam, costValue);
    };

    const handleClose = () => {
        onClose();
    };

    const handleCostChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        // Only allow positive integers
        if (value === "" || /^[0-9]+$/.test(value)) {
            setCost(value);
            setError("");
            // Dismiss alert when user starts typing
            setAlertDismissed(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        // Submit form when Enter key is pressed
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    const handleDismissAlert = () => {
        setAlertDismissed(true);
    };

    if (!player) return null;

    const positionBgColor = legendColors[player.position] || "#6B7280";

    return (
        <Modal show={isOpen} size="lg" onClose={handleClose} popup>
            <Modal.Header />
            <Modal.Body>
                <div className="space-y-6">
                    <div className="text-center">
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Player Up For Auction
                        </h3>
                    </div>

                    {/* Player Info Card */}
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
                        <div className="flex flex-col items-center gap-4">
                            {/* Player Photo or Position Badge */}
                            <div className="flex size-32 items-center justify-center overflow-hidden rounded-full border-4 border-gray-300 bg-gray-200">
                                {isLoadingHeadshot ? (
                                    <div className="flex items-center justify-center">
                                        <div className="size-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                                    </div>
                                ) : headshotUrl ? (
                                    <Image
                                        src={headshotUrl}
                                        alt={player.name}
                                        width={128}
                                        height={128}
                                        className="scale-150 object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <span className="text-4xl font-bold text-gray-500">
                                        {player.position}
                                    </span>
                                )}
                            </div>

                            {/* Player Name */}
                            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {player.name}
                            </h4>

                            {/* Player Details */}
                            <div className="flex gap-4">
                                <span
                                    className="rounded-full px-4 py-1 text-sm font-semibold text-white"
                                    style={{ backgroundColor: positionBgColor }}
                                >
                                    {player.position}
                                </span>
                                {player.teamName && (
                                    <span className="rounded-full bg-gray-600 px-4 py-1 text-sm font-semibold text-white">
                                        {player.teamName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Budget Error Alert - Dismissible */}
                    {budgetError && showAlert && (
                        <Alert
                            color="failure"
                            icon={HiExclamation}
                            onDismiss={handleDismissAlert}
                        >
                            <span className="font-medium">Budget Error!</span> {budgetError}
                        </Alert>
                    )}

                    {/* Team Selection - Click to Select */}
                    <div>
                        <div className="mb-2 block">
                            <Label color={error && !selectedTeam ? "failure" : undefined}>
                                Which team won this player?
                            </Label>
                        </div>
                        <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                            <div className="space-y-2">
                                {eligibleTeams.map((team) => {
                                    const maxBid = getMaxBid(team);
                                    const isSelected = selectedTeam === team;
                                    return (
                                        <div
                                            key={team}
                                            onClick={() => {
                                                setSelectedTeam(team);
                                                setError("");
                                            }}
                                            className={`flex cursor-pointer justify-between rounded px-3 py-2 transition-colors ${
                                                isSelected
                                                    ? 'bg-blue-100 font-semibold dark:bg-blue-900'
                                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600'
                                            }`}
                                        >
                                            <span>{team}</span>
                                            <span>${maxBid}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        {eligibleTeams.length === 0 && (
                            <p className="mt-2 text-sm text-red-600">
                                No teams can select this player due to position restrictions.
                            </p>
                        )}
                    </div>

                    {/* Cost Input */}
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="cost" color={error && cost === "" ? "failure" : undefined}>
                                Purchase Price
                            </Label>
                        </div>
                        <TextInput
                            id="cost"
                            type="text"
                            value={cost}
                            onChange={handleCostChange}
                            onKeyDown={handleKeyDown}
                            color={error && cost === "" ? "failure" : undefined}
                            helperText={error || undefined}
                            placeholder="Enter amount"
                            autoFocus={false}
                            required
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-center gap-4">
                        <Button onClick={handleSubmit} size="lg">
                            Confirm Purchase
                        </Button>
                        <Button color="gray" onClick={handleClose} size="lg">
                            Cancel
                        </Button>
                    </div>
                </div>
            </Modal.Body>
        </Modal>
    );
}
