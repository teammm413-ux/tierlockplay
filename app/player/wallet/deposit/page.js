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
  RefreshCw
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
  const [payUsing, setPayUsing] = useState('Cash APP');
  const [selectedIndex, setSelectedIndex] = useState(0); // default $20 (meets min test amount)
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFreeplayOpen, setIsFreeplayOpen] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

  const selectedDenom = DENOMINATIONS[selectedIndex] || DENOMINATIONS[2];

  const refreshUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) setUser(data.user);
    } catch (err) {}
  };

  useEffect(() => {
    refreshUserData();

    // Check if user was redirected back from TapTapUp
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const orderNo = params.get('order_no');
      const orderId = params.get('order_id');
      const status = params.get('status');

      if (orderNo || orderId || status === 'return') {
        setStatusMessage('Verifying payment with TapTapUp gateway...');
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
        setStatusMessage('Payment completed! Your wallet balance has been credited.');
        refreshUserData();
      } else {
        setStatusMessage(data.message || 'Payment is still pending on TapTapUp.');
      }
    } catch (err) {
      setStatusMessage('Could not verify status. Please check your deposit records.');
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleSimulateWebhook = async (orderNo, amount) => {
    setIsCheckingStatus(true);
    setStatusMessage('Simulating gateway payment.completed webhook...');
    try {
      const res = await fetch('/api/webhooks/taptapup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'payment.completed',
          status: 'completed',
          merchant_reference: String(orderNo),
          amount: parseFloat(amount),
          order_id: 'SANDBOX_' + Date.now(),
        }),
      });
      const data = await res.json();
      if (data.success && data.status === 'Approved') {
        setIsPaymentSuccess(true);
        setStatusMessage('Payment verified via Webhook! Balance credited to wallet.');
        await refreshUserData();
      } else {
        setStatusMessage(data.message || 'Webhook verification failed.');
      }
    } catch (err) {
      setStatusMessage('Webhook simulation network error.');
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
          paymentGateway: data.paymentGateway || 'TapTapUp',
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
    <div className="min-h-screen bg-[#f0f4f9] text-slate-800 flex">
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
          {/* Title matching Screenshot image copy 4 */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Wallet Deposit
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Instant deposit gateway powered by TapTapUp & Cash App
              </p>
            </div>
            <Link
              href="/player/wallet/deposit-records"
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100/70 px-4 py-2 rounded-xl transition w-fit"
            >
              Deposit Records &rarr;
            </Link>
          </div>

          {/* Success Banner if returned from TapTapUp */}
          {isPaymentSuccess && (
            <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-950">Deposit Succeeded!</h4>
                  <p className="text-xs text-emerald-800/90">{statusMessage || 'Your funds have been credited to your wallet.'}</p>
                </div>
              </div>
              <Link
                href="/player/game-platforms"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Play Games Now
              </Link>
            </div>
          )}

          {/* If order created, show payment instruction receipt & TapTapUp Checkout button */}
          {createdOrder ? (
            <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-2xl border border-slate-200/80 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-emerald-600">
                  <CheckCircle2 className="w-8 h-8 shrink-0" />
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Order Initialized</h2>
                    <p className="text-xs text-slate-500">Order #{createdOrder.orderNo}</p>
                  </div>
                </div>
                {isPaymentSuccess || createdOrder.status === 'Approved' ? (
                  <span className="px-3.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Approved & Credited
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                    Awaiting Payment
                  </span>
                )}
              </div>

              {/* Revsol Hosted Checkout & Verification Card */}
              <div className="bg-gradient-to-br from-[#0b1728] to-[#1a2e4a] text-white p-6 rounded-2xl shadow-md space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-400" />
                    <span className="text-xs font-bold tracking-wider uppercase text-amber-400">
                      Revsol Payment Gateway
                    </span>
                  </div>
                  <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded text-amber-300">
                    Merchant ID: 2026103966
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white">Complete Payment Online via Revsol</h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Click the button below to complete checkout on Revsol hosted gateway, or use <strong>Simulate Webhook</strong> for instant sandbox testing.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-1">
                  {createdOrder.redirectUrl ? (
                    <a
                      href={createdOrder.redirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
                    >
                      <span>Pay ${createdOrder.paidAmount} USD on Revsol</span>
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => verifyOrderPayment(createdOrder.orderNo, createdOrder.token)}
                    disabled={isCheckingStatus}
                    className="py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                    title="Check if payment completed"
                  >
                    {isCheckingStatus ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    <span>Check Status</span>
                  </button>
                </div>

                {/* Sandbox Instant Simulation Button */}
                <div className="pt-3 border-t border-white/10 space-y-2.5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                        <span>🧪 Sandbox API Verification</span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Client note: <em>taptapup.xyz is for API testing only (no need to access web site)</em>. Click button to simulate completed payment.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSimulateWebhook(createdOrder.orderNo, createdOrder.paidAmount)}
                      disabled={isCheckingStatus || isPaymentSuccess}
                      className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 shadow-md active:scale-95"
                    >
                      <span>⚡ Simulate Webhook (Test Pass)</span>
                    </button>
                  </div>
                </div>

                {statusMessage && (
                  <div className={`text-xs p-3 rounded-xl border ${
                    isPaymentSuccess
                      ? 'text-emerald-300 bg-emerald-950/50 border-emerald-500/50 font-semibold'
                      : 'text-amber-200 bg-black/30 border-white/10'
                  }`}>
                    {statusMessage}
                  </div>
                )}
              </div>

              {/* Order breakdown summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Deposit Amount:</span>
                  <span className="font-bold text-slate-900">${createdOrder.paidAmount} USD</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Wallet Credits to Receive:</span>
                  <span className="font-bold text-emerald-600">${createdOrder.receivedAmount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Gateway / Channel:</span>
                  <span className="font-semibold text-slate-800">
                    {createdOrder.redirectUrl ? 'TapTapUp Hosted Payment' : createdOrder.method}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-slate-500">Merchant Reference:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-800">{createdOrder.orderNo}</span>
                    <button
                      onClick={() => copyToClipboard(createdOrder.orderNo)}
                      className="text-slate-400 hover:text-slate-700 p-1"
                      title="Copy Order No"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 leading-relaxed">
                <strong>Instant Credit:</strong> Once you complete payment on the hosted TapTapUp page, the gateway webhook will automatically credit your wallet balance in real-time.
              </div>

              <div className="flex gap-4">
                <Link
                  href="/player/wallet/deposit-records"
                  className="flex-1 py-3 bg-[#1e293b] hover:bg-[#0f172a] text-white text-center font-bold text-xs rounded-xl transition"
                >
                  View Deposit Records
                </Link>
                <button
                  onClick={() => {
                    setCreatedOrder(null);
                    setStatusMessage('');
                  }}
                  className="flex-1 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 text-center font-semibold text-xs rounded-xl transition"
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
                  <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                    Pay Using Channel
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { name: 'Cash App', productId: '272835', icon: '💵', badge: 'Popular' },
                      { name: 'Google & Apple Pay', productId: '49794', icon: '📱', badge: '1-Click' },
                      { name: 'PayPal', productId: '373683', icon: '🅿️', badge: 'Secured' },
                      { name: 'Chime', productId: '314026', icon: '🏦', badge: 'Direct' },
                      { name: 'BTC Lightning', productId: '93593', icon: '⚡', badge: 'Crypto' },
                    ].map((channel) => {
                      const isActive = payUsing === channel.name;
                      return (
                        <button
                          key={channel.name}
                          type="button"
                          onClick={() => setPayUsing(channel.name)}
                          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 ${
                            isActive
                              ? 'bg-[#1e293b] text-white ring-2 ring-[#1e293b]/20 shadow-md'
                              : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <span>{channel.icon}</span>
                          <span>{channel.name}</span>
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isActive ? 'bg-amber-400 text-slate-950 font-black' : 'bg-slate-100 text-slate-500'
                          }`}>
                            #{channel.productId}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Select Amount Grid */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Select Amount
                    </label>
                    <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-md">
                      Min: $20.00 (TapTapUp Sandbox)
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
                    {DENOMINATIONS.map((item, idx) => {
                      const isSelected = selectedIndex === idx;
                      return (
                        <div
                          key={item.credits}
                          onClick={() => setSelectedIndex(idx)}
                          className={`bg-white rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-between shadow-sm relative ${
                            isSelected
                              ? 'border-2 border-blue-600 shadow-md ring-2 ring-blue-500/10'
                              : 'border border-slate-200 hover:border-slate-300 hover:shadow'
                          }`}
                        >
                          <span className="font-black text-slate-900 text-lg tracking-tight">
                            {item.credits}
                          </span>
                          <span className="bg-[#1e293b] text-white text-[11px] font-bold px-3 py-1 rounded-md mt-2 tracking-wide">
                            USD{item.usd}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Right Column: Order Details Card (Screenshot image copy 4) */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 space-y-5">
                  <h2 className="text-base font-bold text-slate-900">
                    Order Details
                  </h2>

                  <div className="space-y-4 text-sm divide-y divide-slate-100">
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-500 text-xs">Deposit Amount</span>
                      <span className="font-bold text-slate-900">${selectedDenom.usd}</span>
                    </div>

                    <div className="flex justify-between items-center pt-3">
                      <span className="text-slate-500 text-xs">Actual Received</span>
                      <span className="font-bold text-emerald-600 text-base">
                        {parseInt(selectedDenom.credits)}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pt-3">
                      <span className="text-slate-500 text-xs">Pay Using</span>
                      <span className="font-semibold text-slate-800 text-xs">{payUsing}</span>
                    </div>

                    <div className="flex justify-between items-center pt-3">
                      <span className="text-slate-500 text-xs">Payment Gateway</span>
                      <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        TapTapUp (Live API)
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenModal}
                    className="w-full mt-4 bg-[#1e293b] hover:bg-[#0f172a] text-white font-bold py-3.5 rounded-xl uppercase tracking-wider text-xs shadow-md transition active:scale-98"
                  >
                    Confirm &amp; Proceed
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Floating Orange $5 Freeplay Button */}
      <FreeplayModal
        isOpen={isFreeplayOpen}
        onClose={() => setIsFreeplayOpen(false)}
        onClaimSuccess={refreshUserData}
      />

      {/* WhatsApp Support Live Chat Drawer */}
      <WhatsAppChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
      />

      {/* Order Details Confirmation Popup Modal (Screenshot image copy 5) */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-slate-800 space-y-5">
            <h3 className="text-center font-bold text-slate-900 text-base">
              Order Details
            </h3>

            <div className="space-y-3 text-xs border-y border-slate-100 py-3.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Pay Using</span>
                <span className="font-medium text-slate-800">
                  {payUsing.toLowerCase().replace(' ', '_')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Deposit Amount</span>
                <span className="font-bold text-slate-900">${selectedDenom.usd}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Service Fee</span>
                <span className="font-medium text-emerald-600">$0.00</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Actual Received</span>
                <span className="font-bold text-emerald-600 text-sm">
                  {parseInt(selectedDenom.credits)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-500">Gateway Provider</span>
                <span className="font-bold text-blue-600">
                  TapTapUp Secure Hosted
                </span>
              </div>
            </div>

            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isSubmitting}
                className="w-full bg-[#1e293b] hover:bg-[#0f172a] text-white font-bold py-3 rounded-xl uppercase tracking-wider text-xs shadow transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Connecting Gateway...</span>
                  </>
                ) : (
                  <span>Confirm</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl text-xs transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
