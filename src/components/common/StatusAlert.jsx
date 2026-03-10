"use client";

export default function StatusAlert({ icon: Icon, title, message, tone = "green" }) {
  const tones = {
    green:
      "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
  };

  const textTones = {
    green: "text-green-700 dark:text-green-300",
    blue: "text-blue-700 dark:text-blue-300",
  };

  return (
    <div className={`mb-8 p-4 border rounded-xl ${tones[tone]}`}>
      <div className="flex items-center">
        <Icon className="w-6 h-6 mr-3" />
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className={textTones[tone]}>{message}</p>
        </div>
      </div>
    </div>
  );
}
