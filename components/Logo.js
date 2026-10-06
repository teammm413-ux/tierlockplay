'use client';

import React from 'react';
import Link from 'next/link';

export default function Logo({ size = 'medium', href = '/', showText = true, theme = 'dark' }) {
  const sizeMap = {
    small: { icon: 28, text: 'text-lg', sub: 'text-[9px]' },
    medium: { icon: 38, text: 'text-2xl', sub: 'text-[10px]' },
    large: { icon: 48, text: 'text-3xl', sub: 'text-xs' },
  };

  const current = sizeMap[size] || sizeMap.medium;
  const isLight = theme === 'light';

  const content = (
    <div className="flex items-center gap-3 cursor-pointer select-none group">
      {/* Golden Shield Logo SVG */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-md group-hover:bg-amber-500/40 transition-all duration-300"></div>
        <svg
          width={current.icon}
          height={current.icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative transform group-hover:scale-105 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(245,158,11,0.5)]"
        >
          <defs>
            <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="70%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>
            <linearGradient id="emeraldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
          </defs>

          {/* Outer Shield Border */}
          <path
            d="M50 5 L88 22 V52 C88 74 50 95 50 95 C50 95 12 74 12 52 V22 L50 5 Z"
            fill={isLight ? '#1e293b' : '#090d16'}
            stroke="url(#goldGrad)"
            strokeWidth="4"
          />

          {/* Inner Shield Inlay */}
          <path
            d="M50 14 L80 28 V52 C80 69 50 86 50 86 C50 86 20 69 20 52 V28 L50 14 Z"
            fill="none"
            stroke="url(#goldGrad)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
            opacity="0.6"
          />

          {/* Crown & Ace/Vault Emblem */}
          <path
            d="M34 38 L42 46 L50 32 L58 46 L66 38 L63 56 H37 L34 38 Z"
            fill="url(#goldGrad)"
          />
          <circle cx="50" cy="30" r="3" fill="#ffffff" />
          <circle cx="34" cy="36" r="2.5" fill="#fef08a" />
          <circle cx="66" cy="36" r="2.5" fill="#fef08a" />

          {/* Golden Vault V */}
          <path
            d="M40 60 L50 74 L60 60 H54 L50 67 L46 60 H40 Z"
            fill="url(#goldGrad)"
          />

          {/* Lucky Emerald Star Gem in Center */}
          <circle cx="50" cy="51" r="3.5" fill="url(#emeraldGrad)" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 900,
                letterSpacing: '1px',
                background: isLight
                  ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #b45309 100%)'
                  : 'linear-gradient(135deg, #ffffff 0%, #fbbf24 60%, #f59e0b 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textTransform: 'uppercase',
                fontSize: size === 'large' ? '28px' : size === 'small' ? '18px' : '22px',
              }}
            >
              VEGAS<span style={{ color: '#f59e0b', WebkitTextFillColor: '#f59e0b', marginLeft: '4px' }}>VAULT</span>
            </span>
            <span
              className="badge-tag"
              style={{
                background: isLight ? '#fef3c7' : 'rgba(245,158,11,0.15)',
                color: isLight ? '#92400e' : '#fbbf24',
                border: isLight ? '1px solid #fde68a' : '1px solid rgba(245,158,11,0.3)',
                padding: '1px 5px',
                fontSize: '9px',
                fontWeight: 800,
                borderRadius: '4px'
              }}
            >
              USA
            </span>
          </div>
          <span
            style={{
              fontSize: '10px',
              color: isLight ? '#64748b' : '#94a3b8',
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              fontWeight: 700,
              marginTop: '3px',
            }}
          >
            CASINO & GAME WALLET
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
