"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Card, Table, Spinner, Alert, Checkbox, Button } from "flowbite-react";
import { usePermissions } from "@/app/hooks/usePermissions";
import { redirect } from "next/navigation";
import { HiCheckCircle, HiLockClosed, HiHome } from "react-icons/hi";
import Link from "next/link";

interface User {
    id: string;
    name: string | null;
    email: string | null;
    permission: Permission | null;
}

interface Permission {
    id: number;
    userId: string;
    editScores: boolean;
    isAdmin: boolean;
}

export default function PermissionsPage() {
    const { data: session } = useSession({
        required: true,
        onUnauthenticated() {
            redirect("/auth/signin?callbackUrl=/admin/permissions");
        },
    });

    const { isAdmin, isLoading: permissionsLoading } = usePermissions();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());

    // Fetch all users with their permissions
    useEffect(() => {
        const fetchUsers = async () => {
            if (!isAdmin) return;

            try {
                setLoading(true);
                setError(null);

                const response = await fetch("/api/user?withPermissions=true");
                if (!response.ok) {
                    throw new Error(`Failed to fetch users: ${response.status}`);
                }

                const data = await response.json();
                setUsers(data);
            } catch (err) {
                console.error("Error fetching users:", err);
                setError(err instanceof Error ? err.message : "Failed to fetch users");
            } finally {
                setLoading(false);
            }
        };

        if (!permissionsLoading && isAdmin) {
            fetchUsers();
        }
    }, [isAdmin, permissionsLoading]);

    // Update user permission
    const handleTogglePermission = async (userId: string, field: 'editScores' | 'isAdmin', currentValue: boolean) => {
        // Prevent multiple clicks
        if (processingUsers.has(userId)) return;

        // Prevent admin from removing their own admin permissions
        if (userId === session?.user?.id && field === 'isAdmin' && currentValue === true) {
            setError("You cannot remove admin permissions from yourself");

            // Auto-hide error message after 3 seconds
            setTimeout(() => {
                setError(null);
            }, 3000);

            return;
        }

        try {
            // Add user to processing set
            setProcessingUsers(prev => new Set(prev).add(userId));

            setError(null);
            setSuccessMessage(null);

            // Create properly typed update data object
            const updatedData: {
                userId: string;
                editScores?: boolean;
                isAdmin?: boolean;
            } = {
                userId
            };

            // Set the field that is being toggled
            updatedData[field] = !currentValue;

            // If removing admin status, we need to explicitly set editScores
            if (field === 'isAdmin' && currentValue === true) {
                // When removing admin, keep the current editScores state
                const user = users.find(u => u.id === userId);
                const currentEditScores = user?.permission?.editScores || false;
                updatedData.editScores = currentEditScores;
            }

            const response = await fetch("/api/permissions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to update permission: ${response.status}`);
            }

            // Update local state
            setUsers((prevUsers) =>
                prevUsers.map((user) => {
                    if (user.id === userId) {
                        const updatedPermission = {
                            ...(user.permission || { id: 0, userId, editScores: false, isAdmin: false }),
                            [field]: !currentValue,
                        };

                        // If user becomes admin, they automatically get editScores
                        if (field === 'isAdmin' && !currentValue) {
                            updatedPermission.editScores = true;
                        }

                        // If user loses admin status, keep their current editScores permission
                        if (field === 'isAdmin' && currentValue) {
                            // Make sure we're assigning a boolean value
                            updatedPermission.editScores = updatedData.editScores === true;
                        }

                        return {
                            ...user,
                            permission: updatedPermission,
                        };
                    }
                    return user;
                })
            );

            setSuccessMessage(`Permission updated successfully for ${users.find(u => u.id === userId)?.name || userId}`);

            // Auto-hide success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage(null);
            }, 3000);

        } catch (err) {
            console.error("Error updating permission:", err);
            setError(err instanceof Error ? err.message : "Failed to update permission");
        } finally {
            // Remove user from processing set
            setProcessingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(userId);
                return newSet;
            });
        }
    };

    // Redirect if not admin
    if (!permissionsLoading && !isAdmin) {
        return (
            <div className="container mx-auto my-8 px-4">
                <Alert color="failure">
                    <p>You do not have permission to access this page.</p>
                    <p>Only administrators can manage user permissions.</p>
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
        <div className="container mx-auto my-8 px-4">
            <h1 className="mb-6 text-2xl font-bold">User Permissions</h1>

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

            <Card>
                <Table>
                    <Table.Head>
                        <Table.HeadCell>Name</Table.HeadCell>
                        <Table.HeadCell>Email</Table.HeadCell>
                        <Table.HeadCell className="text-center">Admin</Table.HeadCell>
                        <Table.HeadCell className="text-center">Can Edit Scores</Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                        {users.map((user) => {
                            const isCurrentUser = user.id === session?.user?.id;
                            const isUserAdmin = user.permission?.isAdmin || false;

                            return (
                                <Table.Row key={user.id} className="hover:bg-gray-50">
                                    <Table.Cell>{user.name || "N/A"}</Table.Cell>
                                    <Table.Cell>{user.email || "N/A"}</Table.Cell>

                                    {/* Admin Permission */}
                                    <Table.Cell className="text-center">
                                        <div className="flex justify-center">
                                            <Checkbox
                                                checked={isUserAdmin}
                                                onChange={() => handleTogglePermission(
                                                    user.id,
                                                    'isAdmin',
                                                    isUserAdmin
                                                )}
                                                disabled={
                                                    processingUsers.has(user.id) ||
                                                    (isCurrentUser && isUserAdmin)
                                                }
                                                className={`cursor-pointer ${isCurrentUser && isUserAdmin ? "opacity-60" : ""}`}
                                            />
                                        </div>
                                        {processingUsers.has(user.id) && (
                                            <div className="mt-1 flex justify-center">
                                                <Spinner size="xs" />
                                            </div>
                                        )}
                                        {isCurrentUser && isUserAdmin && (
                                            <div className="mt-1 text-xs text-gray-500">
                                                (your account)
                                            </div>
                                        )}
                                    </Table.Cell>

                                    {/* Edit Scores Permission */}
                                    <Table.Cell className="text-center">
                                        <div className="flex justify-center">
                                            {isUserAdmin ? (
                                                <div className="flex items-center text-xs text-gray-500">
                                                    <HiLockClosed className="mr-1" />
                                                    <span>Included with Admin</span>
                                                </div>
                                            ) : (
                                                <Checkbox
                                                    checked={user.permission?.editScores || false}
                                                    onChange={() => handleTogglePermission(
                                                        user.id,
                                                        'editScores',
                                                        user.permission?.editScores || false
                                                    )}
                                                    disabled={processingUsers.has(user.id) || isUserAdmin}
                                                    className={`cursor-pointer ${isCurrentUser && isUserAdmin ? "opacity-60" : ""}`}
                                                />
                                            )}
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            );
                        })}
                    </Table.Body>
                </Table>
            </Card>

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
        </div>
    );
}