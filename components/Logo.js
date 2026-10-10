'use client';

import React from 'react';
import Link from 'next/link';

export default function Logo({
  size = 'medium',
  href = '/',
  theme = 'dark',
  className = '',
}) {
  const heightClasses = {
    small: 'h-8 sm:h-9',
    medium: 'h-11 sm:h-12',
    large: 'h-14 sm:h-16',
    xlarge: 'h-20 sm:h-24',
  };

  const hClass = heightClasses[size] || heightClasses.medium;

  const content = (
    <div
      className={`inline-flex items-center justify-center select-none ${
        theme === 'light'
          ? 'bg-[#0a0b10] px-3.5 py-2 rounded-xl border border-[#FFCC00]/20 shadow-md'
          : ''
      } ${className}`}
    >
      <img
        src="/images/logo.png"
        alt="Tierlock - When Trust Matters, Choose Tierlock"
        className={`${hClass} w-auto object-contain drop-shadow-[0_0_15px_rgba(255,204,0,0.15)]`}
      />
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center hover:opacity-90 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
