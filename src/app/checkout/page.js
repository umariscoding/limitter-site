"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { PLANS, OVERRIDE_PRICE, isValidPlan } from "../../lib/plans";
import { loadStripe } from "@stripe/stripe-js";

// Prevent static page generation
export const dynamic = 'force-dynamic';

function CheckoutContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedPlan, setSelectedPlan] = useState("");
  const [purchaseType, setPurchaseType] = useState("plan"); 
  const [overrideQuantity, setOverrideQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  useEffect(() => {
    if (!loading && !user) {
      console.log("No user found, redirecting to signup");
      router.push("/signup");
      return;
    }

    const planFromUrl = searchParams.get("plan");
    const overridesFromUrl = searchParams.get("overrides");
    
    if (overridesFromUrl) {
      setPurchaseType("overrides");
      const quantity = parseInt(overridesFromUrl) || 1;
      setOverrideQuantity(quantity);
    } else if (planFromUrl && isValidPlan(planFromUrl)) {
      setPurchaseType("plan");
      setSelectedPlan(planFromUrl);
    } else {
      router.push("/dashboard");
    }
  }, [user, loading, router, searchParams]);

  const getCurrentPrice = () => {
    if (purchaseType === "overrides") {
      return (overrideQuantity * OVERRIDE_PRICE).toFixed(2);
    }
    if (!selectedPlan || !PLANS[selectedPlan]) return "0.00";
    return PLANS[selectedPlan].price.toFixed(2);
  };

  const handleCheckout = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentType: purchaseType,
          quantity: purchaseType === "overrides" ? overrideQuantity : 1,
          plan: selectedPlan,
          userId: user.uid
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to create checkout session');
      }

      if (data.sessionId) {
        console.log('Redirecting to Stripe checkout...');
        const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
        if (!stripe) {
          throw new Error('Failed to load Stripe');
        }
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
      } else {
        throw new Error("No session ID returned from server");
      }
    } catch (err) {
      console.error("Failed to create checkout session:", err);
      setError(err.message || "Failed to start checkout process. Please try again.");
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!user || (purchaseType === "plan" && (!selectedPlan || !PLANS[selectedPlan]))) {
    return null;
  }

  const plan = purchaseType === "plan" ? PLANS[selectedPlan] : null;
  const currentPrice = getCurrentPrice();

  return (
    <>
      <Navbar />
      <div className="min-h-screen py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {purchaseType === "overrides" ? (
                <>You&apos;re purchasing <span className="font-semibold text-primary">{overrideQuantity} override{overrideQuantity > 1 ? 's' : ''}</span></>
              ) : (
                <>You&apos;re upgrading to <span className="font-semibold text-primary">{plan.name}</span></>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {purchaseType === "overrides" ? "Override Purchase" : `${plan.name} Plan`}
                    </h3>
                    {purchaseType === "overrides" && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {overrideQuantity} override{overrideQuantity > 1 ? 's' : ''} at ${OVERRIDE_PRICE} each
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      ${currentPrice}
                      {purchaseType === "plan" && (
                        <span className="text-sm text-gray-600 dark:text-gray-400">/month</span>
                      )}
                    </div>
                  </div>
                </div>
                {purchaseType === "overrides" && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Adjust Quantity</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={overrideQuantity}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value)) {
                              setOverrideQuantity(Math.min(100, Math.max(1, value)));
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
                        />
                      </div>
                      <div className="flex gap-2">
                        {[1, 5, 10, 20].map(qty => (
                          <button
                            key={qty}
                            type="button"
                            onClick={() => setOverrideQuantity(qty)}
                            className={`px-3 py-1 text-sm rounded-md ${
                              overrideQuantity === qty 
                                ? 'bg-primary text-white' 
                                : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {qty}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {purchaseType === "plan" && plan && (
                <div>
                  <h3 className="font-medium mb-4">What&apos;s included:</h3>
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Complete Purchase</h2>
              
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={isLoading}
                className="w-full py-4 px-6 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                    Preparing Checkout...
                  </span>
                ) : (
                  purchaseType === "overrides" 
                    ? `Purchase ${overrideQuantity} Override${overrideQuantity > 1 ? 's' : ''} - $${currentPrice}`
                    : `Subscribe to ${plan.name} - $${currentPrice}/month`
                )}
              </button>

              <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Secure payment powered by Stripe
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="/dashboard"
              className="text-gray-600 dark:text-gray-400 hover:text-primary transition-colors"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Loading checkout...</p>
          </div>
        </div>
        <Footer />
      </>
    }>
      <CheckoutContent />
    </Suspense>
  );
} 