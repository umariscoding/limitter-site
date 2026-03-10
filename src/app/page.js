"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  FaCheck,
  FaClock,
  FaClipboardList,
  FaStar,
  FaChartBar,
} from "react-icons/fa";

import { useAuth } from "../context/AuthContext";

const featureCards = [
  {
    title: "Smart Timers",
    description:
      "Set individual time limits for different websites. Timers pause when you switch tabs and resume when you return.",
    icon: FaClock,
  },
  {
    title: "Multi-Domain Support",
    description:
      "Block any distracting website with custom timer durations. Add unlimited domains with Premium.",
    icon: FaClipboardList,
  },
  {
    title: "Usage Analytics",
    description:
      "Track your browsing habits and see how much time you're saving. Set goals and improve over time.",
    icon: FaChartBar,
  },
];

const plans = [
  {
    name: "Free",
    price: "$0",
    description: "Basic features for casual users",
    action: "free",
    buttonClass:
      "bg-gray-light dark:bg-gray-dark/30 text-foreground hover:bg-gray",
    buttonLabelLoggedOut: "Sign Up Free",
    buttonLabelLoggedIn: "Go to Dashboard",
    featured: false,
    features: [
      { text: "1 device", included: true },
      { text: "Track 3 websites/apps", included: true },
      { text: "1-hour fixed lockout", included: true },
      { text: "$1.99 per override", included: true },
      { text: "No AI features", included: false },
    ],
  },
  {
    name: "Pro",
    price: "$4.99",
    description: "Advanced features for focused individuals",
    action: "pro",
    buttonClass: "bg-primary text-white hover:bg-primary-light",
    buttonLabelLoggedOut: "Get Pro",
    buttonLabelLoggedIn: "Upgrade to Pro",
    featured: true,
    badge: "POPULAR",
    features: [
      { text: "Up to 3 devices", included: true },
      { text: "Unlimited time tracking", included: true },
      { text: "Custom lockout durations", included: true },
      { text: "15 free overrides/month", included: true },
      { text: "AI nudges + sync + basic reports", included: true },
    ],
  },
  {
    name: "Elite",
    price: "$11.99",
    description: "Ultimate features for power users",
    action: "elite",
    buttonClass: "bg-accent text-white hover:bg-accent/90",
    buttonLabelLoggedOut: "Get Elite",
    buttonLabelLoggedIn: "Upgrade to Elite",
    featured: false,
    features: [
      { text: "Up to 10 devices", included: true },
      { text: "100 free overrides/month", included: true },
      { text: "AI usage insights + journaling", included: true },
      { text: "90-day encrypted usage history", included: true },
      { text: "Smart AI recommendations", included: true },
    ],
  },
];

const testimonials = [
  {
    name: "John Doe",
    role: "Software Developer",
    initials: "JD",
    avatarClass: "bg-primary-light",
    rating: 5,
    text: "Limitter has transformed how I work. I used to waste hours on social media, but now I'm able to stay focused and get more done.",
  },
  {
    name: "Jane Smith",
    role: "Marketing Specialist",
    initials: "JS",
    avatarClass: "bg-accent",
    rating: 5,
    text: "The Premium plan is worth every penny. I love being able to customize schedules for different types of work days. Game changer!",
  },
  {
    name: "Robert Johnson",
    role: "Student",
    initials: "RJ",
    avatarClass: "bg-secondary",
    rating: 4,
    text: "As a student, it's so easy to get distracted online. Limitter helps me stay on track with my studies and avoid procrastination.",
  },
];

function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
}

function SectionHeading({ title, description }) {
  return (
    <div className="text-center mb-16">
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <p className="text-gray-dark dark:text-gray max-w-2xl mx-auto">
        {description}
      </p>
    </div>
  );
}

function FeatureCard({ title, description, icon: Icon }) {
  return (
    <div className="bg-background rounded-xl p-6 shadow-sm">
      <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-white" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-dark dark:text-gray">{description}</p>
    </div>
  );
}

function PlanFeature({ text, included }) {
  return (
    <li
      className={`flex items-start gap-2 ${
        included ? "" : "text-gray"
      }`}
    >
      <span className="mt-0.5 flex-shrink-0">
        {included ? (
          <FaCheck className="h-5 w-5 text-secondary" />
        ) : (
          <span className="flex h-5 w-5 items-center justify-center text-gray">
            ✕
          </span>
        )}
      </span>
      <span>{text}</span>
    </li>
  );
}

function PlanCard({ plan, user, onSelect }) {
  return (
    <div
      className={`rounded-xl p-6 relative ${
        plan.featured
          ? "border-2 border-primary shadow-lg"
          : "border border-gray-light dark:border-gray-dark/30"
      }`}
    >
      {plan.badge && (
        <div className="absolute top-0 right-0 bg-primary text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
          {plan.badge}
        </div>
      )}

      <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
      <p className="text-gray-dark dark:text-gray mb-4">{plan.description}</p>

      <div className="text-3xl font-bold mb-6">
        {plan.price}{" "}
        <span className="text-sm font-normal text-gray-dark dark:text-gray">
          /month
        </span>
      </div>

      <ul className="space-y-3 mb-8">
        {plan.features.map((feature) => (
          <PlanFeature
            key={feature.text}
            text={feature.text}
            included={feature.included}
          />
        ))}
      </ul>

      <button
        onClick={() => onSelect(plan.action)}
        className={`block w-full py-2 px-4 text-center rounded-md transition-colors ${plan.buttonClass}`}
      >
        {user ? plan.buttonLabelLoggedIn : plan.buttonLabelLoggedOut}
      </button>
    </div>
  );
}

function StarRating({ rating }) {
  return (
    <div className="mt-4 flex gap-1">
      {[0, 1, 2, 3, 4].map((index) => (
        <FaStar
          key={index}
          className={`h-5 w-5 ${
            index < rating ? "text-yellow-400" : "text-gray"
          }`}
        />
      ))}
    </div>
  );
}

function TestimonialCard({ name, role, initials, avatarClass, rating, text }) {
  return (
    <div className="bg-background rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div
          className={`w-10 h-10 rounded-full ${avatarClass} text-white flex items-center justify-center font-bold`}
        >
          {initials}
        </div>
        <div>
          <h4 className="font-semibold">{name}</h4>
          <p className="text-xs text-gray-dark dark:text-gray">{role}</p>
        </div>
      </div>

      <p className="text-gray-dark dark:text-gray">{text}</p>
      <StarRating rating={rating} />
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  const handlePlanSelection = (plan) => {
    if (user) {
      if (plan === "free") {
        router.push("/dashboard");
        return;
      }

      router.push(`/checkout?plan=${plan}`);
      return;
    }

    router.push(`/signup?plan=${plan}`);
  };

  return (
    <>
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="gradient-text">Limit distractions,</span> boost
                productivity
              </h1>

              <p className="text-lg mb-8 text-gray-dark dark:text-gray">
                Limitter helps you stay focused by blocking distracting websites
                with smart timers that pause when you switch tabs and resume
                when you return.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() =>
                    user ? router.push("/dashboard") : router.push("/signup")
                  }
                  className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-md text-center transition-colors font-medium"
                >
                  {user ? "Go to Dashboard" : "Get Started Free"}
                </button>

                <button
                  onClick={() => scrollToSection("premium-plans")}
                  className="border border-gray hover:border-primary text-foreground px-6 py-3 rounded-md text-center transition-colors font-medium"
                >
                  View Premium Plans
                </button>
              </div>
            </div>

            <div className="relative h-[320px] md:h-[380px]">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Image
                  className="rounded-xl"
                  src="/Theme1.png"
                  alt="Limitter Hero"
                  width={300}
                  height={300}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="features"
        className="py-16 bg-gray-light dark:bg-gray-dark/10"
      >
        <div className="container mx-auto max-w-6xl px-4">
          <SectionHeading
            title="Smart features to boost your productivity"
            description="Limitter comes packed with powerful features designed to help you stay focused and make the most of your time."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featureCards.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section id="premium-plans" className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <SectionHeading
            title="Choose your plan"
            description="Upgrade to Premium for advanced features and unlimited domain blocking."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <PlanCard
                key={plan.name}
                plan={plan}
                user={user}
                onSelect={handlePlanSelection}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-light dark:bg-gray-dark/10 px-4">
        <div className="container mx-auto max-w-6xl">
          <SectionHeading
            title="What our users say"
            description="Thousands of users rely on Limitter to stay focused and productive."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <TestimonialCard key={testimonial.name} {...testimonial} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-background rounded-xl p-8 md:p-12 shadow-lg border border-gray-light dark:border-gray-dark/30 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to boost your productivity?
            </h2>
            <p className="text-gray-dark dark:text-gray max-w-xl mx-auto mb-8">
              Join thousands of users who have improved their focus and
              productivity with Limitter.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() =>
                  user ? router.push("/dashboard") : router.push("/signup")
                }
                className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-md text-center transition-colors font-medium"
              >
                {user ? "Go to Dashboard" : "Get Started Free"}
              </button>

              <Link
                href="/chrome-extension"
                className="border border-gray hover:border-primary text-foreground px-6 py-3 rounded-md text-center transition-colors font-medium"
              >
                Get Chrome Extension
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}