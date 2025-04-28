"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { Card, Table, Spinner, Button, Checkbox, Alert } from "flowbite-react";
import { usePermissions } from "@/app/hooks/usePermissions";
import { redirect } from "next/navigation";

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
        try {
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
                                ...user.permission!,
                                editScores: !currentValue,
                            },
                        };
                    }
                    return user;
                })
            );

            setSuccessMessage("Permission updated successfully");
        } catch (err) {
            console.error("Error updating permission:", err);
            setError(err instanceof Error ? err.message : "Failed to update permission");
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
                <Alert color="success" className="mb-4">
                    {successMessage}
                </Alert>
            )}

            <Card>
                <Table>
                    <Table.Head>
                        <Table.HeadCell>Name</Table.HeadCell>
                        <Table.HeadCell>Email</Table.HeadCell>
                        <Table.HeadCell>Can Edit Scores</Table.HeadCell>
                        <Table.HeadCell>Actions</Table.HeadCell>
                    </Table.Head>
                    <Table.Body>
                        {users.map((user) => (
                            <Table.Row key={user.id}>
                                <Table.Cell>{user.name || "N/A"}</Table.Cell>
                                <Table.Cell>{user.email || "N/A"}</Table.Cell>
                                <Table.Cell>
                                    <Checkbox
                                        checked={user.permission?.editScores || false}
                                        readOnly
                                    />
                                </Table.Cell>
                                <Table.Cell>
                                    <Button
                                        size="xs"
                                        color={user.permission?.editScores ? "failure" : "success"}
                                        onClick={() => handleTogglePermission(user.id, user.permission?.editScores || false)}
                                    >
                                        {user.permission?.editScores ? "Remove Permission" : "Grant Permission"}
                                    </Button>
                                </Table.Cell>
                            </Table.Row>
                        ))}
                    </Table.Body>
                </Table>
            </Card>
        </div>
    );
}