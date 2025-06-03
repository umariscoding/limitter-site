"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/AuthContext";

export default function Pricing() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Handle plan selection similar to homepage
  const handlePlanSelection = (plan) => {
    if (user) {
      // If user is logged in
      if (plan === 'free') {
        // Free plan - go to dashboard
        router.push('/dashboard');
      } else if (plan === 'pro' || plan === 'elite') {
        // Premium plan - go to checkout
        router.push(`/checkout?plan=${plan}`);
      }
    } else {
      // If not logged in, go to signup
      router.push(`/signup?plan=${plan}`);
    }
  };
  
  const plans = [
    {
      name: "Free",
      price: 0,
      description: "Basic features for casual users",
      features: [
        { name: "1 device", included: true },
        { name: "Track 3 websites/apps", included: true },
        { name: "1-hour fixed lockout", included: true },
        { name: "$1.99 per override", included: true },
        { name: "AI features", included: false },
        { name: "Custom lockout durations", included: false },
        { name: "Sync & reports", included: false },
        { name: "Usage insights", included: false },
      ],
      ctaText: user ? (user.plan === 'free' ? "Current Plan" : "Go to Dashboard") : "Sign Up Free",
      ctaAction: () => handlePlanSelection('free'),
      popular: false,
    },
    {
      name: "Pro",
      price: 4.99,
      description: "Advanced features for focused individuals",
      features: [
        { name: "Up to 3 devices", included: true },
        { name: "Unlimited time tracking", included: true },
        { name: "Custom lockout durations", included: true },
        { name: "15 free overrides/month", included: true },
        { name: "AI nudges", included: true },
        { name: "Sync + basic reports", included: true },
        { name: "AI usage insights", included: false },
        { name: "Journaling features", included: false },
      ],
      ctaText: user ? "Upgrade to Pro" : "Get Pro",
      ctaAction: () => handlePlanSelection('pro'),
      popular: true,
    },
    {
      name: "Elite",
      price: 11.99,
      description: "Ultimate features for power users",
      features: [
        { name: "Up to 10 devices", included: true },
        { name: "Unlimited overrides", included: true },
        { name: "AI usage insights", included: true },
        { name: "Journaling + override justification", included: true },
        { name: "90-day encrypted usage history", included: true },
        { name: "Smart AI recommendations", included: true },
        { name: "All Pro features included", included: true },
        { name: "Add-on pricing for more devices", included: true },
      ],
      ctaText: user ? "Upgrade to Elite" : "Get Elite",
      ctaAction: () => handlePlanSelection('elite'),
      popular: false,
    },
  ];

  return (
    <>
      <Navbar />
      
      <div className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
            <p className="text-xl text-gray-dark dark:text-gray max-w-2xl mx-auto">
              Choose the plan that fits your needs. All plans include core features to help you stay focused.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`border rounded-xl p-6 relative ${
                  plan.popular
                    ? "border-2 border-primary shadow-lg"
                    : "border-gray-light dark:border-gray-dark/30"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                    POPULAR
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <p className="text-gray-dark dark:text-gray mb-4">{plan.description}</p>
                <div className="text-3xl font-bold mb-6">
                  ${plan.price.toFixed(2)}
                  <span className="text-sm font-normal text-gray-dark dark:text-gray">/month</span>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-start gap-2">
                      {feature.included ? (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      ) : (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 text-gray flex-shrink-0 mt-0.5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                      <span className={!feature.included ? "text-gray" : ""}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={plan.ctaAction}
                  className={`block w-full py-2 px-4 text-center rounded-md transition-colors ${
                    plan.name === "Free"
                      ? "bg-gray-light dark:bg-gray-dark/30 text-foreground hover:bg-gray"
                      : plan.name === "Pro"
                      ? "bg-primary text-white hover:bg-primary-light"
                      : "bg-accent text-white hover:bg-accent/90"
                  }`}
                >
                  {plan.ctaText}
                </button>
              </div>
            ))}
          </div>
          
          {/* Feature comparison table */}
          <div className="mt-24">
            <h2 className="text-2xl font-bold mb-8 text-center">Compare all features</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-gray-light dark:border-gray-dark">
                    <th className="py-4 px-6 text-left">Feature</th>
                    <th className="py-4 px-6 text-center">Free</th>
                    <th className="py-4 px-6 text-center">Pro</th>
                    <th className="py-4 px-6 text-center">Elite</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-light dark:border-gray-dark">
                    <td className="py-4 px-6 font-medium">Devices</td>
                    <td className="py-4 px-6 text-center">1</td>
                    <td className="py-4 px-6 text-center">Up to 3</td>
                    <td className="py-4 px-6 text-center">Up to 10</td>
                  </tr>
                  <tr className="border-b border-gray-light dark:border-gray-dark">
                    <td className="py-4 px-6 font-medium">Time tracking</td>
                    <td className="py-4 px-6 text-center">1 hour</td>
                    <td className="py-4 px-6 text-center">Unlimited</td>
                    <td className="py-4 px-6 text-center">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-light dark:border-gray-dark">
                    <td className="py-4 px-6 font-medium">Custom lockout durations</td>
                    <td className="py-4 px-6 text-center">1-hour</td>
                    <td className="py-4 px-6 text-center">Custom</td>
                    <td className="py-4 px-6 text-center">Custom</td>
                  </tr>
                  <tr className="border-b border-gray-light dark:border-gray-dark">
                    <td className="py-4 px-6 font-medium">Overrides</td>
                    <td className="py-4 px-6 text-center">3</td>
                    <td className="py-4 px-6 text-center">15 free/month</td>
                    <td className="py-4 px-6 text-center">Unlimited</td>
                  </tr>
                  <tr className="border-b border-gray-light dark:border-gray-dark">
                    <td className="py-4 px-6 font-medium">AI features</td>
                    <td className="py-4 px-6 text-center">No</td>
                    <td className="py-4 px-6 text-center">Yes</td>
                    <td className="py-4 px-6 text-center">Yes</td>
                  </tr>
                  <tr className="border-b border-gray-light dark:border-gray-dark">
                    <td className="py-4 px-6 font-medium">AI nudges</td>
                    <td className="py-4 px-6 text-center">No</td>
                    <td className="py-4 px-6 text-center">Yes</td>
                    <td className="py-4 px-6 text-center">Yes</td>
                  </tr>
                  <tr className="border-b border-gray-light dark:border-gray-dark">
                    <td className="py-4 px-6 font-medium">AI usage insights</td>
                    <td className="py-4 px-6 text-center">No</td>
                    <td className="py-4 px-6 text-center">Yes</td>
                    <td className="py-4 px-6 text-center">Yes</td>
                  </tr>
                  <tr className="border-b border-gray-light dark:border-gray-dark">
                    <td className="py-4 px-6 font-medium">Journaling features</td>
                    <td className="py-4 px-6 text-center">No</td>
                    <td className="py-4 px-6 text-center">No</td>
                    <td className="py-4 px-6 text-center">Yes</td>
                  </tr>
                  <tr className="border-b border-gray-light dark:border-gray-dark">
                    <td className="py-4 px-6 font-medium">Sync & reports</td>
                    <td className="py-4 px-6 text-center">No</td>
                    <td className="py-4 px-6 text-center">Yes</td>
                    <td className="py-4 px-6 text-center">Yes</td>
                  </tr>
                  <tr className="border-b border-gray-light dark:border-gray-dark">
                    <td className="py-4 px-6 font-medium">Usage insights</td>
                    <td className="py-4 px-6 text-center">No</td>
                    <td className="py-4 px-6 text-center">Yes</td>
                    <td className="py-4 px-6 text-center">Yes</td>
                  </tr>
                  <tr className="border-b border-gray-light dark:border-gray-dark">
                    <td className="py-4 px-6 font-medium">Encrypted usage history</td>
                    <td className="py-4 px-6 text-center">No</td>
                    <td className="py-4 px-6 text-center">No</td>
                    <td className="py-4 px-6 text-center">90 days</td>
                  </tr>
                  <tr className="border-b border-gray-light dark:border-gray-dark">
                    <td className="py-4 px-6 font-medium">Smart AI recommendations</td>
                    <td className="py-4 px-6 text-center">No</td>
                    <td className="py-4 px-6 text-center">No</td>
                    <td className="py-4 px-6 text-center">Yes</td>
                  </tr>
                  <tr className="border-b border-gray-light dark:border-gray-dark">
                    <td className="py-4 px-6 font-medium">Support</td>
                    <td className="py-4 px-6 text-center">Email</td>
                    <td className="py-4 px-6 text-center">Email</td>
                    <td className="py-4 px-6 text-center">Priority</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          {/* CTA Section */}
          <div className="mt-24">
            <div className="bg-background rounded-xl p-8 md:p-12 shadow-lg border border-gray-light dark:border-gray-dark/30 text-center">
              <h2 className="text-3xl font-bold mb-4">Still have questions?</h2>
              <p className="text-gray-dark dark:text-gray max-w-xl mx-auto mb-8">
                Our team is here to help! Contact us and we'll get back to you as soon as possible.
              </p>
              <Link
                href="/contact"
                className="inline-flex bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-md transition-colors font-medium"
              >
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </>
  );
} 