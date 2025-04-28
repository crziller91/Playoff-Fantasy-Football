import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";

interface Permission {
    id: number;
    userId: string;
    editScores: boolean;
    createdAt: string;
    updatedAt: string;
}

export function usePermissions() {
    const { data: session, status } = useSession();
    const [permissions, setPermissions] = useState<Permission | null>(null);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only fetch permissions if user is authenticated
        if (status === "authenticated" && session?.user?.id) {
            const fetchPermissions = async () => {
                try {
                    setIsLoadingPermissions(true);
                    setError(null);

                    const response = await fetch("/api/permissions");

                    if (!response.ok) {
                        // If 404, this means no permissions yet - that's OK
                        if (response.status === 404) {
                            setPermissions(null);
                            return;
                        }
                        throw new Error(`Failed to fetch permissions: ${response.status}`);
                    }

                    const data = await response.json();
                    setPermissions(data);
                } catch (err) {
                    console.error("Error fetching permissions:", err);
                    setError(err instanceof Error ? err.message : "Failed to fetch permissions");
                } finally {
                    setIsLoadingPermissions(false);
                }
            };

            fetchPermissions();
        }
    }, [session, status]);

    return {
        canEditScores: permissions?.editScores || false,
        isAuthenticated: status === "authenticated",
        isLoading: status === "loading" || isLoadingPermissions,
        error
    };
}