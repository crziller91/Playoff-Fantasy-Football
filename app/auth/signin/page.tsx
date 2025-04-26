"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Card, Label, TextInput } from "flowbite-react";
import Link from "next/link";

export default function SignIn() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                setError(result.error);
            } else {
                router.push("/");
            }
        } catch (error) {
            setError("An unexpected error occurred");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <h2 className="mb-4 text-center text-2xl font-bold">Sign in to your account</h2>
                {error && (
                    <div className="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800">
                        {error}
                    </div>
                )}
                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="email" value="Email" />
                        </div>
                        <TextInput
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="email@example.com"
                            required
                        />
                    </div>
                    <div>
                        <div className="mb-2 block">
                            <Label htmlFor="password" value="Password" />
                        </div>
                        <TextInput
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    <Button type="submit" className="w-full">
                        Sign in
                    </Button>
                </form>
                <div className="mt-4">
                    <p className="text-center text-sm text-gray-600">
                        Dont have an account?{" "}
                        <Link href="/auth/register" className="text-blue-600 hover:underline">
                            Register here
                        </Link>
                    </p>
                </div>
                <div className="mt-4">
                    <Button
                        color="alternative"
                        className="w-full"
                        onClick={() => signIn("github", { callbackUrl: "/" })}
                    >
                        Sign in with GitHub
                    </Button>
                </div>
            </Card>
        </div>
    );
}