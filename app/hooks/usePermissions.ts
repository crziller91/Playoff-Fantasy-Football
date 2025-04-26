import { useSession } from "next-auth/react";

export function usePermissions() {
    const { data: session, status } = useSession();

    // Check if user is Christian Ziller
    const canEditScores = session?.user?.name === "Christian Ziller";

    return {
        canEditScores,
        isAuthenticated: status === "authenticated",
        isLoading: status === "loading"
    };
}