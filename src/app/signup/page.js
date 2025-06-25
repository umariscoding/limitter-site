"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
export const dynamic = 'force-dynamic';
export default function Signup() {
  const router = useRouter();
  const { user, register, loading } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      console.log("User already logged in, redirecting to dashboard");
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    setIsLoading(true);
    setError("");

    try {
      console.log("📝 Signup page: Starting registration...");
      // Use AuthContext register function - always use free plan
      const result = await register(name, email, password, "free");
      
      if (result.success) {
        console.log("✅ Signup page: Registration successful");
        // Reset form
        setName("");
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        
        console.log("📊 Signup page: Free account created, going to dashboard");
        router.push("/dashboard");
      } else {
        console.error("❌ Signup page: Registration failed:", result.error);
        setError(result.error || "Failed to create account. Please try again.");
      }
    } catch (err) {
      console.error("❌ Signup page: Registration error:", err);
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // Don't render if user is logged in (will redirect)
  if (user) {
    return null;
  }

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen py-16 px-4">
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
              
              <div>
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
              <Link href="/login" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
} 