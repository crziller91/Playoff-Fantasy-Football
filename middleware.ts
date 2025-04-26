import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// List of routes that require authentication
const protectedRoutes = ["/profile"];
// Routes that should be accessible only to non-authenticated users
const authRoutes = ["/auth/signin", "/auth/register"];

export async function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname;

    // Authentication check
    const session = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const isAuthenticated = !!session;

    // If the route is protected and the user is not authenticated, redirect to login
    if (protectedRoutes.some(route => path.startsWith(route)) && !isAuthenticated) {
        return NextResponse.redirect(
            new URL(`/auth/signin?callbackUrl=${encodeURIComponent(path)}`, request.url)
        );
    }

    // If user is authenticated and trying to access auth routes, redirect to home
    if (authRoutes.includes(path) && isAuthenticated) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

// Specify the paths this middleware should run on
export const config = {
    matcher: [
        // Apply to all protected routes
        ...protectedRoutes,
        // Apply to auth routes
        ...authRoutes,
    ],
};