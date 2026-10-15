'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import PlayerHeader from '@/components/PlayerHeader';
import Sidebar from '@/components/Sidebar';
import WhatsAppChat from '@/components/WhatsAppChat';
import {
  Wallet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ExternalLink,
  Loader2,
  RefreshCw,
  Clock,
  Zap,
  CreditCard
} from 'lucide-react';

const DENOMINATIONS = [
  { credits: '20.00', usd: '20.00' },
  { credits: '25.00', usd: '25.00' },
  { credits: '40.00', usd: '40.00' },
  { credits: '50.00', usd: '50.00' },
  { credits: '60.00', usd: '60.00' },
  { credits: '100.00', usd: '100.00' },
  { credits: '130.00', usd: '130.00' },
  { credits: '150.00', usd: '150.00' },
  { credits: '200.00', usd: '200.00' },
];

export default function DepositPage() {
  const [user, setUser] = useState(null);
  const [payUsing, setPayUsing] = useState('Cash App');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

  const isUsingCustom = Boolean(customAmount && parseFloat(customAmount) > 0);
  const selectedDenom = DENOMINATIONS[selectedIndex] || DENOMINATIONS[0];
  const activeAmount = isUsingCustom
    ? parseFloat(customAmount).toFixed(2)
    : selectedDenom.usd;

  const refreshUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) setUser(data.user);
    } catch (err) {}
  };

  useEffect(() => {
    refreshUserData();

    // Check if user was redirected back from payment gateway
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const orderNo = params.get('orderNo');
      const orderId = params.get('order_id');
      const status = params.get('status');

      if (orderNo || orderId || status === 'return') {
        setStatusMessage('Verifying payment confirmation...');
        verifyOrderPayment(orderNo);
      }
    }
  }, []);

  const verifyOrderPayment = async (orderNo, token) => {
    setIsCheckingStatus(true);
    try {
      const res = await fetch('/api/wallet/deposit/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNo, token }),
      });
      const data = await res.json();
      if (data.success && data.status === 'Approved') {
        setIsPaymentSuccess(true);
        setStatusMessage('Payment completed successfully! Your wallet balance has been credited.');
        refreshUserData();
      } else {
        setStatusMessage(data.message || 'Payment is awaiting confirmation from gateway.');
      }
    } catch (err) {
      setStatusMessage('Verification in progress. Please check your deposit records in 1 minute.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleOpenModal = () => {
    const amtNum = parseFloat(activeAmount);
    if (isNaN(amtNum) || amtNum < 2) {
      alert('Minimum deposit amount is $2.00. Please enter $2.00 or select a preset.');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmOrder = async () => {
    const amtNum = parseFloat(activeAmount);
    if (isNaN(amtNum) || amtNum < 2) {
      alert('Minimum deposit amount is $2.00');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('');
    setIsPaymentSuccess(false);

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: payUsing,
          paidAmount: amtNum,
          receivedAmount: amtNum,
          senderCashtag: '',
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (data.redirectUrl) {
          // Immediately redirect user to the secure payment checkout page
          window.location.href = data.redirectUrl;
          return;
        }

        setCreatedOrder({
          orderNo: data.orderNo,
          paidAmount: amtNum.toFixed(2),
          receivedAmount: amtNum.toFixed(2),
          method: payUsing,
          redirectUrl: data.redirectUrl || null,
          token: data.token || null,
          paymentGateway: data.paymentGateway || 'Hosted Gateway',
          gatewayError: data.gatewayError || null,
          status: data.status || 'Created',
          expiresAt: data.expiresAt || null,
        });
        setShowConfirmModal(false);
        refreshUserData();
      } else {
        alert(data.message || 'Deposit order failed');
      }
    } catch (err) {
      alert('Network error submitting deposit');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

        <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full space-y-6">
          {/* Page Heading & Current Balance Card */}
          <div className="bg-[#101117] rounded-3xl p-6 sm:p-8 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm">
            <div>
              <span className="text-[11px] font-bold text-amber-400 bg-amber-400/10 px-3 py-1 rounded-full uppercase tracking-wider border border-amber-400/20 inline-flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Instant Wallet Top-Up</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white mt-2 uppercase tracking-tight">
                Deposit to Wallet
              </h1>
              <p className="text-xs text-slate-400 mt-1 max-w-lg">
                Add credits to your Tierlock wallet via instant cashout &amp; card channels. Credits are immediately transferable to Juwa, Fire Kirin, Game Vault &amp; more.
              </p>
            </div>

            <div className="bg-[#181922] p-4 sm:p-5 rounded-2xl border border-white/10 shrink-0 min-w-[200px] text-left sm:text-right">
              <span className="text-xs text-slate-400 font-medium block">Current Available Balance</span>
              <span className="text-2xl sm:text-3xl font-black text-[#FFCC00] font-mono drop-shadow-[0_0_10px_rgba(255,204,0,0.3)]">
                ${Number(user?.wallet_balance || 0).toFixed(2)} USD
              </span>
            </div>
          </div>

          {createdOrder ? (
            /* Created Deposit State / Order Pending Screen */
            <div className="bg-[#101117] rounded-3xl p-6 sm:p-8 border border-[#FFCC00]/40 space-y-6 shadow-2xl animate-in fade-in duration-200">
              <div className="flex items-center gap-3 pb-4 border-b border-white/10">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-[#FFCC00] flex items-center justify-center">
                  <Clock className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase">Checkout Order Created</h2>
                  <p className="text-xs text-slate-400">Order #{createdOrder.orderNo}</p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                {createdOrder.redirectUrl ? (
                  <a
                    href={createdOrder.redirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-3.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-[0_4px_20px_rgba(255,204,0,0.3)]"
                  >
                    <span>Pay ${createdOrder.paidAmount} USD Securely</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                ) : null}

                <button
                  type="button"
                  onClick={() => verifyOrderPayment(createdOrder.orderNo, createdOrder.token)}
                  disabled={isCheckingStatus}
                  className="py-3 px-5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  title="Check if payment completed"
                >
                  {isCheckingStatus ? (
                    <Loader2 className="w-4 h-4 animate-spin text-[#FFCC00]" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  <span>Check Status</span>
                </button>
              </div>

              {!createdOrder.redirectUrl && (
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs space-y-1.5">
                  <div className="font-bold flex items-center gap-2 text-amber-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Payment Gateway Notice</span>
                  </div>
                  <p className="text-slate-300">
                    {createdOrder.gatewayError
                      ? `TapTapUp gateway response: "${createdOrder.gatewayError}".`
                      : 'Gateway checkout link was not returned by TapTapUp (Merchant credentials inactive or unauthorized).'}
                  </p>
                  <p className="text-[11px] text-amber-400/80">
                    Please verify your Merchant ID and API credentials with TapTapUp / Revsol.
                  </p>
                </div>
              )}

              {statusMessage && (
                <div className={`text-xs p-3.5 rounded-xl border ${
                  isPaymentSuccess
                    ? 'text-emerald-300 bg-emerald-950/50 border-emerald-500/50 font-semibold'
                    : 'text-[#FFCC00] bg-[#FFCC00]/10 border-[#FFCC00]/30'
                }`}>
                  {statusMessage}
                </div>
              )}

              {/* Order breakdown summary */}
              <div className="bg-[#181922] p-4 rounded-2xl border border-white/10 space-y-3 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Deposit Amount:</span>
                  <span className="font-bold text-white">${createdOrder.paidAmount} USD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Wallet Credits to Receive:</span>
                  <span className="font-black text-[#FFCC00] text-sm">${createdOrder.receivedAmount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Payment Gateway / Channel:</span>
                  <span className="font-semibold text-slate-200">
                    {createdOrder.method}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-slate-400">Merchant Reference:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">{createdOrder.orderNo}</span>
                    <button
                      onClick={() => copyToClipboard(createdOrder.orderNo)}
                      className="text-slate-400 hover:text-white p-1"
                      title="Copy Order No"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FFCC00]/10 border border-[#FFCC00]/25 text-xs text-[#FFCC00] leading-relaxed flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#FFCC00] shrink-0 mt-0.5" />
                <div>
                  <strong>30-Minute Payment Window:</strong> This deposit order is valid for <strong>30 minutes</strong>. Unpaid or abandoned checkouts expire automatically. Once you complete checkout, credits appear in your wallet instantly.
                </div>
              </div>

              <div className="flex gap-4">
                <Link
                  href="/player/wallet/deposit-records"
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white text-center font-bold text-xs rounded-xl transition"
                >
                  View Deposit Records
                </Link>
                <button
                  onClick={() => {
                    setCreatedOrder(null);
                    setStatusMessage('');
                  }}
                  className="flex-1 py-3 border border-white/20 text-slate-300 hover:bg-white/5 text-center font-semibold text-xs rounded-xl transition"
                >
                  Make Another Deposit
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Channels & Denominations (takes 2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Pay Using */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">
                    Pay Using Channel
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { name: 'Cash App', icon: '💵', badge: 'Popular' },
                      { name: 'Google & Apple Pay', icon: '📱', badge: '1-Click' },
                      { name: 'Chime', icon: '🏦', badge: 'Direct' },
                      { name: 'BTC Lightning', icon: '⚡', badge: 'Instant' },
                      { name: 'Debit / Credit Card', icon: '💳', badge: 'Fast' },
                      { name: 'PayPal', icon: '🅿️', badge: 'Secured' },
                    ].map((channel) => {
                      const isActive = payUsing === channel.name;
                      return (
                        <button
                          key={channel.name}
                          type="button"
                          onClick={() => setPayUsing(channel.name)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                            isActive
                              ? 'bg-[#FFCC00] text-slate-950 font-black shadow-md'
                              : 'bg-[#101117] text-slate-300 border border-white/10 hover:border-white/30'
                          }`}
                        >
                          <span>{channel.icon}</span>
                          <span>{channel.name}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            isActive ? 'bg-slate-950 text-[#FFCC00] font-black' : 'bg-white/10 text-slate-400'
                          }`}>
                            {channel.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* REQUIREMENT 7: Custom Amount Blank ($2 to $100+) at the TOP */}
                <div className="bg-[#101117] border border-white/10 focus-within:border-[#FFCC00]/50 rounded-2xl p-5 space-y-3 transition shadow-sm">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <span>Enter Deposit Amount</span>
                      <span className="text-[#FFCC00] font-black">($2.00 to $100.00+)</span>
                    </label>
                    {isUsingCustom && (
                      <span className="text-[10px] font-black uppercase text-[#FFCC00] bg-[#FFCC00]/10 border border-[#FFCC00]/30 px-2 py-0.5 rounded-full">
                        Custom Amount Selected
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#FFCC00] bg-[#181922] transition">
                    <span className="text-[#FFCC00] font-black text-base mr-2">$</span>
                    <input
                      type="number"
                      min="2"
                      max="1000"
                      step="any"
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="Write your custom amount (e.g. 2.00, 15.00, 75.00)"
                      className="w-full bg-transparent text-white text-[16px] sm:text-sm font-bold focus:outline-none font-mono placeholder:font-normal placeholder-slate-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Customer can write their own deposit amount starting from <strong className="text-white">$2.00</strong> up to the maximum limit on TapTapUp.
                  </p>
                </div>

                {/* Or Choose Preset Amount Grid below */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Or Choose Preset Amount
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                    {DENOMINATIONS.map((item, idx) => {
                      const isSelected = !isUsingCustom && selectedIndex === idx;
                      return (
                        <div
                          key={item.credits}
                          onClick={() => {
                            setSelectedIndex(idx);
                            setCustomAmount('');
                          }}
                          className={`bg-[#101117] rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-between relative ${
                            isSelected
                              ? 'border-2 border-[#FFCC00] shadow-[0_0_25px_rgba(255,204,0,0.15)] ring-1 ring-[#FFCC00]'
                              : 'border border-white/10 hover:border-white/30'
                          }`}
                        >
                          <span className="font-black text-white text-lg tracking-tight">
                            ${item.credits}
                          </span>
                          <span className="bg-[#181922] text-[#FFCC00] text-[11px] font-bold px-3 py-1 rounded-md mt-2 tracking-wide border border-white/10">
                            USD {item.usd}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Order Details Card */}
              <div className="lg:col-span-1">
                <div className="bg-[#101117] rounded-3xl p-6 border border-white/10 space-y-5 shadow-sm">
                  <h2 className="text-base font-bold text-white uppercase tracking-wide">
                    Order Details
                  </h2>

                  <div className="space-y-4 text-xs divide-y divide-white/10">
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-400">Deposit Amount</span>
                      <span className="font-bold text-white">${activeAmount} USD</span>
                    </div>

                    <div className="flex justify-between items-center pt-3">
                      <span className="text-slate-400">Wallet Credits to Receive</span>
                      <span className="font-black text-[#FFCC00] text-base font-mono">
                        ${activeAmount}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-3">
                      <span className="text-slate-400">Payment Channel</span>
                      <span className="font-semibold text-white">{payUsing}</span>
                    </div>

                    <div className="flex justify-between items-center pt-3">
                      <span className="text-slate-400">Processing Fee</span>
                      <span className="font-bold text-emerald-400 font-mono">$0.00 (Free)</span>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenModal}
                    className="w-full py-3.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-[0_4px_16px_rgba(255,204,0,0.3)] flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    <span>Proceed to Deposit (${activeAmount})</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CONFIRM ORDER MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#101117] border border-[#FFCC00]/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white uppercase">Confirm Deposit Order</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="text-slate-400 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#181922] border border-white/10 rounded-2xl p-4 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Deposit Amount:</span>
                <span className="font-bold text-white">${activeAmount} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wallet Credits to Receive:</span>
                <span className="font-bold text-[#FFCC00] font-mono text-sm">${activeAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Selected Channel:</span>
                <span className="font-bold text-white">{payUsing}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              You will be redirected to the secure 256-bit SSL encrypted checkout page to complete payment. Once paid, credits will reflect in your wallet instantly.
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmOrder}
                className="flex-1 py-3 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <span>Confirm &amp; Pay</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Chat Drawer */}
      <WhatsAppChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
      />
    </div>
  );
}
