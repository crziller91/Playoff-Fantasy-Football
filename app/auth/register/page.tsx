"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Label, TextInput, Alert } from "flowbite-react";
import { HiInformationCircle, HiHome } from "react-icons/hi";
import Link from "next/link";

export default function Register() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({
        name: false,
        email: false,
        emailFormat: false,
        password: false,
        confirmPassword: false,
        passwordMatch: false
    });

    // Email validation function
    const isValidEmail = (email: string): boolean => {
        return email.includes('@') && email.includes('.');
    };

    const validateForm = () => {
        const emailEmpty = !email.trim();
        const emailInvalid = !emailEmpty && !isValidEmail(email);

        const errors = {
            name: !name.trim(),
            email: emailEmpty,
            emailFormat: emailInvalid,
            password: !password.trim(),
            confirmPassword: !confirmPassword.trim(),
            passwordMatch: password !== confirmPassword && confirmPassword.trim() !== ""
        };

        setValidationErrors(errors);

        // Form is valid if no errors exist
        return !Object.values(errors).some(error => error);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset error state
        setError("");

        // Validate the form
        if (!validateForm()) {
            return;
        }

        // Check password match separately to avoid validation confusion
        if (password !== confirmPassword) {
            setValidationErrors({ ...validationErrors, passwordMatch: true });
            return;
        }

        try {
            setIsLoading(true);

            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Failed to register");
            }

            // Redirect to sign-in page after successful registration
            router.push("/auth/signin?registered=true");
        } catch (error) {
            if (error instanceof Error) {
                setError(error.message);
            } else {
                setError("An unexpected error occurred");
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Handle input changes and clear alerts when user types
    const handleInputChange = (value: string, field: 'name' | 'email' | 'password' | 'confirmPassword') => {
        // Clear any displayed error when user starts typing
        if (error) {
            setError("");
        }

        // Update the appropriate field
        switch (field) {
            case 'name':
                setName(value);
                if (validationErrors.name) {
                    setValidationErrors({ ...validationErrors, name: false });
                }
                break;
            case 'email':
                setEmail(value);
                // Clear both email-related validation errors
                if (validationErrors.email || validationErrors.emailFormat) {
                    setValidationErrors({
                        ...validationErrors,
                        email: false,
                        emailFormat: false
                    });
                }
                break;
            case 'password':
                setPassword(value);
                if (validationErrors.password) {
                    setValidationErrors({ ...validationErrors, password: false });
                }
                // Clear password match error if passwords now match
                if (validationErrors.passwordMatch && value === confirmPassword) {
                    setValidationErrors({ ...validationErrors, passwordMatch: false });
                }
                break;
            case 'confirmPassword':
                setConfirmPassword(value);
                if (validationErrors.confirmPassword) {
                    setValidationErrors({ ...validationErrors, confirmPassword: false });
                }
                // Clear password match error if passwords now match
                if (validationErrors.passwordMatch && password === value) {
                    setValidationErrors({ ...validationErrors, passwordMatch: false });
                }
                break;
        }
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
                <div className="relative">
                    <Button
                        color="light"
                        size="sm"
                        className="absolute left-0 top-0"
                        as={Link}
                        href="/"
                    >
                        <HiHome />
                    </Button>
                    <h2 className="mb-4 text-center text-2xl font-bold">Create an account</h2>
                </div>

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

                <form className="space-y-4" onSubmit={handleSubmit}>
                    <div>
                        <div className="mb-2 block">
                            <Label
                                htmlFor="name"
                                value="Full Name"
                                color={validationErrors.name ? "failure" : undefined}
                            />
                        </div>
                        <TextInput
                            id="name"
                            value={name}
                            onChange={(e) => handleInputChange(e.target.value, 'name')}
                            placeholder="John Doe"
                            color={validationErrors.name ? "failure" : undefined}
                            helperText={validationErrors.name ? "Name is required" : undefined}
                        />
                    </div>
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
                            placeholder="name@example.com"
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
                            color={validationErrors.password ? "failure" : undefined}
                            helperText={validationErrors.password ? "Password is required" : undefined}
                        />
                    </div>
                    <div>
                        <div className="mb-2 block">
                            <Label
                                htmlFor="confirmPassword"
                                value="Confirm Password"
                                color={(validationErrors.confirmPassword || validationErrors.passwordMatch) ? "failure" : undefined}
                            />
                        </div>
                        <TextInput
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => handleInputChange(e.target.value, 'confirmPassword')}
                            color={(validationErrors.confirmPassword || validationErrors.passwordMatch) ? "failure" : undefined}
                            helperText={
                                validationErrors.confirmPassword
                                    ? "Please confirm your password"
                                    : validationErrors.passwordMatch
                                        ? "Passwords do not match"
                                        : undefined
                            }
                        />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                        {isLoading ? "Registering..." : "Register"}
                    </Button>
                </form>
                <div className="mt-4">
                    <p className="text-center text-sm text-gray-600">
                        Already have an account?{" "}
                        <Link href="/auth/signin" className="text-blue-600 hover:underline">
                            Sign in
                        </Link>
                    </p>
                </div>
            </Card>
        </div>
    );
}