'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PlayerHeader from '@/components/PlayerHeader';
import Sidebar from '@/components/Sidebar';
import WhatsAppChat from '@/components/WhatsAppChat';
import FreeplayModal from '@/components/FreeplayModal';
import { ChevronDown, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function WithdrawalPage() {
  const [user, setUser] = useState(null);
  const [channel, setChannel] = useState('Cash APP');
  const [paymentInfo, setPaymentInfo] = useState('');
  const [amount, setAmount] = useState('50');
  const [savedMethods, setSavedMethods] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successData, setSuccessData] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const presets = ['50.00', '100.00', '200.00', '500.00'];

  const refreshUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) setUser(data.user);
    } catch (err) {}
  };

  useEffect(() => {
    refreshUserData();

    // Fetch saved payout methods
    fetch('/api/wallet/payment-methods')
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.methods) {
          setSavedMethods(d.methods);
          const defaultMethod = d.methods.find((m) => m.is_default) || d.methods[0];
          if (defaultMethod) {
            setPaymentInfo(defaultMethod.account_identifier);
            if (defaultMethod.type === 'Paypal') {
              setChannel('Paypal');
            } else {
              setChannel('Cash APP');
            }
          }
        }
      })
      .catch(() => {});
  }, []);

  const parsedAmount = parseFloat(amount) || 0;
  // 5.00% handling fee
  const handlingFee = parseFloat((parsedAmount * 0.05).toFixed(2));
  const receivingAmount = parseFloat(Math.max(0, parsedAmount - handlingFee).toFixed(2));

  const handlePresetClick = (val) => {
    setAmount(parseFloat(val).toString());
  };

  const handleSavedMethodSelect = (e) => {
    const val = e.target.value;
    if (!val) return;
    const found = savedMethods.find((m) => m.id === val || m.account_identifier === val);
    if (found) {
      setPaymentInfo(found.account_identifier);
      if (found.type === 'Paypal') {
        setChannel('Paypal');
      } else {
        setChannel('Cash APP');
      }
    }
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (parsedAmount < 20) {
      setErrorMsg('Minimum withdrawal amount is $20.00');
      return;
    }

    if (!user || (user.wallet_balance || 0) < parsedAmount) {
      setErrorMsg(
        `Insufficient balance. You currently have $${Number(user?.wallet_balance || 0).toFixed(2)}`
      );
      return;
    }

    if (!paymentInfo.trim()) {
      setErrorMsg(channel === 'Cash APP' ? 'Please enter your $Cashtag' : 'Please enter your PayPal email or phone');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/wallet/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: channel === 'Cash APP' ? 'Cash App' : 'PayPal',
          paymentInfo: paymentInfo.trim(),
          amount: parsedAmount,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessData({
          orderNo: data.orderNo,
          channel,
          paymentInfo: paymentInfo.trim(),
          amount: parsedAmount,
          handlingFee,
          receivingAmount,
        });
        refreshUserData();
      } else {
        setErrorMsg(data.message || 'Withdrawal failed. Please try again.');
      }
    } catch (err) {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-slate-800 flex">
      {/* Left Sidebar */}
      <Sidebar user={user} />

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header matching TRP screenshots */}
        <PlayerHeader
          user={user}
          onOpenChat={() => setIsChatOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full">
          {/* Centered Title */}
          <div className="text-center mb-6">
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide text-slate-900 uppercase">
              TRANSFER TO
            </h1>
          </div>

          {/* Select Channel */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Select Channel
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setChannel('Cash APP');
                  if (!paymentInfo.startsWith('$') && paymentInfo.length > 0) {
                    setPaymentInfo('$' + paymentInfo);
                  }
                }}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition shadow-sm ${
                  channel === 'Cash APP'
                    ? 'bg-[#1a304e] text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                }`}
              >
                Cash APP
              </button>

              <button
                type="button"
                onClick={() => setChannel('Paypal')}
                className={`px-6 py-2.5 rounded-full text-xs font-bold transition shadow-sm ${
                  channel === 'Paypal'
                    ? 'bg-[#1a304e] text-white'
                    : 'bg-white text-slate-700 border border-slate-300 hover:border-slate-400'
                }`}
              >
                Paypal
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 2 Column Layout (Screenshot 6) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Card: Input details */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200/90 space-y-5">
              {/* Withdrawable Amount */}
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <span>Withdrawable Amount:</span>
                <span className="text-emerald-600 font-mono text-base font-bold">
                  ${Number(user?.wallet_balance || 0).toFixed(2)}
                </span>
              </div>

              {/* Select saved method dropdown */}
              <div className="relative">
                <select
                  onChange={handleSavedMethodSelect}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-700 appearance-none focus:outline-none focus:border-slate-500 pr-10 cursor-pointer"
                >
                  <option value="">Select a saved method</option>
                  {savedMethods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.type} - {m.account_identifier} {m.is_default ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>

              {/* Cashtag or Paypal input */}
              <div>
                <input
                  type="text"
                  value={paymentInfo}
                  onChange={(e) => setPaymentInfo(e.target.value)}
                  placeholder={channel === 'Cash APP' ? '$Cashtag' : 'Paypal Email / Phone'}
                  className="w-full bg-white border border-slate-300 rounded-lg px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  {channel === 'Cash APP'
                    ? 'Start with $. Then a letter, up to 19 letters/digits/underscore (total 2–20). Must begin with a letter.'
                    : 'Enter the registered PayPal email address or phone number for receiving transfer.'}
                </p>
              </div>

              {/* Withdrawal Amount Input with border label */}
              <div className="relative pt-1">
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">
                  Withdrawal Amount
                </label>
                <div className="relative flex items-center border border-slate-300 rounded-lg px-3.5 py-2 focus-within:border-slate-500 bg-white">
                  <span className="text-slate-800 font-semibold text-sm mr-2">$</span>
                  <input
                    type="number"
                    min="20"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-transparent text-slate-900 text-sm font-semibold focus:outline-none"
                    placeholder="Enter amount"
                  />
                </div>
              </div>

              {/* Choose amount or enter self */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-800 block mb-3">
                  Choose amount or enter self
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {presets.map((val) => {
                    const isSelected = parsedAmount === parseFloat(val);
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handlePresetClick(val)}
                        className={`py-2 px-4 rounded-full text-xs font-bold transition shadow-xs text-center ${
                          isSelected
                            ? 'bg-[#2e7d32] text-white border border-[#2e7d32]'
                            : 'bg-white text-slate-800 border border-slate-300 hover:border-slate-400'
                        }`}
                      >
                        ${val}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Card: Order Details */}
            <div className="lg:col-span-5 bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-slate-200/90 space-y-4">
              <h2 className="text-base font-bold text-slate-900">Order Details</h2>

              <div className="space-y-3 pt-2 text-xs">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Withdrawal Amount</span>
                  <span className="font-mono text-slate-900 font-semibold">
                    ${parsedAmount.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-start text-slate-600">
                  <div>
                    <span>Handling Fee</span>
                    <span className="block text-[10px] text-slate-400">(5.00% rate)</span>
                  </div>
                  <span className="font-mono text-slate-900 font-semibold">
                    -${handlingFee.toFixed(2)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-600 font-semibold">Receiving Amount</span>
                  <span className="font-mono text-emerald-600 font-bold text-base">
                    ${receivingAmount.toFixed(2)}
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 flex justify-between items-center text-slate-600">
                  <span>TRANSFER TO</span>
                  <span className="font-bold text-slate-900">{channel}</span>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={handleWithdrawalSubmit}
                  disabled={isSubmitting || parsedAmount <= 0}
                  className="w-full bg-[#1a304e] hover:bg-[#132238] active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-wider transition shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'PROCESSING...' : 'CONFIRM WITHDRAWAL'}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Success / Confirmation Modal */}
      {successData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 sm:p-7 shadow-2xl border border-slate-200 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-slate-900 uppercase tracking-wide">
              Withdrawal Submitted!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Your cashout order has been placed into the priority dispatch queue.
            </p>

            <div className="my-5 bg-slate-50 border border-slate-200 rounded-xl p-4 text-left space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Order No:</span>
                <span className="font-mono text-slate-900 font-bold">{successData.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Transfer To:</span>
                <span className="text-slate-900 font-bold">{successData.channel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Recipient Account:</span>
                <span className="text-slate-900 font-mono font-medium">{successData.paymentInfo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Amount:</span>
                <span className="text-slate-900 font-mono font-semibold">${successData.amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Handling Fee (5.00%):</span>
                <span className="text-slate-600 font-mono">-${successData.handlingFee.toFixed(2)}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between">
                <span className="text-slate-900 font-bold">Receiving Amount:</span>
                <span className="text-emerald-600 font-bold font-mono text-sm">
                  ${successData.receivingAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link
                href="/player/wallet/withdrawal-records"
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold uppercase transition"
              >
                View Records
              </Link>
              <button
                type="button"
                onClick={() => setSuccessData(null)}
                className="flex-1 bg-[#1a304e] hover:bg-[#132238] py-3 rounded-xl text-xs font-bold uppercase text-white transition"
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
