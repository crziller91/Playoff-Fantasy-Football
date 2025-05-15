"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Card, Table, Spinner, Alert, Button, TextInput, Modal, Label } from "flowbite-react";
import { usePermissions } from "@/app/hooks/usePermissions";
import { redirect } from "next/navigation";
import { HiCheckCircle, HiPencil, HiTrash, HiPlus, HiHome } from "react-icons/hi";
import Link from "next/link";
import ScoringRulesEditor from "@/app/components/admin/ScoringRulesEditor";
import { useStore } from "@/app/stores/StoreContext";
import GlobalBudgetSettings from "@/app/components/admin/GlobalBudgetSettings";

interface Team {
    id: number;
    name: string;
    budget: number;
    originalBudget: number;
}

export default function AdminDashboardPage() {
    const { data: session } = useSession({
        required: true,
        onUnauthenticated() {
            redirect("/auth/signin?callbackUrl=/admin/dashboard");
        },
    });

    const { isAdmin, isLoading: permissionsLoading } = usePermissions();
    const { socket } = useStore();
    const [teams, setTeams] = useState<Team[]>([]);
    const [globalBudget, setGlobalBudget] = useState(200); // Default budget
    const [loading, setLoading] = useState(true);
    const [savingBudget, setSavingBudget] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [draftFinished, setDraftFinished] = useState(false);

    // Modal states
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingTeam, setEditingTeam] = useState<Team | null>(null);
    const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);

    // Form states
    const [teamName, setTeamName] = useState("");
    const [formErrors, setFormErrors] = useState({ name: false });
    const [processing, setProcessing] = useState(false);

    // Fetch all teams and draft status
    useEffect(() => {
        const fetchData = async () => {
            if (!isAdmin) return;

            try {
                setLoading(true);
                setError(null);

                // Fetch teams
                const teamsResponse = await fetch("/api/teams");
                if (!teamsResponse.ok) {
                    throw new Error(`Failed to fetch teams: ${teamsResponse.status}`);
                }
                const teamsData = await teamsResponse.json();

                // Extract the originalBudget from the first team (all teams should have the same originalBudget)
                const globalOriginalBudget = teamsData.length > 0 ? teamsData[0].originalBudget : 200;
                setGlobalBudget(globalOriginalBudget);

                // Fetch draft status
                const draftStatusResponse = await fetch("/api/draft-status");
                if (!draftStatusResponse.ok) {
                    throw new Error(`Failed to fetch draft status: ${draftStatusResponse.status}`);
                }
                const draftStatusData = await draftStatusResponse.json();

                setTeams(teamsData);
                setDraftFinished(draftStatusData.isDraftFinished);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err instanceof Error ? err.message : "Failed to fetch data");
            } finally {
                setLoading(false);
            }
        };

        if (!permissionsLoading && isAdmin) {
            fetchData();
        }
    }, [isAdmin, permissionsLoading]);

    // Function to update all team budgets
    const handleSaveGlobalBudget = async (budgetValue: number) => {
        if (draftFinished) return;

        try {
            setSavingBudget(true);
            setError(null);
            setSuccessMessage(null);

            // Call the API endpoint to update all team budgets
            const response = await fetch("/api/teams/budget", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    budget: budgetValue
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to update team budgets: ${response.status}`);
            }

            await response.json();

            // Update local state
            setGlobalBudget(budgetValue);

            // Update team budgets in the teams array
            setTeams(teams.map(team => ({
                ...team,
                budget: budgetValue,
                originalBudget: budgetValue
            })));

            // Emit socket event for real-time updates
            if (socket) {
                socket.emit("teamUpdate", {
                    action: "update_all_budgets",
                    budget: budgetValue
                });
            }

            setSuccessMessage(`Updated all team budgets to $${budgetValue}`);

            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (err) {
            console.error("Error updating team budgets:", err);
            setError(err instanceof Error ? err.message : "Failed to update team budgets");
        } finally {
            setSavingBudget(false);
        }
    };

    // Form validation
    const validateForm = () => {
        const errors = {
            name: !teamName.trim()
        };
        setFormErrors(errors);
        return !errors.name;
    };

    // Handle team add - only needs name, budget comes from global setting
    const handleAddTeam = async () => {
        if (!validateForm() || draftFinished) return;

        try {
            setProcessing(true);
            setError(null);
            setSuccessMessage(null);

            const response = await fetch("/api/teams", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: teamName,
                    budget: globalBudget // Use the global budget
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to add team: ${response.status}`);
            }

            const newTeam = await response.json();

            // Update local state
            setTeams([...teams, newTeam]);

            // Emit socket event for real-time updates
            if (socket) {
                socket.emit("teamUpdate", {
                    action: "add",
                    team: newTeam,
                    teamName: newTeam.name
                });
            }

            setSuccessMessage(`Team "${teamName}" added successfully`);
            setShowAddModal(false);
            resetForm();

            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (err) {
            console.error("Error adding team:", err);
            setError(err instanceof Error ? err.message : "Failed to add team");
        } finally {
            setProcessing(false);
        }
    };

    // Handle team edit - only edit name, budget is managed globally
    const handleEditTeam = async () => {
        if (!validateForm() || !editingTeam || draftFinished) return;

        try {
            setProcessing(true);
            setError(null);
            setSuccessMessage(null);

            const response = await fetch(`/api/teams/${editingTeam.id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: teamName,
                    budget: globalBudget // Always use the global budget
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to update team: ${response.status}`);
            }

            const updatedTeam = await response.json();

            // Store the old name before updating state
            const oldName = editingTeam.name;

            // Update local state
            setTeams(teams.map(team => team.id === editingTeam.id ? updatedTeam : team));

            // Emit socket event for real-time updates
            if (socket) {
                socket.emit("teamUpdate", {
                    action: "update",
                    team: updatedTeam,
                    oldName: oldName, // Include the old name in case it changed
                    teamName: updatedTeam.name
                });
            }

            setSuccessMessage(`Team "${teamName}" updated successfully`);
            setShowEditModal(false);
            resetForm();

            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (err) {
            console.error("Error updating team:", err);
            setError(err instanceof Error ? err.message : "Failed to update team");
        } finally {
            setProcessing(false);
        }
    };

    // Handle team delete
    const handleDeleteTeam = async () => {
        if (!deletingTeam || draftFinished) return;

        try {
            setProcessing(true);
            setError(null);
            setSuccessMessage(null);

            const response = await fetch(`/api/teams/${deletingTeam.id}`, {
                method: "DELETE"
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to delete team: ${response.status}`);
            }

            // Store the team name before removing from state
            const teamName = deletingTeam.name;

            // Update local state
            setTeams(teams.filter(team => team.id !== deletingTeam.id));

            // Emit socket event for real-time updates
            if (socket) {
                socket.emit("teamUpdate", {
                    action: "delete",
                    teamName: teamName
                });
            }

            setSuccessMessage(`Team "${deletingTeam.name}" deleted successfully`);
            setShowDeleteModal(false);

            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);
        } catch (err) {
            console.error("Error deleting team:", err);
            setError(err instanceof Error ? err.message : "Failed to delete team");
        } finally {
            setProcessing(false);
        }
    };

    // Open edit modal with team data - only need the name
    const openEditModal = (team: Team) => {
        setEditingTeam(team);
        setTeamName(team.name);
        setFormErrors({ name: false });
        setShowEditModal(true);
    };

    // Open delete modal with team data
    const openDeleteModal = (team: Team) => {
        setDeletingTeam(team);
        setShowDeleteModal(true);
    };

    // Reset form state
    const resetForm = () => {
        setTeamName("");
        setFormErrors({ name: false });
        setEditingTeam(null);
        setDeletingTeam(null);
    };

    // Redirect if not admin
    if (!permissionsLoading && !isAdmin) {
        return (
            <div className="container mx-auto my-8 px-4">
                <Alert color="failure">
                    <p>You do not have permission to access this page.</p>
                    <p>Only administrators can manage teams and draft settings.</p>
                </Alert>
                <div className="mt-4">
                    <Button as={Link} href="/" color="light">
                        Return Home
                    </Button>
                </div>
            </div>
        );
    }

    if (loading || permissionsLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner size="xl" />
            </div>
        );
    }

    return (
        <div className="container mx-auto my-8 px-4 pb-8">
            <h1 className="mb-6 text-2xl font-bold">Admin Dashboard</h1>

            {/* Draft status warning */}
            {draftFinished && (
                <Alert color="warning" className="mb-4">
                    <p className="font-medium">Draft is already completed!</p>
                    <p>Teams and budgets cannot be modified after the draft is finished.</p>
                </Alert>
            )}

            {/* Error/Success messages */}
            {error && (
                <Alert color="failure" className="mb-4">
                    {error}
                </Alert>
            )}

            {successMessage && (
                <Alert color="success" className="mb-4" icon={HiCheckCircle}>
                    {successMessage}
                </Alert>
            )}

            {/* Global Budget Settings */}
            <GlobalBudgetSettings
                currentBudget={globalBudget}
                onSaveBudget={handleSaveGlobalBudget}
                isLoading={savingBudget}
                draftFinished={draftFinished}
            />

            {/* Teams management */}
            <div className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Teams Management</h2>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        disabled={draftFinished}
                        color={draftFinished ? "gray" : "success"}
                    >
                        <HiPlus className="mr-1 size-5" />
                        Add Team
                    </Button>
                </div>

                <Card>
                    <Table>
                        <Table.Head>
                            <Table.HeadCell>Team Name</Table.HeadCell>
                            <Table.HeadCell>Actions</Table.HeadCell>
                        </Table.Head>
                        <Table.Body>
                            {teams.length > 0 ? (
                                teams.map((team) => (
                                    <Table.Row key={team.id} className="hover:bg-gray-50">
                                        <Table.Cell>{team.name}</Table.Cell>
                                        <Table.Cell>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="xs"
                                                    color="info"
                                                    onClick={() => openEditModal(team)}
                                                    disabled={draftFinished}
                                                >
                                                    <HiPencil />
                                                </Button>
                                                <Button
                                                    size="xs"
                                                    color="failure"
                                                    onClick={() => openDeleteModal(team)}
                                                    disabled={draftFinished}
                                                >
                                                    <HiTrash />
                                                </Button>
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                ))
                            ) : (
                                <Table.Row>
                                    <Table.Cell colSpan={3} className="text-center text-gray-500">
                                        No teams found. Add a team to get started.
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        </Table.Body>
                    </Table>
                </Card>
            </div>

            {/* Scoring Rules Editor */}
            <ScoringRulesEditor />

            <div className="mt-6 flex">
                <Button
                    as={Link} href="/?tab=draft"
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    color="light"
                >
                    <HiHome className="mr-2 size-5" />
                    Return Home
                </Button>
            </div>

            {/* Add Team Modal - Simplified to only include name field */}
            <Modal show={showAddModal} onClose={() => setShowAddModal(false)}>
                <Modal.Header>Add New Team</Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="teamName" value="Team Name" color={formErrors.name ? "failure" : undefined} />
                            </div>
                            <TextInput
                                id="teamName"
                                value={teamName}
                                onChange={(e) => {
                                    setTeamName(e.target.value);
                                    if (formErrors.name) setFormErrors({ ...formErrors, name: false });
                                }}
                                color={formErrors.name ? "failure" : undefined}
                                helperText={formErrors.name ? "Team name is required" : undefined}
                            />
                        </div>
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="teamBudgetInfo" value="Budget" />
                            </div>
                            <div className="text-sm text-gray-500">
                                All teams use the global budget of ${globalBudget}
                            </div>
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleAddTeam} disabled={processing}>
                        {processing ? "Adding..." : "Add Team"}
                    </Button>
                    <Button color="gray" onClick={() => {
                        setShowAddModal(false);
                        resetForm();
                    }}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Edit Team Modal - Simplified to only include name field */}
            <Modal show={showEditModal} onClose={() => setShowEditModal(false)}>
                <Modal.Header>Edit Team Name</Modal.Header>
                <Modal.Body>
                    <div className="space-y-4">
                        <div>
                            <div className="mb-2 block">
                                <Label htmlFor="editTeamName" value="Team Name" color={formErrors.name ? "failure" : undefined} />
                            </div>
                            <TextInput
                                id="editTeamName"
                                value={teamName}
                                onChange={(e) => {
                                    setTeamName(e.target.value);
                                    if (formErrors.name) setFormErrors({ ...formErrors, name: false });
                                }}
                                color={formErrors.name ? "failure" : undefined}
                                helperText={formErrors.name ? "Team name is required" : undefined}
                            />
                        </div>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={handleEditTeam} disabled={processing}>
                        {processing ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button color="gray" onClick={() => {
                        setShowEditModal(false);
                        resetForm();
                    }}>
                        Cancel
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Delete Team Modal */}
            <Modal show={showDeleteModal} onClose={() => setShowDeleteModal(false)} popup size="md">
                <Modal.Header />
                <Modal.Body>
                    <div className="text-center">
                        <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
                            Are you sure you want to delete the team: {deletingTeam?.name}?
                        </h3>
                        <div className="flex justify-center gap-4">
                            <Button color="failure" onClick={handleDeleteTeam} disabled={processing}>
                                {processing ? "Deleting..." : "Yes, delete"}
                            </Button>
                            <Button color="gray" onClick={() => {
                                setShowDeleteModal(false);
                                setDeletingTeam(null);
                            }}>
                                No, cancel
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}