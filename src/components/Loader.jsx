'use client';

import React from 'react';

const Loader = ({ size = 'md', color = 'primary' }) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  // Color classes
  const colorClasses = {
    primary: 'border-primary',
    red: 'border-red-600',
    white: 'border-white',
  };

  return (
    <div className="flex items-center justify-center gap-2">
      <div 
        className={`
          animate-spin 
          ${sizeClasses[size] || sizeClasses.md}
          border-2 
          ${colorClasses[color] || colorClasses.primary}
          border-t-transparent 
          rounded-full
        `}
      />
      <span className={`text-${color === 'white' ? 'white' : 'gray-600'} text-sm`}>
        Loading...
      </span>
    </div>
  );
};

export default Loader; 