"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";
import { purchaseOverrides, updateUserSubscription } from "../../lib/firebase";

// Prevent static page generation
export const dynamic = 'force-dynamic';

export default function Checkout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [selectedPlan, setSelectedPlan] = useState("");
  const [purchaseType, setPurchaseType] = useState("plan"); // "plan" or "overrides"
  const [overrideQuantity, setOverrideQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Payment form states
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [email, setEmail] = useState("");
  const [billingAddress, setBillingAddress] = useState({
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US"
  });

  // Plan configuration
  const plans = {
    pro: {
      name: "Pro",
      price: 4.99,
      features: [
        "Up to 3 devices",
        "Unlimited time tracking", 
        "Custom lockout durations",
        "15 free overrides/month",
        "AI nudges",
        "Sync + basic reports"
      ]
    },
    elite: {
      name: "Elite", 
      price: 11.99,
      features: [
        "Up to 10 devices",
        "Unlimited overrides",
        "AI usage insights",
        "Journaling + override justification",
        "90-day encrypted usage history",
        "Smart AI recommendations"
      ]
    }
  };

  useEffect(() => {
    // Redirect if not logged in
    if (!loading && !user) {
      console.log("No user found, redirecting to signup");
      router.push("/signup");
      return;
    }

    // Get purchase type and details from URL
    const planFromUrl = searchParams.get("plan");
    const overridesFromUrl = searchParams.get("overrides");
    
    if (overridesFromUrl) {
      // Override purchase
      setPurchaseType("overrides");
      const quantity = parseInt(overridesFromUrl) || 1;
      setOverrideQuantity(quantity);
    } else if (planFromUrl && plans[planFromUrl]) {
      // Plan purchase
      setPurchaseType("plan");
      setSelectedPlan(planFromUrl);
    } else {
      // Redirect to pricing if no valid purchase type
      router.push("/dashboard");
    }

    // Set user email if available
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user, loading, router, searchParams]);

  const getCurrentPrice = () => {
    if (purchaseType === "overrides") {
      return overrideQuantity * 1.99;
    }
    if (!selectedPlan || !plans[selectedPlan]) return 0;
    return plans[selectedPlan].price;
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (purchaseType === "overrides") {
        console.log("🔄 Processing override purchase:", overrideQuantity);
        await purchaseOverrides(user.uid, overrideQuantity, {
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiryDate,
          cvv,
          nameOnCard,
          paymentMethod: 'card'
        });
        
        // Redirect to dashboard with success message
        router.push("/dashboard?purchase=overrides");
        
      } else {
        console.log("🔄 Processing subscription upgrade to:", selectedPlan);
        
        // Call our API to update the subscription
        console.log("🔄 Processing subscription upgrade to:", selectedPlan, user, cardNumber, expiryDate, cvv, nameOnCard);
        const response = await updateUserSubscription(user.uid, selectedPlan, {
          cardNumber: cardNumber.replace(/\s/g, ''),
          expiryDate,
          cvv,
          nameOnCard,
          paymentMethod: 'card'
        });
        
        // Redirect to dashboard with success message
        router.push("/dashboard?payment=success");
      }
      
    } catch (err) {
      console.error("❌ Purchase failed:", err);
      setError(err.message || "Failed to complete purchase. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
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

  // If no user or invalid purchase, show nothing (redirect will happen)
  if (!user || (purchaseType === "plan" && (!selectedPlan || !plans[selectedPlan]))) {
    return null;
  }

  const plan = purchaseType === "plan" ? plans[selectedPlan] : null;
  const currentPrice = getCurrentPrice();

  return (
    <>
      <Navbar />
      
      <div className="min-h-screen py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
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
            {/* Order Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
              
              {/* Purchase Details */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {purchaseType === "overrides" ? "Override Purchase" : `${plan.name} Plan`}
                    </h3>
                    {purchaseType === "overrides" && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {overrideQuantity} override{overrideQuantity > 1 ? 's' : ''} at $1.99 each
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
                
                {/* Features for Plans */}
                {purchaseType === "plan" && plan && (
                  <div>
                    <h4 className="font-medium mb-3">What&apos;s included:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm">
                          <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Override Details */}
                {purchaseType === "overrides" && (
                  <div>
                    <h4 className="font-medium mb-3">Override Details:</h4>
                    <ul className="space-y-2">
                      <li className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {overrideQuantity} override{overrideQuantity > 1 ? 's' : ''} added to your account
                      </li>
                      <li className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Use to bypass daily time limits
                      </li>
                      <li className="flex items-center text-sm">
                        <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Never expire - use when needed
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold">${currentPrice}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {purchaseType === "overrides" ? "One-time purchase" : "Charged monthly"}
                </p>
              </div>
            </div>

            {/* Payment Form */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Payment Information</h2>
              
              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Override Quantity Selector */}
                {purchaseType === "overrides" && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Number of Overrides</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={overrideQuantity}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '') {
                              setOverrideQuantity('');
                            } else {
                              const num = parseInt(value);
                              if (!isNaN(num)) {
                                setOverrideQuantity(Math.min(100, Math.max(1, num)));
                              }
                            }
                          }}
                          onBlur={() => {
                            if (overrideQuantity === '' || overrideQuantity < 1) {
                              setOverrideQuantity(1);
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                        />
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        $1.99 each = <span className="font-medium">${(overrideQuantity * 1.99).toFixed(2)} total</span>
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <span className="text-xs text-gray-600 dark:text-gray-400">Quick select:</span>
                      {[1, 5, 10, 20].map(qty => (
                        <button
                          key={qty}
                          type="button"
                          onClick={() => setOverrideQuantity(qty)}
                          className={`px-2 py-1 text-xs rounded ${
                            overrideQuantity === qty 
                              ? 'bg-primary text-white' 
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                          }`}
                        >
                          {qty}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Overrides never expire and can be used to bypass time limits when needed.
                    </p>
                  </div>
                )}

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                  />
                </div>

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

                {/* Billing Address */}
                <div className="space-y-4">
                  <h3 className="font-medium">Billing Address</h3>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Street Address</label>
                    <input
                      type="text"
                      value={billingAddress.street}
                      onChange={(e) => setBillingAddress(prev => ({ ...prev, street: e.target.value }))}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">City</label>
                      <input
                        type="text"
                        value={billingAddress.city}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State</label>
                      <input
                        type="text"
                        value={billingAddress.state}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, state: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">ZIP Code</label>
                      <input
                        type="text"
                        value={billingAddress.zipCode}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Country</label>
                      <select
                        value={billingAddress.country}
                        onChange={(e) => setBillingAddress(prev => ({ ...prev, country: e.target.value }))}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-white dark:bg-gray-700"
                      >
                        <option value="US">United States</option>
                        <option value="CA">Canada</option>
                        <option value="UK">United Kingdom</option>
                        <option value="AU">Australia</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
                >
                  {isLoading ? 
                    (purchaseType === "overrides" ? "Processing Purchase..." : "Upgrading Plan...") : 
                    (purchaseType === "overrides" ? 
                      `Purchase ${overrideQuantity} Override${overrideQuantity > 1 ? 's' : ''} - $${currentPrice}` : 
                      `Upgrade to ${plan.name} - $${currentPrice}/month`)
                  }
                </button>

                {/* Security Notice */}
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center justify-center mb-2">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    Secure SSL encrypted payment
                  </div>
                  <p>
                    By completing your purchase, you agree to our{" "}
                    <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* Back to Dashboard */}
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