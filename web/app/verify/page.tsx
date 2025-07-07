"use client";

import { Button } from "@/components/ui/button";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { isAuthenticated } from "@/lib/utils";

export default function VerifyPage() {
    const router = useRouter();
    const [verificationCode, setVerificationCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [hasPhoneNumber, setHasPhoneNumber] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            if (isAuthenticated()) {
                // User is already authenticated, redirect to dashboard
                router.push('/dashboard');
            } else {
                // Check if phone number exists for resend functionality
                const phoneNumber = localStorage.getItem('phoneNumber');
                setHasPhoneNumber(!!phoneNumber);
                setIsCheckingAuth(false);
            }
        };

        checkAuth();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (verificationCode.length !== 6) {
            setError("Please enter the complete 6-digit code");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            // Get phone number from localStorage (saved during login)
            const phoneNumber = localStorage.getItem('phoneNumber');
            if (!phoneNumber) {
                setError("Phone number not found. Please go back and enter your phone number again.");
                return;
            }

            // Call the mock auth verify endpoint
            const response = await fetch(`http://localhost:8000/mock-auth/verify?phoneNumber=${encodeURIComponent(phoneNumber)}&code=${encodeURIComponent(verificationCode)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const data = await response.json();
                
                // Save JWT token to localStorage
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    console.log('JWT token saved to localStorage');
                }
                
                // Clear the phone number from localStorage as it's no longer needed
                localStorage.removeItem('phoneNumber');
                
                // Redirect to dashboard or home after successful verification
                router.push('/dashboard');
            } else {
                const errorData = await response.json();
                setError(errorData.error || "Invalid verification code");
            }
        } catch (error) {
            console.error("Error verifying code:", error);
            setError("Failed to verify code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleResendCode = async () => {
        setIsLoading(true);
        setError("");

        try {
            // Get phone number from localStorage
            const phoneNumber = localStorage.getItem('phoneNumber');
            if (!phoneNumber) {
                setError("Phone number not found. Please go back and enter your phone number again.");
                return;
            }

            // Call the mock auth send endpoint to resend code
            const response = await fetch(`http://localhost:8000/mock-auth/send?phoneNumber=${encodeURIComponent(phoneNumber)}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                setError(""); // Clear any previous errors
                // You might want to show a success message here
                console.log("Verification code resent successfully");
            } else {
                setError("Failed to resend code. Please try again.");
            }
        } catch (error) {
            console.error("Error resending code:", error);
            setError("Failed to resend code. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isCheckingAuth) {
        return (
            <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
                <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                        <p className="mt-2 text-gray-600">Checking authentication...</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-2">Verify Your Phone</h1>
                    <p className="text-gray-600">
                        Enter the 6-digit code sent to your phone number
                    </p>
                </div>

                <form className="flex flex-col gap-4 w-full max-w-sm" onSubmit={handleSubmit}>
                    <div className="flex justify-center">
                        <InputOTP
                            maxLength={6}
                            value={verificationCode}
                            onChange={(value) => {
                                setVerificationCode(value);
                                setError(""); // Clear error when user starts typing
                            }}
                        >
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    {error && (
                        <p className="text-red-500 text-sm text-center">{error}</p>
                    )}

                    <Button type="submit" disabled={isLoading || verificationCode.length !== 6}>
                        {isLoading ? "Verifying..." : "Verify Code"}
                    </Button>

                    {hasPhoneNumber && (
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={handleResendCode}
                                disabled={isLoading}
                                className="text-sm text-gray-600 hover:text-gray-800 underline disabled:opacity-50"
                            >
                                Didn't receive the code? Resend
                            </button>
                        </div>
                    )}

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="text-sm text-gray-600 hover:text-gray-800 underline"
                        >
                            Back to phone number
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
} 