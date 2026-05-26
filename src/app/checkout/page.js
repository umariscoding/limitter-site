"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { FaCheck, FaLock, FaSpinner } from "react-icons/fa";

import { PageLoader } from "../../components/common";
import { useAuth } from "../../context/AuthContext";
import { PLANS, OVERRIDE_PRICE, isValidPlan } from "../../lib/plans";
import { billingApi } from "../../lib/api";

function Card({ title, children }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-6">{title}</h2>
      {children}
    </div>
  );
}

function QuantitySelector({ value, onChange }) {
  const presets = [1, 5, 10, 20];

  const handleInputChange = (e) => {
    const nextValue = parseInt(e.target.value, 10);
    if (!isNaN(nextValue)) {
      onChange(Math.min(100, Math.max(1, nextValue)));
    }
  };

  return (
    <div className="mt-4">
      <label className="block text-sm font-medium mb-2">Adjust Quantity</label>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="number"
            min="1"
            max="100"
            value={value}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
          />
        </div>

        <div className="flex gap-2">
          {presets.map((qty) => (
            <button
              key={qty}
              type="button"
              onClick={() => onChange(qty)}
              className={`px-3 py-1 text-sm rounded-md ${
                value === qty
                  ? "bg-primary text-white"
                  : "bg-gray-100 dark:bg-gray-700 hover:bg-gray-200"
              }`}
            >
              {qty}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function IncludedFeatures({ features }) {
  return (
    <div>
      <h3 className="font-medium mb-4">What&apos;s included:</h3>
      <ul className="space-y-3">
        {features.filter((f) => f.enabled).map((feature) => (
          <li key={feature.text} className="flex items-start">
            <FaCheck className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
            <span className="text-gray-700 dark:text-gray-300">{feature.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function OrderSummary({
  purchaseType,
  plan,
  billingCycle,
  overrideQuantity,
  currentPrice,
  onQuantityChange,
}) {
  return (
    <Card title="Order Summary">
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">
              {purchaseType === "overrides"
                ? "Override Purchase"
                : `${plan?.name} Plan`}
            </h3>

            {purchaseType === "overrides" && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {overrideQuantity} override{overrideQuantity > 1 ? "s" : ""} at
                ${OVERRIDE_PRICE} each
              </p>
            )}
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold">
              ${currentPrice}
              {purchaseType === "plan" && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {billingCycle === "yearly" ? "/year" : "/month"}
                </span>
              )}
            </div>
          </div>
        </div>

        {purchaseType === "overrides" && (
          <QuantitySelector
            value={overrideQuantity}
            onChange={onQuantityChange}
          />
        )}
      </div>

      {purchaseType === "plan" && plan && (
        <IncludedFeatures features={plan.features} />
      )}
    </Card>
  );
}

function ErrorMessage({ error }) {
  if (!error) return null;

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
      {error}
    </div>
  );
}

function PurchaseButton({
  isLoading,
  purchaseType,
  billingCycle,
  overrideQuantity,
  currentPrice,
  plan,
  onClick,
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="w-full py-4 px-6 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <span className="flex items-center justify-center">
          <FaSpinner className="animate-spin h-5 w-5 mr-3" />
          Preparing Checkout...
        </span>
      ) : purchaseType === "overrides" ? (
        `Purchase ${overrideQuantity} Override${
          overrideQuantity > 1 ? "s" : ""
        } - $${currentPrice}`
      ) : (
        `Subscribe to ${plan?.name} - $${currentPrice}/${billingCycle === "yearly" ? "year" : "month"}`
      )}
    </button>
  );
}

function SecurePaymentNote() {
  return (
    <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
      <div className="flex items-center justify-center mb-2">
        <FaLock className="w-4 h-4 mr-1" />
        Secure payment powered by Stripe
      </div>
    </div>
  );
}

function PurchasePanel({
  error,
  isLoading,
  purchaseType,
  billingCycle,
  overrideQuantity,
  currentPrice,
  plan,
  onCheckout,
}) {
  return (
    <Card title="Complete Purchase">
      <ErrorMessage error={error} />

      <PurchaseButton
        isLoading={isLoading}
        purchaseType={purchaseType}
        billingCycle={billingCycle}
        overrideQuantity={overrideQuantity}
        currentPrice={currentPrice}
        plan={plan}
        onClick={onCheckout}
      />

      <SecurePaymentNote />
    </Card>
  );
}

function CheckoutContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [selectedPlan, setSelectedPlan] = useState("");
  const [purchaseType, setPurchaseType] = useState("plan");
  const [billingCycle, setBillingCycle] = useState("monthly");
  const [overrideQuantity, setOverrideQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      router.push("/signup");
      return;
    }

    const planFromUrl = searchParams.get("plan");
    const cycleFromUrl = searchParams.get("cycle");
    const overridesFromUrl = searchParams.get("overrides");

    if (overridesFromUrl) {
      setPurchaseType("overrides");
      setOverrideQuantity(parseInt(overridesFromUrl, 10) || 1);
      return;
    }

    if (planFromUrl && isValidPlan(planFromUrl)) {
      setPurchaseType("plan");
      setSelectedPlan(planFromUrl);
      if (cycleFromUrl === "yearly") setBillingCycle("yearly");
      return;
    }

    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router, searchParams]);

  const plan = purchaseType === "plan" ? PLANS[selectedPlan] : null;

  const currentPrice = useMemo(() => {
    if (purchaseType === "overrides") {
      return (overrideQuantity * OVERRIDE_PRICE).toFixed(2);
    }

    if (!selectedPlan || !PLANS[selectedPlan]) {
      return "0.00";
    }

    const p = PLANS[selectedPlan];
    return billingCycle === "yearly"
      ? p.yearlyPrice.toFixed(2)
      : p.monthlyPrice.toFixed(2);
  }, [purchaseType, overrideQuantity, selectedPlan, billingCycle]);

  const handleCheckout = async () => {
    if (!user) return;

    setIsLoading(true);
    setError("");

    try {
      const baseUrl = window.location.origin;
      const data = await billingApi.stripeCreateCheckout({
        paymentType: purchaseType,
        plan: purchaseType === "plan" ? selectedPlan : undefined,
        cycle: purchaseType === "plan" ? billingCycle : undefined,
        quantity: purchaseType === "overrides" ? overrideQuantity : undefined,
        successUrl: `${baseUrl}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${baseUrl}/dashboard?payment=cancelled`,
      });

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      if (data.sessionId) {
        const stripe = await loadStripe(
          process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        );
        if (!stripe) throw new Error("Failed to load Stripe");
        await stripe.redirectToCheckout({ sessionId: data.sessionId });
        return;
      }

      throw new Error("No checkout URL returned from server");
    } catch (err) {
      setError(
        err.message || "Failed to start checkout process. Please try again.",
      );
      setIsLoading(false);
    }
  };

  if (loading) {
    return <PageLoader message="Loading checkout..." />;
  }

  if (
    !user ||
    (purchaseType === "plan" && (!selectedPlan || !PLANS[selectedPlan]))
  ) {
    return null;
  }

  return (
    <div className="min-h-screen py-16 px-4 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Complete Your Purchase</h1>
            <p className="text-gray-600 dark:text-gray-400">
              {purchaseType === "overrides" ? (
                <>
                  You&apos;re purchasing{" "}
                  <span className="font-semibold text-primary">
                    {overrideQuantity} override{overrideQuantity > 1 ? "s" : ""}
                  </span>
                </>
              ) : (
                <>
                  You&apos;re upgrading to{" "}
                  <span className="font-semibold text-primary">{plan?.name}</span>
                </>
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <OrderSummary
              purchaseType={purchaseType}
              plan={plan}
              billingCycle={billingCycle}
              overrideQuantity={overrideQuantity}
              currentPrice={currentPrice}
              onQuantityChange={setOverrideQuantity}
            />

            <PurchasePanel
              error={error}
              isLoading={isLoading}
              purchaseType={purchaseType}
              billingCycle={billingCycle}
              overrideQuantity={overrideQuantity}
              currentPrice={currentPrice}
              plan={plan}
              onCheckout={handleCheckout}
            />
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
  );
}

export default function Checkout() {
  return (
    <Suspense fallback={<PageLoader message="Loading checkout..." />}>
      <CheckoutContent />
    </Suspense>
  );
}
