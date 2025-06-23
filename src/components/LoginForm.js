"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function LoginForm({ onSuccess, onSignupClick }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      console.log("📝 LoginForm: Starting login...");
      // Use AuthContext login function
      const result = await login(email, password);
      
      if (result.success) {
        console.log("✅ LoginForm: Login successful, auth state updated");
        // Reset form
        setEmail("");
        setPassword("");
        
        // Call success callback immediately since login already waited for auth state
        console.log("📝 LoginForm: Calling onSuccess callback");
        if (onSuccess) onSuccess();
      } else {
        console.error("❌ LoginForm: Login failed:", result.error);
        setError(result.error || "Failed to login. Please try again.");
      }
    } catch (err) {
      console.error("❌ LoginForm: Login error:", err);
      setError(err.message || "Failed to login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-background rounded-xl shadow-md overflow-hidden">
      <div className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-gray-dark dark:text-gray">Sign in to your Limiter account</p>
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
              <Link href="/forgot-password" className="text-xs text-primary hover:underline">
                Forgot password?
              </Link>
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
            {isLoading ? "Signing in..." : "Sign in"}
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