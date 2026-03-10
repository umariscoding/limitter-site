import Link from "next/link";
import {
  FaBell,
  FaBolt,
  FaCalendarAlt,
  FaCheck,
  FaClone,
  FaClock,
  FaCog,
  FaPlus,
  FaShieldAlt,
} from "react-icons/fa";

const featureSections = [
  {
    badge: "Smart Tracking",
    badgeClass: "bg-primary/10 text-primary",
    title: "Intelligent timers that work the way you do",
    description:
      "Our timers are designed to be fair and adaptive. They only count down when you're actively viewing a specific website, automatically pausing when you switch tabs and resuming when you return.",
    iconColorClass: "bg-primary",
    reverse: false,
    previewType: "timers",
    previewTitle: "Active Timers",
    previewGradient: "from-primary/10 to-accent/10",
    items: [
      {
        title: "Domain-Specific Timers",
        description:
          "Set different time limits for different websites. More time for useful sites, less for distracting ones.",
      },
      {
        title: "Automatic Pause & Resume",
        description:
          "Timers only count down when you're actively using a site. Switch tabs, and the timer pauses automatically.",
      },
      {
        title: "Cross-Session Memory",
        description:
          "Your timer state is remembered even if you close and reopen tabs or your browser.",
      },
    ],
  },
  {
    badge: "Multi-Domain Support",
    badgeClass: "bg-accent/10 text-accent",
    title: "Block any website with custom time limits",
    description:
      "Add any website to your block list and set custom time limits for each one. Premium plans allow for unlimited domains and longer timers.",
    iconColorClass: "bg-accent",
    reverse: true,
    previewType: "domains",
    previewTitle: "Domain Management",
    previewGradient: "from-accent/10 to-primary/10",
    items: [
      {
        title: "Custom Time Limits",
        description:
          "Set different timer durations for each domain, from 1 second up to 15 minutes (with Premium).",
      },
      {
        title: "Easy Management",
        description:
          "Add, edit, or remove domains with just a few clicks. Simple interface makes configuration easy.",
      },
      {
        title: "Domain Pattern Matching",
        description:
          "Block entire domains and all subdomains with a single entry. Regex support coming soon.",
      },
    ],
  },
  {
    badge: "Modern UI",
    badgeClass: "bg-secondary/10 text-secondary",
    title: "Beautiful, distraction-free blocking",
    description:
      "When your time is up, Limitter displays a clean, modern blocking modal that can't be easily dismissed, helping you break the habit of mindless browsing.",
    iconColorClass: "bg-secondary",
    reverse: false,
    previewType: "modal",
    previewTitle: "Blocking Preview",
    previewGradient: "from-secondary/10 to-primary/10",
    items: [
      {
        title: "Non-Dismissable Modal",
        description:
          "Blocking modal can't be easily closed, forcing you to take a break or switch to a more productive task.",
      },
      {
        title: "Motivational Content",
        description:
          "Displays helpful productivity tips and motivational messages to keep you focused on what matters.",
      },
      {
        title: "Premium Customization",
        description:
          "Premium users can customize the appearance and content of their blocking modals.",
      },
    ],
  },
];

const analyticsCards = [
  {
    title: "Time Saved",
    value: "3.5 hours",
    subtext: "↑ 15% from last week",
    subtextClass: "text-green-600",
  },
  {
    title: "Blocks Triggered",
    value: "47 times",
    subtext: "↑ 8% from last week",
    subtextClass: "text-green-600",
  },
  {
    title: "Most Blocked Site",
    value: "YouTube",
    subtext: "23 blocks",
    subtextClass: "text-gray-dark dark:text-gray",
  },
];

const gridFeatures = [
  {
    title: "Instant Activation",
    description:
      "Timers start immediately when you visit a tracked site. No delay, no exceptions.",
    icon: FaBolt,
  },
  {
    title: "Scheduled Blocking",
    description:
      "Premium users can schedule blocks for specific times of day or days of the week.",
    icon: FaCalendarAlt,
  },
  {
    title: "Multi-Tab Support",
    description:
      "Open multiple tabs of the same site, and the timer still works perfectly across all of them.",
    icon: FaClone,
  },
  {
    title: "Privacy First",
    description:
      "All data stays on your device. We don't track your browsing history or collect personal information.",
    icon: FaShieldAlt,
  },
  {
    title: "Customizable",
    description:
      "Adjust timer durations, customize blocking messages, and configure exceptions to match your workflow.",
    icon: FaCog,
  },
  {
    title: "Smart Notifications",
    description:
      "Get gentle reminders when you're spending too much time on distracting sites.",
    icon: FaBell,
  },
];

function SectionBadge({ children, className }) {
  return (
    <div
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mb-4 ${className}`}
    >
      {children}
    </div>
  );
}

function FeatureList({ items, iconColorClass }) {
  return (
    <ul className="space-y-4">
      {items.map((item) => (
        <li key={item.title} className="flex items-start gap-3">
          <div
            className={`mt-1 flex-shrink-0 w-5 h-5 rounded-full ${iconColorClass} flex items-center justify-center text-white`}
          >
            <FaCheck className="h-3 w-3" />
          </div>
          <div>
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-gray-dark dark:text-gray text-sm">
              {item.description}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function PreviewShell({ title, gradientClass, children }) {
  return (
    <div className="relative h-[400px] rounded-xl overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-r ${gradientClass} rounded-xl`} />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-dark rounded-lg shadow-xl overflow-hidden max-w-sm w-full">
          <div className="p-4 border-b border-gray-light dark:border-gray-dark">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md overflow-hidden gradient-bg flex items-center justify-center text-white font-bold text-xs">
                L
              </div>
              <span className="text-sm font-bold text-foreground">{title}</span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function TimersPreview() {
  const timers = [
    {
      label: "YouTube",
      status: "00:15",
      statusClass: "bg-primary/10 text-primary",
      barClass: "bg-primary",
      width: "30%",
    },
    {
      label: "Twitter",
      status: "Paused",
      statusClass:
        "bg-gray-light dark:bg-gray-dark/30 text-gray-dark dark:text-gray",
      barClass: "bg-gray",
      width: "70%",
    },
    {
      label: "Reddit",
      status: "Paused",
      statusClass:
        "bg-gray-light dark:bg-gray-dark/30 text-gray-dark dark:text-gray",
      barClass: "bg-gray",
      width: "50%",
    },
  ];

  return (
    <div className="p-4">
      {timers.map((timer) => (
        <div key={timer.label} className="mb-4 last:mb-0">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium">{timer.label}</span>
            <span className={`text-xs px-2 py-0.5 rounded ${timer.statusClass}`}>
              {timer.status}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-light dark:bg-gray-dark/30 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${timer.barClass}`}
              style={{ width: timer.width }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function DomainsPreview() {
  const domains = [
    { name: "youtube.com", time: "30s" },
    { name: "twitter.com", time: "20s" },
    { name: "reddit.com", time: "45s" },
  ];

  return (
    <div className="p-4">
      {domains.map((domain) => (
        <div
          key={domain.name}
          className="mb-4 p-3 border border-gray-light dark:border-gray-dark rounded-lg"
        >
          <div className="flex justify-between items-center">
            <span className="font-medium">{domain.name}</span>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              {domain.time}
            </span>
          </div>
        </div>
      ))}

      <div className="p-3 border border-dashed border-gray-light dark:border-gray-dark rounded-lg text-center text-gray">
        <span className="text-sm inline-flex items-center gap-2">
          <FaPlus className="h-3 w-3" />
          Add new domain
        </span>
      </div>
    </div>
  );
}

function ModalPreview() {
  return (
    <div className="p-8 text-center">
      <div className="w-16 h-16 mx-auto rounded-full gradient-bg flex items-center justify-center mb-4">
        <FaClock className="h-8 w-8 text-white" />
      </div>
      <h3 className="text-xl font-bold mb-2">Time&apos;s Up!</h3>
      <p className="text-gray-dark dark:text-gray mb-6">
        You&apos;ve reached your time limit for{" "}
        <span className="font-semibold">YouTube</span>. Time to focus on
        something more productive!
      </p>
      <div className="p-4 bg-gray-light dark:bg-gray-dark/30 rounded-lg mb-6">
        <p className="text-sm italic">
          The key is not to prioritize what&apos;s on your schedule, but to
          schedule your priorities. - Stephen Covey
        </p>
      </div>
      <button className="text-sm text-primary">Learn more about Premium</button>
    </div>
  );
}

function FeaturePreview({ type, title, gradientClass }) {
  return (
    <PreviewShell title={title} gradientClass={gradientClass}>
      {type === "timers" && <TimersPreview />}
      {type === "domains" && <DomainsPreview />}
      {type === "modal" && <ModalPreview />}
    </PreviewShell>
  );
}

function FeatureShowcase({
  badge,
  badgeClass,
  title,
  description,
  items,
  iconColorClass,
  reverse,
  previewType,
  previewTitle,
  previewGradient,
  sectionClassName = "",
}) {
  const textContent = (
    <div>
      <SectionBadge className={badgeClass}>{badge}</SectionBadge>
      <h2 className="text-3xl font-bold mb-4">{title}</h2>
      <p className="text-gray-dark dark:text-gray mb-6">{description}</p>
      <FeatureList items={items} iconColorClass={iconColorClass} />
    </div>
  );

  const previewContent = (
    <FeaturePreview
      type={previewType}
      title={previewTitle}
      gradientClass={previewGradient}
    />
  );

  return (
    <section className={`py-16 px-4 ${sectionClassName}`}>
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className={reverse ? "order-2 md:order-1" : ""}>
            {reverse ? previewContent : textContent}
          </div>
          <div className={reverse ? "order-1 md:order-2" : ""}>
            {reverse ? textContent : previewContent}
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniFeatureCard({ title, description, icon: Icon }) {
  return (
    <div className="bg-background rounded-xl p-6 shadow-sm">
      <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center mb-4">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-dark dark:text-gray">{description}</p>
    </div>
  );
}

export default function Features() {
  return (
    <>
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-6">
              Powerful features to{" "}
              <span className="gradient-text">boost your productivity</span>
            </h1>
            <p className="text-xl text-gray-dark dark:text-gray max-w-2xl mx-auto mb-8">
              Limitter comes packed with smart tools to help you stay focused and
              make the most of your time.
            </p>
          </div>
        </div>
      </section>

      {featureSections.map((section, index) => (
        <FeatureShowcase
          key={section.title}
          {...section}
          sectionClassName={
            index % 2 === 0 ? "bg-gray-light dark:bg-gray-dark/10" : ""
          }
        />
      ))}

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <SectionBadge className="bg-primary/10 text-primary">
              Premium Feature
            </SectionBadge>
            <h2 className="text-3xl font-bold mb-4">Detailed usage analytics</h2>
            <p className="text-xl text-gray-dark dark:text-gray max-w-2xl mx-auto">
              Understand your browsing habits with comprehensive analytics and
              reports. Track your progress and see how much time you&apos;re
              saving.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-dark rounded-xl shadow-lg overflow-hidden">
            <div className="p-6 border-b border-gray-light dark:border-gray-dark">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold">Weekly Usage Report</h3>
                <div className="text-sm text-gray-dark dark:text-gray">
                  Last 7 days
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {analyticsCards.map((card) => (
                  <div
                    key={card.title}
                    className="bg-gray-light dark:bg-gray-dark/30 rounded-lg p-4"
                  >
                    <div className="text-sm text-gray-dark dark:text-gray mb-1">
                      {card.title}
                    </div>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <div className={`text-xs ${card.subtextClass}`}>
                      {card.subtext}
                    </div>
                  </div>
                ))}
              </div>

              <div className="h-60 bg-gray-light dark:bg-gray-dark/30 rounded-lg flex items-center justify-center">
                <div className="text-gray-dark dark:text-gray">
                  [Usage Analytics Chart - Available in Premium]
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-light dark:bg-gray-dark/10 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">More powerful features</h2>
            <p className="text-gray-dark dark:text-gray max-w-2xl mx-auto">
              Limitter is packed with features to help you stay focused and be
              more productive.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {gridFeatures.map((feature) => (
              <MiniFeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="bg-background rounded-xl p-8 md:p-12 shadow-lg border border-gray-light dark:border-gray-dark/30 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to stay focused?</h2>
            <p className="text-gray-dark dark:text-gray max-w-xl mx-auto mb-8">
              Join thousands of users who have improved their productivity with
              Limitter.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="bg-primary hover:bg-primary-light text-white px-6 py-3 rounded-md text-center transition-colors font-medium"
              >
                Get Started Free
              </Link>
              <Link
                href="/#pricing"
                className="border border-gray hover:border-primary text-foreground px-6 py-3 rounded-md text-center transition-colors font-medium"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}