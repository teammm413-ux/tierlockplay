'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PlayerHeader from '@/components/PlayerHeader';
import Sidebar from '@/components/Sidebar';
import WhatsAppChat from '@/components/WhatsAppChat';
import FreeplayModal from '@/components/FreeplayModal';
import {
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Wallet,
  Loader2,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Upload,
  Gamepad2,
  QrCode,
  X,
  Image as ImageIcon
} from 'lucide-react';

const DEFAULT_METHODS = [
  {
    name: 'Cash App',
    field_label: '$Cashtag',
    field_placeholder: 'e.g. $JohnDoe',
    instructions: 'Start with $. Must begin with a letter, up to 20 characters.'
  },
  {
    name: 'Chime',
    field_label: 'Chime Sign / Email / Phone',
    field_placeholder: 'e.g. $ChimeSign or email@example.com',
    instructions: 'Enter your registered Chime Sign, email, or mobile phone.'
  },
  {
    name: 'Apple Pay',
    field_label: 'Apple Pay Phone / Email',
    field_placeholder: 'e.g. +1 555-0199 or appleid@icloud.com',
    instructions: 'Enter your Apple Pay registered phone number or Apple ID.'
  },
  {
    name: 'Google Pay',
    field_label: 'Google Pay Phone / Email',
    field_placeholder: 'e.g. +1 555-0199 or gpay@gmail.com',
    instructions: 'Enter your Google Pay registered mobile phone or Gmail address.'
  },
  {
    name: 'PayPal',
    field_label: 'PayPal Email / Phone',
    field_placeholder: 'e.g. paypal@example.com',
    instructions: 'Enter your registered PayPal email address or phone number.'
  }
];

export default function WithdrawalPage() {
  const [user, setUser] = useState(null);
  const [availableMethods, setAvailableMethods] = useState(DEFAULT_METHODS);
  const [selectedMethodName, setSelectedMethodName] = useState('Cash App');
  const [paymentInfo, setPaymentInfo] = useState('');
  const [userTagName, setUserTagName] = useState('');
  const [gameScreenshot, setGameScreenshot] = useState('');
  const [qrScreenshot, setQrScreenshot] = useState('');
  const [isUploadingGame, setIsUploadingGame] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [amount, setAmount] = useState('50');
  const [savedMethods, setSavedMethods] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const presets = ['20.00', '50.00', '100.00', '200.00', '500.00'];

  const refreshUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) setUser(data.user);
    } catch (err) {}
  };

  useEffect(() => {
    refreshUserData();

    // Fetch configured withdrawal payment methods from Master Panel
    fetch('/api/wallet/withdrawal-methods')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.methods) && d.methods.length > 0) {
          setAvailableMethods(d.methods);
          setSelectedMethodName(d.methods[0].name);
        }
      })
      .catch(() => {});

    // Fetch user's saved payout methods
    fetch('/api/wallet/payment-methods')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.methods) {
          setSavedMethods(d.methods);
          const defaultMethod = d.methods.find((m) => m.is_default) || d.methods[0];
          if (defaultMethod) {
            setPaymentInfo(defaultMethod.account_identifier);
            if (defaultMethod.type) {
              setSelectedMethodName(defaultMethod.type);
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const activeMethodObj =
    availableMethods.find((m) => m.name.toLowerCase() === selectedMethodName.toLowerCase()) ||
    availableMethods[0] ||
    DEFAULT_METHODS[0];

  const parsedAmount = parseFloat(amount) || 0;
  // No handling fee (Requirement 13)
  const receivingAmount = parsedAmount;

  const handlePresetClick = (val) => {
    setAmount(parseFloat(val).toString());
  };

  const handleMethodDropdownChange = (e) => {
    const val = e.target.value;
    if (!val) return;

    // Check if user picked a saved method or a raw method name
    const foundSaved = savedMethods.find((m) => m.id === val);
    if (foundSaved) {
      setSelectedMethodName(foundSaved.type);
      setPaymentInfo(foundSaved.account_identifier);
      return;
    }

    const foundMethod = availableMethods.find((m) => m.name === val);
    if (foundMethod) {
      setSelectedMethodName(foundMethod.name);
      // Auto-prefix '$' if Cash App
      if (foundMethod.name.toLowerCase().includes('cash app') && !paymentInfo.startsWith('$') && paymentInfo.length > 0) {
        setPaymentInfo('$' + paymentInfo.replace(/^\$+/, ''));
      }
    }
  };

  const handleProofUpload = async (file, type) => {
    if (!file) return;
    if (type === 'game') setIsUploadingGame(true);
    if (type === 'qr') setIsUploadingQr(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/wallet/upload-proof', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success && data.url) {
        if (type === 'game') setGameScreenshot(data.url);
        if (type === 'qr') setQrScreenshot(data.url);
      } else {
        setErrorMsg(data.message || 'Image upload failed. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Network error uploading screenshot proof.');
    } finally {
      if (type === 'game') setIsUploadingGame(false);
      if (type === 'qr') setIsUploadingQr(false);
    }
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (parsedAmount <= 0) {
      setErrorMsg('Please enter a valid withdrawal amount.');
      return;
    }

    if (!paymentInfo.trim()) {
      setErrorMsg(`Please enter your ${activeMethodObj.field_label || 'payout account details'}`);
      return;
    }

    if (!userTagName.trim()) {
      setErrorMsg('Please enter your account tag name / username.');
      return;
    }

    if (!gameScreenshot) {
      setErrorMsg('Please upload a screenshot of your in-game balance / winnings.');
      return;
    }

    if (!qrScreenshot) {
      setErrorMsg('Please upload a screenshot of your payout QR scanner code or tag.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallet/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: activeMethodObj.name,
          paymentInfo: paymentInfo.trim(),
          amount: parsedAmount,
          user_tag_name: userTagName.trim(),
          game_screenshot: gameScreenshot,
          qr_screenshot: qrScreenshot,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessData({
          orderNo: data.orderNo,
          amount: parsedAmount,
          receivingAmount: receivingAmount,
          channel: activeMethodObj.name,
          paymentInfo: paymentInfo.trim(),
          userTagName: userTagName.trim(),
        });
        refreshUserData();
      } else {
        setErrorMsg(data.message || 'Withdrawal request failed. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex">
      {/* Left Sidebar */}
      <Sidebar user={user} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <PlayerHeader
          user={user}
          onOpenChat={() => setIsChatOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full space-y-6">
          {/* Centered Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-white uppercase">
              TRANSFER TO
            </h1>
            <div className="w-12 h-0.5 bg-[#FFCC00] mx-auto mt-2 rounded-full shadow-[0_0_8px_#FFCC00]"></div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-500/40 rounded-2xl text-xs text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 2 Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Card: Input details */}
            <div className="lg:col-span-7 bg-[#101117] rounded-3xl p-6 sm:p-7 shadow-[0_0_30px_rgba(255,204,0,0.04)] border border-white/10 space-y-5">
              {/* Cashout / Payout Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <span className="text-xs font-semibold text-slate-300">Game Winnings Cashout</span>
                <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Manual Verification Dispatch</span>
                </span>
              </div>

              {/* Requirement 9: Replace the Select a saved method to "Choose the payment method" */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 uppercase tracking-wider">
                  Payment Method
                </label>
                <div className="relative">
                  <select
                    value={selectedMethodName}
                    onChange={handleMethodDropdownChange}
                    className="w-full bg-[#181922] border border-white/10 rounded-xl px-4 py-3 text-xs text-white appearance-none focus:outline-none focus:border-[#FFCC00] pr-10 cursor-pointer font-medium"
                  >
                    <option value="" disabled className="bg-[#181922] text-slate-500">
                      Choose the payment method
                    </option>
                    {availableMethods.map((m) => (
                      <option key={m.id || m.name} value={m.name} className="bg-[#181922]">
                        {m.name}
                      </option>
                    ))}
                    {savedMethods.length > 0 && (
                      <optgroup label="Saved Accounts" className="bg-[#181922] text-[#FFCC00]">
                        {savedMethods.map((sm) => (
                          <option key={sm.id} value={sm.id} className="bg-[#181922] text-white">
                            Saved: {sm.type} ({sm.account_identifier})
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>

                {/* Quick select pills for convenience */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  {availableMethods.map((m) => {
                    const isSelected = selectedMethodName.toLowerCase() === m.name.toLowerCase();
                    return (
                      <button
                        key={m.id || m.name}
                        type="button"
                        onClick={() => {
                          setSelectedMethodName(m.name);
                          if (m.name.toLowerCase().includes('cash app') && !paymentInfo.startsWith('$') && paymentInfo.length > 0) {
                            setPaymentInfo('$' + paymentInfo.replace(/^\$+/, ''));
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-[#FFCC00] text-slate-950 font-black shadow-md'
                            : 'bg-[#181922] text-slate-300 border border-white/10 hover:border-white/30'
                        }`}
                      >
                        <span>{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Account Detail input */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  {activeMethodObj.field_label || 'Account Details'}
                </label>
                <input
                  type="text"
                  value={paymentInfo}
                  onChange={(e) => setPaymentInfo(e.target.value)}
                  placeholder={activeMethodObj.field_placeholder || 'Enter account identifier'}
                  className="w-full bg-[#181922] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFCC00]"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {activeMethodObj.instructions ||
                    `Enter your registered ${activeMethodObj.name} account information for receiving transfer.`}
                </p>
              </div>

              {/* Mandatory Field 1: User's Payout Tag Name */}
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1.5 flex items-center justify-between">
                  <span>Your Receiving Tag Name / Handle *</span>
                  <span className="text-[10px] text-amber-400 font-semibold">Required</span>
                </label>
                <input
                  type="text"
                  value={userTagName}
                  onChange={(e) => setUserTagName(e.target.value)}
                  placeholder="e.g. $MyCashtag, @ChimeUser, or PaypalUsername"
                  className="w-full bg-[#181922] border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FFCC00] font-mono"
                />
              </div>

              {/* Withdrawal Amount Input */}
              <div className="relative pt-1">
                <label className="text-xs font-bold text-slate-300 block mb-1.5">
                  Withdrawal Amount
                </label>
                <div className="relative flex items-center border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#FFCC00] bg-[#181922]">
                  <span className="text-[#FFCC00] font-black text-sm mr-2">$</span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent text-white text-sm font-bold focus:outline-none font-mono"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              {/* Quick Amount Presets */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-300 block mb-3 uppercase tracking-wider">
                  Quick Amount Presets
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {presets.map((val) => {
                    const isSelected = parsedAmount === parseFloat(val);
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handlePresetClick(val)}
                        className={`py-2 px-3 rounded-xl text-xs font-mono font-bold transition text-center ${
                          isSelected
                            ? 'bg-[#FFCC00] text-slate-950 font-black shadow-md'
                            : 'bg-[#181922] text-slate-300 border border-white/10 hover:border-white/30'
                        }`}
                      >
                        ${val}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* MANDATORY PROOF 1: In-Game Screenshot */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <label className="text-xs font-bold text-slate-200 block flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Gamepad2 className="w-4 h-4 text-[#FFCC00]" />
                    <span>1. In-Game Screenshot Proof *</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold">Required</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Upload screenshot from inside your game showing your current balance, points, or winning score.
                </p>

                {gameScreenshot ? (
                  <div className="relative group rounded-xl border border-white/15 bg-[#181922] p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={gameScreenshot}
                        alt="Game Proof"
                        className="w-14 h-14 object-cover rounded-lg border border-white/10"
                      />
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Game proof attached
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setGameScreenshot('')}
                      className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-white/15 hover:border-[#FFCC00]/50 rounded-2xl bg-[#181922]/50 hover:bg-[#181922] cursor-pointer transition group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#FFCC00] mb-1.5 transition" />
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                      {isUploadingGame ? 'Uploading Game Proof...' : 'Upload Game Screenshot'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, or WebP up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingGame}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleProofUpload(f, 'game');
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* MANDATORY PROOF 2: Payout QR Code / Tag Screenshot */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <label className="text-xs font-bold text-slate-200 block flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4 text-[#FFCC00]" />
                    <span>2. Payout QR Code or Cashtag Screenshot *</span>
                  </span>
                  <span className="text-[10px] text-amber-400 font-semibold">Required</span>
                </label>
                <p className="text-[11px] text-slate-400">
                  Upload screenshot of your payment QR code scanner or verified cashtag screen to receive payment.
                </p>

                {qrScreenshot ? (
                  <div className="relative group rounded-xl border border-white/15 bg-[#181922] p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={qrScreenshot}
                        alt="QR Proof"
                        className="w-14 h-14 object-cover rounded-lg border border-white/10"
                      />
                      <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Payout QR / tag attached
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setQrScreenshot('')}
                      className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-bold transition flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-white/15 hover:border-[#FFCC00]/50 rounded-2xl bg-[#181922]/50 hover:bg-[#181922] cursor-pointer transition group">
                    <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#FFCC00] mb-1.5 transition" />
                    <span className="text-xs font-bold text-slate-200 group-hover:text-white">
                      {isUploadingQr ? 'Uploading QR Proof...' : 'Upload QR Code / Tag Screenshot'}
                    </span>
                    <span className="text-[10px] text-slate-500 mt-0.5">PNG, JPG, or WebP up to 10MB</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingQr}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleProofUpload(f, 'qr');
                      }}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            {/* Right Card: Order Details */}
            <div className="lg:col-span-5 bg-[#101117] rounded-3xl p-6 sm:p-7 shadow-[0_0_30px_rgba(255,204,0,0.04)] border border-white/10 space-y-4">
              <h2 className="text-base font-black text-white uppercase tracking-wide">Order Details</h2>

              <div className="space-y-3.5 pt-2 text-xs divide-y divide-white/10">
                <div className="flex justify-between items-center text-slate-300 pt-1">
                  <span>Withdrawal Amount</span>
                  <span className="font-mono text-white font-bold text-sm">
                    ${parsedAmount.toFixed(2)}
                  </span>
                </div>

                {/* Requirement 13: Handling fee removed! Receiving amount = Withdrawal amount */}
                <div className="flex justify-between items-center pt-3">
                  <span className="text-slate-300 font-bold">Receiving Amount</span>
                  <span className="font-mono text-[#FFCC00] font-black text-lg drop-shadow-[0_0_8px_rgba(255,204,0,0.3)]">
                    ${receivingAmount.toFixed(2)}
                  </span>
                </div>

                <div className="pt-3 flex justify-between items-center text-slate-300">
                  <span>TRANSFER TO</span>
                  <span className="font-bold text-white uppercase">{activeMethodObj.name}</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleWithdrawalSubmit}
                  disabled={isSubmitting || parsedAmount <= 0}
                  className="w-full bg-[#FFCC00] hover:bg-yellow-300 active:scale-[0.99] text-slate-950 font-black py-4 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-[0_4px_20px_rgba(255,204,0,0.3)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      <span>Processing Cashout...</span>
                    </span>
                  ) : (
                    <span>CONFIRM WITHDRAWAL</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Success / Confirmation Modal (Requirement 11) */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#101117] rounded-3xl p-6 sm:p-7 shadow-2xl border border-[#FFCC00]/30 text-center">
            <div className="w-14 h-14 rounded-full bg-[#FFCC00]/15 text-[#FFCC00] mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-black text-white uppercase tracking-wide">
              Withdrawal Submitted!
            </h3>

            {/* Requirement 11 exact text */}
            <div className="mt-3 p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-left">
              <p className="text-xs text-amber-300 font-bold leading-relaxed">
                Management will verify the withdraw and if eligible it will be processed.
              </p>
            </div>

            {/* Existing lines retained */}
            <p className="text-xs text-slate-400 mt-2.5">
              Your cashout order has been placed into the priority dispatch queue.
            </p>

            <div className="my-5 bg-[#181922] border border-white/10 rounded-2xl p-4 text-left space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Order No:</span>
                <span className="font-mono text-white font-bold">{successData.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Transfer To:</span>
                <span className="text-white font-bold">{successData.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Recipient Account:</span>
                <span className="text-white font-mono font-medium">{successData.paymentInfo}</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between">
                <span className="text-white font-bold">Receiving Amount:</span>
                <span className="text-[#FFCC00] font-black font-mono text-base">
                  ${successData.receivingAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/player/wallet/withdrawal-records"
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold uppercase transition"
              >
                View Records
              </Link>
              <button
                type="button"
                onClick={() => setSuccessData(null)}
                className="flex-1 bg-[#FFCC00] hover:bg-yellow-300 py-3 rounded-xl text-xs font-black uppercase text-slate-950 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      <FreeplayModal onBonusClaimed={(newBal) => setUser((prev) => ({ ...prev, wallet_balance: newBal }))} />
      <WhatsAppChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
      />
    </div>
  );
}
