"use client";

import { FaCheck, FaTimes } from "react-icons/fa";

export default function FeatureList({ features, excluded = [] }) {
  return (
    <ul className="space-y-2">
      {features.map((feature) => (
        <li key={feature} className="flex items-center">
          <FaCheck className="h-5 w-5 text-green-500 mr-3" />
          <span className="text-sm">{feature}</span>
        </li>
      ))}

      {excluded.map((feature) => (
        <li key={feature} className="flex items-center">
          <FaTimes className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3" />
          <span className="text-sm text-gray-500 dark:text-gray-400">{feature}</span>
        </li>
      ))}
    </ul>
  );
}
