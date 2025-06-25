"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import { signInWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../lib/firebase";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function LoginForm({ onSuccess, onSignupClick }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const handleResendVerification = async () => {
    try {
      // We need to sign in first to get the user object
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCredential.user);
      toast.success("Verification email sent! Please check your inbox.");
    } catch (error) {
      console.error("Error resending verification:", error);
      toast.error("Failed to resend verification email");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setNeedsVerification(false);
    setError("");

    try {
      console.log("📝 LoginForm: Starting login...");
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      if (!userCredential.user.emailVerified) {
        setNeedsVerification(true);
        toast.error("Please verify your email before logging in");
        return;
      }

      toast.success("Successfully logged in!");
      router.push("/dashboard");
      if (onSuccess) onSuccess(userCredential.user);
    } catch (error) {
      console.error("Error in login:", error);
      toast.error(error.message || "Failed to log in");
      setError(error.message || "Failed to log in");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-background rounded-xl shadow-md overflow-hidden">
      <div className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-gray-dark dark:text-gray">Sign in to your Limitter account</p>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-light dark:border-gray-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@example.com"
            />
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-1">
              <label htmlFor="password" className="block text-sm font-medium">
                Password
              </label>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-light dark:border-gray-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
          
          {needsVerification && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm text-yellow-800">Please verify your email before logging in.</p>
              <button
                type="button"
                onClick={handleResendVerification}
                className="mt-2 text-sm text-yellow-800 underline hover:text-yellow-900"
              >
                Resend verification email
              </button>
            </div>
          )}
          
          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              className="h-4 w-4 text-primary border-gray-light rounded"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-dark dark:text-gray">
              Remember me
            </label>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-light transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isLoading ? "Logging in..." : "Log in"}
          </button>
        </form>
        
        <p className="text-center mt-8 text-sm text-gray-dark dark:text-gray">
          Don&apos;t have an account?{" "}
          <button onClick={onSignupClick} className="text-primary hover:underline">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
} 