'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gift, Sparkles, X, Copy, Check, ArrowRight, Tag } from 'lucide-react';

export default function PromotionalModal() {
  const [promo, setPromo] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let timer;
    const fetchLatestPromo = async () => {
      try {
        const res = await fetch('/api/promotions/latest');
        const data = await res.json();
        if (data.success && data.promo) {
          const promoId = data.promo.id || data.promo._id;
          const dismissed = localStorage.getItem(`dismissed_promo_${promoId}`);
          if (!dismissed) {
            setPromo(data.promo);
            // Show after 1.2s delay for seamless smooth entrance after page load
            timer = setTimeout(() => {
              setIsOpen(true);
            }, 1200);
          }
        }
      } catch (err) {
        // silent fallback
      }
    };

    fetchLatestPromo();
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    if (promo) {
      const promoId = promo.id || promo._id;
      localStorage.setItem(`dismissed_promo_${promoId}`, 'true');
    }
    setIsOpen(false);
  };

  const handleCopyCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen || !promo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-[#181922] via-[#101117] to-[#07080b] border-2 border-[#FFCC00]/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-yellow-500/10 text-center space-y-5 overflow-hidden">
        
        {/* Glow ambient effect */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-[#FFCC00]/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full bg-white/5 hover:bg-white/10 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Badge & Icon */}
        <div className="flex flex-col items-center gap-2 pt-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#FFCC00] to-yellow-200 text-slate-950 flex items-center justify-center shadow-lg shadow-yellow-500/30 transform hover:scale-105 transition">
            <Gift className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFCC00]/15 border border-[#FFCC00]/40 rounded-full text-[11px] font-black uppercase tracking-wider text-[#FFCC00]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VIP Promotional Announcement</span>
          </div>
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
            {promo.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            {promo.message}
          </p>
        </div>

        {/* Bonus / Promo Code Section */}
        {(promo.promoCode || promo.bonusAmount > 0) && (
          <div className="bg-[#07080b]/90 border border-white/10 rounded-2xl p-4 space-y-3">
            {promo.bonusAmount > 0 && (
              <div className="text-sm font-extrabold text-[#FFCC00] flex items-center justify-center gap-1.5">
                <span>🔥 Freeplay Bonus:</span>
                <span className="text-white text-base">${Number(promo.bonusAmount).toFixed(2)} USD</span>
              </div>
            )}

            {promo.promoCode && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Use Promo Code at Checkout:
                </span>
                <div className="flex items-center justify-between bg-[#181922] border-2 border-dashed border-[#FFCC00]/60 rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#FFCC00]" />
                    <span className="font-mono font-black text-base tracking-widest text-[#FFCC00]">
                      {promo.promoCode}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyCode(promo.promoCode)}
                    className="flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-[#FFCC00]/20 text-[#FFCC00] hover:bg-[#FFCC00] hover:text-slate-950 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CTA Actions */}
        <div className="space-y-2.5 pt-1">
          <Link
            href="/player/wallet/deposit"
            onClick={handleDismiss}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-[#FFCC00] to-yellow-400 hover:from-yellow-400 hover:to-[#FFCC00] text-slate-950 font-black rounded-xl text-sm uppercase tracking-wider shadow-lg shadow-yellow-500/25 flex items-center justify-center gap-2 transition transform active:scale-98"
          >
            <span>Claim &amp; Deposit Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={handleDismiss}
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
          >
            Don&apos;t show this again
          </button>
        </div>
      </div>
    </div>
  );
}
