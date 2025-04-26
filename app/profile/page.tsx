"use client";

import { useSession } from "next-auth/react";
import { Card, Button, Spinner } from "flowbite-react";
import { redirect } from "next/navigation";

export default function Profile() {
    const { data: session, status } = useSession({
        required: true,
        onUnauthenticated() {
            redirect("/auth/signin?callbackUrl=/profile");
        },
    });

    if (status === "loading") {
        return (
            <div className="flex h-screen items-center justify-center">
                <Spinner size="xl" />
            </div>
        );
    }

    return (
        <div className="container mx-auto my-8 px-4">
            <h1 className="mb-6 text-2xl font-bold">My Profile</h1>
            <Card className="max-w-md">
                <div className="flex flex-col items-center">
                    {session.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={session.user.image}
                            alt="Profile"
                            className="mb-4 size-32 rounded-full"
                        />
                    ) : (
                        <div className="mb-4 flex size-32 items-center justify-center rounded-full bg-blue-500 text-4xl font-bold text-white">
                            {session.user?.name?.charAt(0) || "U"}
                        </div>
                    )}
                    <h2 className="text-xl font-semibold">{session.user?.name}</h2>
                    <p className="text-gray-600">{session.user?.email}</p>
                </div>
                <div className="mt-4">
                    <h3 className="mb-2 text-lg font-medium">Account Information</h3>
                    <div className="space-y-2">
                        <div>
                            <span className="font-medium">User ID:</span> {session.user?.id}
                        </div>
                        <div>
                            <span className="font-medium">Account type:</span> {session.user?.image ? "OAuth" : "Email & Password"}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}