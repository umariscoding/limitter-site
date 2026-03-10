"use client";

export default function OverrideMetric({ label, value, cardClass, valueClass, subtext }) {
  return (
    <div className={`text-center p-4 rounded-lg ${cardClass}`}>
      <div className={`text-2xl font-bold ${valueClass}`}>{value}</div>
      <div className="text-sm">{label}</div>
      {subtext && <div className="text-xs mt-1">{subtext}</div>}
    </div>
  );
}
