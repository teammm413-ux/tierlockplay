'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Logo({
  size = 'medium',
  href = '/',
  showTagline = true,
  showText = true,
  theme = 'dark',
  useImage = false,
  className = '',
}) {
  const isLight = theme === 'light';

  // Size mapping
  const sizeMap = {
    small: {
      imgW: 130,
      imgH: 40,
      tagline: 'text-[7px]',
      word: 'text-lg',
      lockSize: 18,
      badge: 'text-[8px] px-1 py-0.2',
    },
    medium: {
      imgW: 180,
      imgH: 52,
      tagline: 'text-[9px]',
      word: 'text-2xl',
      lockSize: 22,
      badge: 'text-[9px] px-1.5 py-0.5',
    },
    large: {
      imgW: 240,
      imgH: 70,
      tagline: 'text-[11px]',
      word: 'text-3xl sm:text-4xl',
      lockSize: 30,
      badge: 'text-[10px] px-2 py-0.5',
    },
    xlarge: {
      imgW: 300,
      imgH: 90,
      tagline: 'text-[13px]',
      word: 'text-4xl sm:text-5xl',
      lockSize: 38,
      badge: 'text-xs px-2.5 py-1',
    },
  };

  const s = sizeMap[size] || sizeMap.medium;

  // Keyhole Lock 'O' Vector matching official brand
  const LockO = ({ lockSize }) => (
    <span
      className="inline-flex items-center justify-center relative mx-[1px] translate-y-[-1px] shrink-0 align-middle select-none"
      style={{ width: lockSize, height: lockSize }}
    >
      <svg
        width={lockSize}
        height={lockSize}
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-[0_0_8px_rgba(255,204,0,0.5)]"
      >
        {/* Solid Yellow Rounded Body */}
        <rect x="8" y="10" width="84" height="80" rx="20" fill="#FFCC00" />
        {/* Keyhole cutout in pure deep black */}
        <circle cx="50" cy="38" r="14" fill="#0A0A0C" />
        <path d="M44 46 L38 74 H62 L56 46 Z" fill="#0A0A0C" />
      </svg>
    </span>
  );

  const content = (
    <div className={`flex flex-col items-center justify-center cursor-pointer select-none group ${className}`}>
      {useImage ? (
        <div className="relative flex items-center justify-center">
          <Image
            src="/images/tierlock-logo.png"
            alt="TierlockPlay Official Logo"
            width={s.imgW}
            height={s.imgH}
            className="object-contain drop-shadow-[0_4px_16px_rgba(255,204,0,0.25)] group-hover:scale-105 transition-transform duration-300"
            priority
          />
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          {/* Top Tagline: WHEN TRUST MATTERS, CHOOSE */}
          {showTagline && (
            <span
              className={`${s.tagline} font-bold tracking-[0.26em] uppercase transition-colors duration-200 ${
                isLight ? 'text-slate-600' : 'text-slate-200 group-hover:text-yellow-400'
              } mb-0.5`}
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              WHEN TRUST MATTERS, CHOOSE
            </span>
          )}

          {/* Main Brand Wordmark: TIERLOCK + PLAY */}
          {showText && (
            <div className="flex items-center leading-none">
              <span
                className={`${s.word} font-black tracking-tight text-[#FFCC00] flex items-center drop-shadow-[0_2px_12px_rgba(255,204,0,0.4)] group-hover:drop-shadow-[0_2px_20px_rgba(255,204,0,0.65)] transition-all duration-300`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                <span>TIERL</span>
                <LockO lockSize={s.lockSize} />
                <span>CK</span>
              </span>

              {/* Gold PLAY Badge */}
              <span
                className={`ml-1.5 font-black uppercase rounded ${s.badge} bg-[#FFCC00] text-black tracking-wider shadow-sm group-hover:bg-yellow-300 transition-colors duration-200`}
                style={{ fontFamily: 'Outfit, sans-serif' }}
              >
                PLAY
              </span>
            </div>
          )}

          {/* Domain Subtitle */}
          <span
            className={`text-[9px] tracking-[0.2em] uppercase font-bold mt-1 transition-colors ${
              isLight ? 'text-slate-500' : 'text-yellow-400/80 group-hover:text-yellow-300'
            }`}
          >
            tierlockplay.com
          </span>
        </div>
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="inline-block">{content}</Link>;
  }
  return content;
}
