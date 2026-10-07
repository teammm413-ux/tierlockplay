'use client';

import React, { useState } from 'react';
import { Gift, Sparkles, X, Check, Award } from 'lucide-react';

export default function FreeplayModal({ isOpen: controlledIsOpen, onClose, onBonusClaimed, onClaimSuccess, user }) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const [isClaimed, setIsClaimed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSetOpen = (val) => {
    setInternalIsOpen(val);
    if (!val && onClose) {
      onClose();
    }
  };

  const handleClaim = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/bonus/claim-freeplay', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        setIsClaimed(true);
        setSuccessMsg(data.message);
        if (onBonusClaimed) onBonusClaimed(data.newBalance);
        if (onClaimSuccess) onClaimSuccess(data.newBalance);
        setTimeout(() => {
          handleSetOpen(false);
        }, 2200);
      } else {
        setErrorMsg(data.message || 'Failed to claim freeplay');
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Single Floating Freeplay Button (Bottom Right) */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => handleSetOpen(true)}
          className="bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs sm:text-sm px-4 sm:px-5 py-3 rounded-2xl shadow-xl shadow-orange-500/30 flex items-center gap-2.5 transition transform hover:scale-105 active:scale-95 border border-amber-300/40"
          title="Claim $5 Freeplay Bonus"
        >
          <span className="text-lg">🎁</span>
          <div className="text-left leading-tight">
            <div className="font-black tracking-wide text-xs sm:text-sm">$5 FREEPLAY</div>
            <div className="text-[9px] sm:text-[10px] text-amber-100 font-semibold uppercase tracking-wider">WAITING FOR YOU</div>
          </div>
        </button>
      </div>

      {/* Freeplay Claim Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-gradient-to-b from-[#131b26] to-[#0a0e17] border border-amber-500/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.25)] text-center overflow-hidden font-sans">
            {/* Background glowing orb */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Close Button */}
            <button
              onClick={() => handleSetOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Icon */}
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg mb-4 transform rotate-3">
              <Award className="w-9 h-9 text-slate-950" />
            </div>

            <h3 className="text-xl font-black text-white uppercase tracking-wider mb-2">
              $5 Freeplay Waiting For You
            </h3>

            <p className="text-xs text-amber-200/80 mb-6 px-4 leading-relaxed">
              Win Big! Claim your freeplay now and play the best games. Instant load onto any sweepstakes platform!
            </p>

            {errorMsg && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/40 rounded-lg text-xs text-red-300">
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-lg text-xs text-emerald-300 flex items-center justify-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <button
              onClick={handleClaim}
              disabled={isSubmitting || isClaimed}
              className="w-full py-3.5 px-6 rounded-xl font-black text-sm uppercase tracking-wider bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-slate-950 hover:brightness-110 active:scale-95 transition-all shadow-[0_4px_20px_rgba(245,158,11,0.4)] disabled:opacity-50"
            >
              {isSubmitting ? 'Crediting Wallet...' : isClaimed ? 'Bonus Claimed! 🎉' : 'Collect $5 Freeplay'}
            </button>

            <p className="text-[10px] text-gray-500 mt-4">
              Terms: Valid for 1 claim per player account. Standard play-through applies.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
