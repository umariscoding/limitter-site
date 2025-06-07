"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";

export default function Override() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [eligibility, setEligibility] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEligibility, setIsCheckingEligibility] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Payment form states
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  
  // URL parameters
  const siteUrl = searchParams.get("site");
  const returnUrl = searchParams.get("return");

  useEffect(() => {
    // Redirect if not logged in
    if (!loading && !user) {
      console.log("No user found, redirecting to login");
      router.push("/login");
      return;
    }

    // Check override eligibility
    if (user?.uid) {
      checkEligibility();
    }
  }, [user, loading, router]);

  const checkEligibility = async () => {
    try {
      setIsCheckingEligibility(true);
      
      if (!siteUrl) {
        setError("No site specified for override. Please access this page from a blocked site.");
        setIsCheckingEligibility(false);
        return;
      }

      const response = await fetch(`/api/override-eligibility?userId=${user.uid}&siteUrl=${encodeURIComponent(siteUrl)}`);
      const data = await response.json();

      if (response.ok) {
        setEligibility(data.eligibility);
      } else {
        setError(data.error || "Failed to check override eligibility");
      }
    } catch (err) {
      setError("Failed to check override eligibility");
    } finally {
      setIsCheckingEligibility(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return v;
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.length <= 19) {
      setCardNumber(formatted);
    }
  };

  const handleExpiryChange = (e) => {
    const formatted = formatExpiryDate(e.target.value);
    if (formatted.length <= 5) {
      setExpiryDate(formatted);
    }
  };

  const handleOverrideRequest = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("🔄 Requesting override for site:", siteUrl);

      let paymentData = null;
      
      // If payment is required, validate and prepare payment data
      if (eligibility.requiresPayment) {
        if (!cardNumber || !expiryDate || !cvv || !nameOnCard) {
          throw new Error("Please fill in all payment fields");
        }
        
        paymentData = {
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiryDate,
          cvv,
          nameOnCard,
          paymentMethod: 'card'
        };
      }

      const response = await fetch('/api/process-override', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.uid,
          siteUrl,
          paymentData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process override');
      }

      console.log("✅ Override processed successfully:", data);
      
      setSuccess(data.override.message);
      
      // Redirect after 3 seconds or immediately if return URL is provided
      setTimeout(() => {
        if (returnUrl) {
          window.location.href = returnUrl;
        } else {
          router.push("/dashboard");
        }
      }, 3000);
      
    } catch (err) {
      console.error("❌ Override request failed:", err);
      setError(err.message || "Failed to process override. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (loading || isCheckingEligibility) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Checking override eligibility...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  // If no user, show nothing (redirect will happen)
  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Site Override Request</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {siteUrl ? `Request access to ${siteUrl}` : 'Request site access override'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-red-600 dark:text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">Error</h3>
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
              <div className="flex items-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Override Granted! 🎉</h3>
                  <p className="text-green-700 dark:text-green-300">{success}</p>
                  <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Redirecting you back...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Override Information */}
          {eligibility && !success && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Override Details</h2>
              
              {/* Site Information */}
              {eligibility.siteInfo && (
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h3 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Site Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Site:</span>
                      <span className="font-medium">{eligibility.siteInfo.name || siteUrl}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Daily Time Limit:</span>
                      <span className="font-medium">{Math.floor(eligibility.siteInfo.timeLimit / 60)} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Time Used Today:</span>
                      <span className="font-medium">{Math.floor(eligibility.siteInfo.timeSpentToday / 60)} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 dark:text-blue-300">Status:</span>
                      <span className="font-medium text-red-600">Time Limit Exceeded</span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Plan Info */}
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">Your Plan:</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    eligibility.userPlan === 'free' ? 'bg-gray-100 text-gray-800' :
                    eligibility.userPlan === 'pro' ? 'bg-blue-100 text-blue-800' :
                    'bg-purple-100 text-purple-800'
                  }`}>
                    {eligibility.userPlan.charAt(0).toUpperCase() + eligibility.userPlan.slice(1)}
                  </span>
                </div>
                
                {eligibility.userPlan === 'pro' && (
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Free overrides remaining this month: <span className="font-medium">{eligibility.freeOverridesRemaining}</span>
                  </div>
                )}
              </div>

              {/* Override Cost */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold">Override Cost</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{eligibility.reason}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {eligibility.requiresPayment ? `$${eligibility.price}` : 
                       eligibility.usePurchased ? '1 OVERRIDE' : 'FREE'}
                    </div>
                    {eligibility.usePurchased && (
                      <div className="text-sm text-gray-500">
                        {eligibility.availableOverrides} purchased overrides available
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Override purchase suggestion */}
                {eligibility.requiresPayment && eligibility.availableOverrides === 0 && (
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💡 <span className="font-medium">Tip:</span> <Link href="/checkout?overrides=1" className="text-blue-600 hover:underline">Purchase overrides</Link> in advance to avoid future payments!
                    </p>
                  </div>
                )}
              </div>

              {/* Payment Form or Free Override Button */}
              <form onSubmit={handleOverrideRequest} className="space-y-4">
                {eligibility.requiresPayment && (
                  <>
                    <h3 className="font-medium mb-4">Payment Information</h3>
                    
                    {/* Card Information */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        placeholder="1234 5678 9012 3456"
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Expiry Date</label>
                        <input
                          type="text"
                          value={expiryDate}
                          onChange={handleExpiryChange}
                          placeholder="MM/YY"
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">CVV</label>
                        <input
                          type="text"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          placeholder="123"
                          required
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">Name on Card</label>
                      <input
                        type="text"
                        value={nameOnCard}
                        onChange={(e) => setNameOnCard(e.target.value)}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                      />
                    </div>
                  </>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
                >
                  {isLoading ? "Processing..." : 
                   eligibility.requiresPayment ? `Pay $${eligibility.price} & Override` :
                   eligibility.usePurchased ? 'Use 1 Override & Continue' :
                   'Use Free Override'}
                </button>

                {/* Security Notice */}
                {eligibility.requiresPayment && (
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center justify-center mb-2">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Secure SSL encrypted payment
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Back Links */}
          <div className="text-center">
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors mr-4"
            >
              ← Back to Dashboard
            </Link>
            <Link
              href="/pricing"
              className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
            >
              Upgrade Plan
            </Link>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
} 