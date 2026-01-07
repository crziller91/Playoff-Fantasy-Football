"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useSession } from "next-auth/react";

interface Permission {
    id: number;
    userId: string;
    editScores: boolean;
    isAdmin: boolean;
    createdAt: string;
    updatedAt: string;
}

interface PermissionsContextType {
    canEditScores: boolean;
    isAdmin: boolean;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [permissions, setPermissions] = useState<Permission | null>(null);
    const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasFetched, setHasFetched] = useState(false);

    useEffect(() => {
        // Only fetch permissions if user is authenticated AND we haven't fetched yet
        if (status === "authenticated" && session?.user?.id && !hasFetched) {
            const fetchPermissions = async () => {
                try {
                    setIsLoadingPermissions(true);
                    setError(null);

                    const response = await fetch("/api/permissions");

                    if (!response.ok) {
                        // If 404, this means no permissions yet - that's OK
                        if (response.status === 404) {
                            setPermissions(null);
                            setHasFetched(true);
                            return;
                        }
                        throw new Error(`Failed to fetch permissions: ${response.status}`);
                    }

                    const data = await response.json();
                    setPermissions(data);
                    setHasFetched(true);
                } catch (err) {
                    console.error("Error fetching permissions:", err);
                    setError(err instanceof Error ? err.message : "Failed to fetch permissions");
                } finally {
                    setIsLoadingPermissions(false);
                }
            };

            fetchPermissions();
        }
    }, [session, status, hasFetched]);

    const value: PermissionsContextType = {
        canEditScores: permissions?.editScores || permissions?.isAdmin || false,
        isAdmin: permissions?.isAdmin || false,
        isAuthenticated: status === "authenticated",
        isLoading: status === "loading" || isLoadingPermissions,
        error
    };

    return (
        <PermissionsContext.Provider value={value}>
            {children}
        </PermissionsContext.Provider>
    );
}

export function usePermissions() {
    const context = useContext(PermissionsContext);
    if (context === undefined) {
        throw new Error("usePermissions must be used within a PermissionsProvider");
    }
    return context;
}
