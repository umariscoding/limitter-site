"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../lib/firebase";
import { toast } from "react-hot-toast";

export const dynamic = 'force-dynamic';
export default function SignupForm({ onSuccess, onLoginClick }) {
  const { register } = useAuth();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("free");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Get plan from URL if available
    const planFromUrl = searchParams.get("plan");
    if (planFromUrl && ["free", "pro", "premium"].includes(planFromUrl)) {
      setSelectedPlan(planFromUrl);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Send verification email
      await sendEmailVerification(userCredential.user);
      
      toast.success("Account created! Please check your email for verification link.");
      if (onSuccess) onSuccess(userCredential.user);
    } catch (error) {
      console.error("Error in signup:", error);
      toast.error(error.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-background rounded-xl shadow-md overflow-hidden">
      <div className="p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Create your account</h1>
          <p className="text-gray-dark dark:text-gray">Get started with Limitter today</p>
        </div>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md mb-4 text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-light dark:border-gray-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="John Doe"
            />
          </div>
          
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
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
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
          
          <div className="mb-6">
            <label htmlFor="confirm-password" className="block text-sm font-medium mb-1">
              Confirm password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-light dark:border-gray-dark rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Select your plan
            </label>
            <div className="grid grid-cols-3 gap-3">
              <div
                className={`border rounded-md p-3 cursor-pointer text-center ${
                  selectedPlan === "free"
                    ? "border-primary bg-primary/5"
                    : "border-gray-light dark:border-gray-dark"
                }`}
                onClick={() => setSelectedPlan("free")}
              >
                <div className="font-medium">Free</div>
                <div className="text-xs text-gray-dark dark:text-gray">$0/mo</div>
              </div>
              <div
                className={`border rounded-md p-3 cursor-pointer text-center ${
                  selectedPlan === "pro"
                    ? "border-primary bg-primary/5"
                    : "border-gray-light dark:border-gray-dark"
                }`}
                onClick={() => setSelectedPlan("pro")}
              >
                <div className="font-medium">Pro</div>
                <div className="text-xs text-gray-dark dark:text-gray">$4.99/mo</div>
              </div>
              <div
                className={`border rounded-md p-3 cursor-pointer text-center ${
                  selectedPlan === "premium"
                    ? "border-primary bg-primary/5"
                    : "border-gray-light dark:border-gray-dark"
                }`}
                onClick={() => setSelectedPlan("premium")}
              >
                <div className="font-medium">Premium</div>
                <div className="text-xs text-gray-dark dark:text-gray">$9.99/mo</div>
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 px-4 bg-primary text-white rounded-md hover:bg-primary-light transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
          >
            {isLoading ? "Creating account..." : "Create account"}
          </button>
        </form>
        
        <p className="text-center mt-8 text-sm text-gray-dark dark:text-gray">
          Already have an account?{" "}
          <button onClick={onLoginClick} className="text-primary hover:underline">
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
} 