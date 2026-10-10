'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import PlayerHeader from '@/components/PlayerHeader';
import WhatsAppChat from '@/components/WhatsAppChat';
import FreeplayModal from '@/components/FreeplayModal';
import {
  Wallet,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  QrCode,
  ArrowRight,
  ShieldCheck,
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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFreeplayOpen, setIsFreeplayOpen] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

  const selectedDenom = DENOMINATIONS[selectedIndex] || DENOMINATIONS[0];

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
      const orderNo = params.get('order_no');
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
    setShowConfirmModal(true);
  };

  const handleConfirmOrder = async () => {
    setIsSubmitting(true);
    setStatusMessage('');
    setIsPaymentSuccess(false);

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: payUsing,
          paidAmount: parseFloat(selectedDenom.usd),
          receivedAmount: parseFloat(selectedDenom.credits),
          senderCashtag: '',
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreatedOrder({
          orderNo: data.orderNo,
          paidAmount: selectedDenom.usd,
          receivedAmount: selectedDenom.credits,
          method: payUsing,
          redirectUrl: data.redirectUrl || null,
          token: data.token || null,
          paymentGateway: data.paymentGateway || 'Hosted Gateway',
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

        {/* Page Content */}
        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Title Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                <Wallet className="w-6 h-6 text-[#FFCC00]" />
                <span>Wallet Deposit</span>
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Instant secure funding for your Tierlock master wallet via Cash App, Apple Pay, &amp; Card.
              </p>
            </div>
            <Link
              href="/player/wallet/deposit-records"
              className="text-xs font-bold text-slate-950 bg-[#FFCC00] hover:bg-yellow-300 px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <span>Deposit Records</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Success Banner */}
          {isPaymentSuccess && (
            <div className="p-5 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 shrink-0 text-emerald-400" />
                <div>
                  <h3 className="font-bold text-sm">Payment Verified!</h3>
                  <p className="text-xs text-emerald-300">
                    Your wallet balance has been updated in real-time. You can now load any game platform!
                  </p>
                </div>
              </div>
              <Link
                href="/player/game-platforms"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs uppercase tracking-wide shrink-0 transition"
              >
                Go Play Games &rarr;
              </Link>
            </div>
          )}

          {/* CREATED ORDER PAYMENT SCREEN */}
          {createdOrder ? (
            <div className="max-w-2xl mx-auto bg-[#101117] rounded-3xl p-6 sm:p-8 border border-[#FFCC00]/30 shadow-[0_0_50px_rgba(255,204,0,0.08)] space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#FFCC00] animate-pulse"></span>
                  <span className="text-xs font-black uppercase text-[#FFCC00] tracking-wider">
                    Secure Instant Checkout
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-slate-300">
                  256-Bit SSL Encrypted
                </span>
              </div>

              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Complete Payment Online</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Click the button below to complete checkout on the secure hosted payment page. Your wallet credits will be loaded automatically.
                </p>
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
                      { name: 'PayPal', icon: '🅿️', badge: 'Secured' },
                      { name: 'Chime', icon: '🏦', badge: 'Direct' },
                      { name: 'Debit / Credit Card', icon: '💳', badge: 'Instant' },
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

                {/* Select Amount Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                      Select Deposit Amount
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                    {DENOMINATIONS.map((item, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <div
                          key={item.credits}
                          onClick={() => setSelectedIndex(idx)}
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
                      <span className="font-bold text-white">${selectedDenom.usd} USD</span>
                    </div>

                    <div className="flex justify-between items-center pt-3">
                      <span className="text-slate-400">Wallet Credits to Receive</span>
                      <span className="font-black text-[#FFCC00] text-base font-mono">
                        ${selectedDenom.credits}
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
                    <span>Proceed to Deposit (${selectedDenom.usd})</span>
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
                <span className="font-bold text-white">${selectedDenom.usd} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Wallet Credits to Receive:</span>
                <span className="font-bold text-[#FFCC00] font-mono text-sm">${selectedDenom.credits}</span>
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
                    <span>Creating Order...</span>
                  </>
                ) : (
                  <span>Confirm &amp; Pay</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Chat & Freeplay Modals */}
      <WhatsAppChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
      />
      <FreeplayModal
        isOpen={isFreeplayOpen}
        onClose={() => setIsFreeplayOpen(false)}
        user={user}
        onClaimed={refreshUserData}
      />
    </div>
  );
}
