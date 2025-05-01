"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Button, Card, Label, TextInput, Alert } from "flowbite-react";
import { HiInformationCircle, HiHome } from "react-icons/hi";
import Link from "next/link";

export default function SignIn() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        email: false,
        emailFormat: false,
        password: false
    });

    // Check for error or success in URL params
    useEffect(() => {
        if (searchParams) {
            const errorType = searchParams.get("error");
            const registered = searchParams.get("registered");

            if (errorType === "CredentialsSignin") {
                setError("Invalid email or password. Please try again.");
            } else if (registered === "true") {
                // Show success message for newly registered users
                setSuccess("Registration successful! You can now sign in.");
            }
        }
    }, [searchParams]);

    // Email validation function
    const isValidEmail = (email: string): boolean => {
        return email.includes('@') && email.includes('.');
    };

    const validateForm = () => {
        const emailEmpty = !email.trim();
        const emailInvalid = !emailEmpty && !isValidEmail(email);

        const errors = {
            email: emailEmpty,
            emailFormat: emailInvalid,
            password: !password.trim()
        };

        setValidationErrors(errors);
        return !emailEmpty && !emailInvalid && !errors.password;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setError("");
        setSuccess("");

        try {
            const result = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (result?.error) {
                // Handle specific error messages
                if (result.error === "CredentialsSignin") {
                    setError("Invalid email or password. Please try again.");
                } else {
                    setError(result.error);
                }
            } else {
                router.push("/");
            }
        } catch (error) {
            setError("An unexpected error occurred");
        } finally {
            setIsLoading(false);
        }
    };

    // Clear alerts when any input changes
    const handleInputChange = (value: string, field: 'email' | 'password') => {
        if (field === 'email') {
            setEmail(value);
            // Clear both email-related validation errors
            if (validationErrors.email || validationErrors.emailFormat) {
                setValidationErrors({
                    ...validationErrors,
                    email: false,
                    emailFormat: false
                });
            }
        } else {
            setPassword(value);
            if (validationErrors.password) {
                setValidationErrors({ ...validationErrors, password: false });
            }
        }

        // Clear any alerts when user starts typing
        setError("");
        setSuccess("");
    };

    // Determine email input color and helper text
    const getEmailValidationProps = () => {
        if (validationErrors.email) {
            return {
                color: "failure" as const,
                helperText: "Email is required"
            };
        } else if (validationErrors.emailFormat) {
            return {
                color: "failure" as const,
                helperText: "Please enter a valid email address"
            };
        }
        return {
            color: undefined,
            helperText: undefined
        };
    };

    const emailValidation = getEmailValidationProps();

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
                <h2 className="mb-4 text-center text-2xl font-bold">Sign In</h2>

                {error && (
                    <div className="mb-4">
                        <Alert
                            color="failure"
                            icon={HiInformationCircle}
                            onDismiss={() => setError("")}
                        >
                            <span className="font-medium">Error!</span> {error}
                        </Alert>
                    </div>
                )}

                {success && (
                    <div className="mb-4">
                        <Alert
                            color="success"
                            icon={HiInformationCircle}
                            onDismiss={() => setSuccess("")}
                        >
                            <span className="font-medium">Success!</span> {success}
                        </Alert>
                    </div>
                )}

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <div className="mb-2 block">
                            <Label
                                htmlFor="email"
                                value="Email"
                                color={emailValidation.color}
                            />
                        </div>
                        <TextInput
                            id="email"
                            type="text"
                            value={email}
                            onChange={(e) => handleInputChange(e.target.value, 'email')}
                            placeholder="email@example.com"
                            color={emailValidation.color}
                            helperText={emailValidation.helperText}
                        />
                    </div>
                    <div>
                        <div className="mb-2 block">
                            <Label
                                htmlFor="password"
                                value="Password"
                                color={validationErrors.password ? "failure" : undefined}
                            />
                        </div>
                        <TextInput
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => handleInputChange(e.target.value, 'password')}
                            placeholder="Enter your password"
                            color={validationErrors.password ? "failure" : undefined}
                            helperText={validationErrors.password ? "Password is required" : undefined}
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                </form>
                <div className="mt-6 flex items-center justify-between">
                    <Button
                        color="light"
                        size="sm"
                        as={Link}
                        href="/"
                        className="flex items-center gap-1"
                    >
                        <HiHome className="mr-2 size-5" />
                        Return Home
                    </Button>

                    <p className="text-sm text-gray-600">
                        Don&apos;t have an account?{" "}
                        <Link href="/auth/register" className="text-blue-600 hover:underline">
                            Register here
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}