"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Card, Table, Spinner, Alert, Checkbox, Button } from "flowbite-react";
import { usePermissions } from "@/app/hooks/usePermissions";
import { redirect } from "next/navigation";
import { HiCheckCircle } from "react-icons/hi";
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
}

export default function PermissionsPage() {
    const { data: session } = useSession({
        required: true,
        onUnauthenticated() {
            redirect("/auth/signin?callbackUrl=/admin/permissions");
        },
    });

    const { canEditScores, isLoading: permissionsLoading } = usePermissions();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [processingUsers, setProcessingUsers] = useState<Set<string>>(new Set());

    // Fetch all users with their permissions
    useEffect(() => {
        const fetchUsers = async () => {
            if (!canEditScores) return;

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

        if (!permissionsLoading && canEditScores) {
            fetchUsers();
        }
    }, [canEditScores, permissionsLoading]);

    // Update user permission
    const handleTogglePermission = async (userId: string, currentValue: boolean) => {
        // Prevent multiple clicks
        if (processingUsers.has(userId)) return;

        // Prevent admin from removing their own admin permissions
        if (userId === session?.user?.id && currentValue === true) {
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

            const response = await fetch("/api/permissions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    userId,
                    editScores: !currentValue,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Failed to update permission: ${response.status}`);
            }

            // Update local state
            setUsers((prevUsers) =>
                prevUsers.map((user) => {
                    if (user.id === userId) {
                        return {
                            ...user,
                            permission: {
                                ...(user.permission || { id: 0, userId }),
                                editScores: !currentValue,
                            },
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
    if (!permissionsLoading && !canEditScores) {
        return (
            <div className="container mx-auto my-8 px-4">
                <Alert color="failure">
                    <p>You do not have permission to access this page.</p>
                </Alert>
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
                        <Table.HeadCell className="text-center">Can Edit Scores</Table.HeadCell>
                        {/* Add more permission columns here as needed */}
                    </Table.Head>
                    <Table.Body>
                        {users.map((user) => (
                            <Table.Row key={user.id} className="hover:bg-gray-50">
                                <Table.Cell>{user.name || "N/A"}</Table.Cell>
                                <Table.Cell>{user.email || "N/A"}</Table.Cell>
                                <Table.Cell className="text-center">
                                    <div className="flex justify-center">
                                        <Checkbox
                                            checked={user.permission?.editScores || false}
                                            onChange={() => handleTogglePermission(user.id, user.permission?.editScores || false)}
                                            disabled={processingUsers.has(user.id) || (user.id === session?.user?.id && user.permission?.editScores === true)}
                                            className={`cursor-pointer ${user.id === session?.user?.id && user.permission?.editScores ? "opacity-60" : ""}`}
                                        />
                                    </div>
                                    {processingUsers.has(user.id) && (
                                        <div className="mt-1 flex justify-center">
                                            <Spinner size="xs" />
                                        </div>
                                    )}
                                    {user.id === session?.user?.id && user.permission?.editScores && (
                                        <div className="mt-1 text-xs text-gray-500">
                                            (your account)
                                        </div>
                                    )}
                                </Table.Cell>
                                {/* Add more permission columns here as needed */}
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </Card>

            <div className="mt-6 flex">
                <Button as={Link} href="/" color="light">
                    Return Home
                </Button>
            </div>
        </div>
    );
}