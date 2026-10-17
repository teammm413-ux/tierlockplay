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
  CreditCard,
  Upload,
  Image as ImageIcon,
  X,
  Eye,
  FileCheck,
  Download,
  Gift
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
  const [copiedTag, setCopiedTag] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [isPaymentSuccess, setIsPaymentSuccess] = useState(false);

  // Manual payment methods configuration from admin
  const [manualMethods, setManualMethods] = useState([]);
  const [playerSenderTag, setPlayerSenderTag] = useState('');
  const [playerSenderEmail, setPlayerSenderEmail] = useState('');
  const [bonusInfo, setBonusInfo] = useState(null);
  const [proofImage, setProofImage] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const isUsingCustom = Boolean(customAmount && parseFloat(customAmount) > 0);
  const selectedDenom = DENOMINATIONS[selectedIndex] || DENOMINATIONS[0];
  const activeAmount = isUsingCustom
    ? parseFloat(customAmount).toFixed(2)
    : selectedDenom.usd;

  const appliedBonusPercent = bonusInfo?.applied_bonus_percent ?? 300;
  const depositNum = parseFloat(activeAmount) || 0;
  const bonusAmountVal = parseFloat(((depositNum * appliedBonusPercent) / 100).toFixed(2));
  const totalCreditedCoins = parseFloat((depositNum + bonusAmountVal).toFixed(2));

  // Determine if the currently selected channel is a manual channel (Chime, PayPal)
  const currentManualConfig = manualMethods.find(
    (m) => m.name.toLowerCase() === payUsing.toLowerCase()
  );
  const isCurrentManual = Boolean(
    currentManualConfig ||
    payUsing.toLowerCase().includes('chime') ||
    payUsing.toLowerCase().includes('paypal')
  );

  const refreshUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) setUser(data.user);
    } catch (err) {}
  };

  const loadManualMethods = async () => {
    try {
      const res = await fetch('/api/wallet/deposit-methods');
      const data = await res.json();
      if (data.success && data.methods) {
        setManualMethods(data.methods);
      }
    } catch (err) {}
  };

  const loadBonusInfo = async () => {
    try {
      const res = await fetch('/api/wallet/deposit-bonus');
      const data = await res.json();
      if (data.success) {
        setBonusInfo(data);
      }
    } catch (err) {}
  };

  const handleDownloadQr = (url, name) => {
    if (!url) return;
    try {
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name || 'Payment'}-QR-Code.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (e) {
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    refreshUserData();
    loadManualMethods();
    loadBonusInfo();

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

  // Upload player proof screenshot
  const handleProofFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/wallet/upload-proof', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setProofImage(data.url);
      } else {
        alert(data.message || 'Image upload failed. Please try a different screenshot.');
      }
    } catch (err) {
      alert('Network error uploading payment screenshot');
    } finally {
      setIsUploadingProof(false);
    }
  };

  const handleOpenModal = () => {
    const amtNum = parseFloat(activeAmount);
    if (isNaN(amtNum) || amtNum < 2) {
      alert('Minimum deposit amount is $2.00. Please enter $2.00 or select a preset.');
      return;
    }

    if (isCurrentManual) {
      // Manual flow validation
      if (!playerSenderTag.trim()) {
        alert(`Please enter your ${payUsing} tag / username so admin can verify your payment.`);
        return;
      }
      if (!playerSenderEmail.trim()) {
        alert(`Please enter your ${payUsing} account email address.`);
        return;
      }
      if (!proofImage) {
        alert('Please upload your payment successful screenshot before submitting.');
        return;
      }
      handleManualSubmit();
    } else {
      setShowConfirmModal(true);
    }
  };

  // Submit manual deposit (Chime & PayPal)
  const handleManualSubmit = async () => {
    const amtNum = parseFloat(activeAmount);
    if (isNaN(amtNum) || amtNum < 2) {
      alert('Minimum deposit amount is $2.00');
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('');

    try {
      const res = await fetch('/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: payUsing,
          paidAmount: amtNum,
          receivedAmount: totalCreditedCoins,
          sender_tag: playerSenderTag.trim(),
          sender_email: playerSenderEmail.trim(),
          senderCashtag: playerSenderTag.trim(),
          proof_image: proofImage,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCreatedOrder({
          isManual: true,
          orderNo: data.orderNo,
          paidAmount: amtNum.toFixed(2),
          receivedAmount: (data.totalCreditAmount || totalCreditedCoins).toFixed(2),
          method: payUsing,
          bonusPercent: data.bonusPercentage || appliedBonusPercent,
          bonusAmount: data.bonusAmount || bonusAmountVal,
          totalCoins: (data.totalCreditAmount || totalCreditedCoins).toFixed(2),
          senderTag: playerSenderTag.trim(),
          senderEmail: playerSenderEmail.trim(),
          proofImage: proofImage,
          status: 'Pending',
          createdTime: new Date().toLocaleString(),
        });
        refreshUserData();
      } else {
        alert(data.message || 'Failed to submit deposit request');
      }
    } catch (err) {
      alert('Network error submitting deposit');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit automated gateway deposit (Cash App / Card / etc.)
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

  const copyTagToClipboard = (text) => {
    if (navigator?.clipboard && text) {
      navigator.clipboard.writeText(text);
      setCopiedTag(true);
      setTimeout(() => setCopiedTag(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex font-sans">
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
                Add credits to your Tierlock wallet via instant cashout &amp; manual card channels. Credits are immediately transferable to Juwa, Fire Kirin, Game Vault &amp; more.
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
                <div className="w-12 h-12 rounded-2xl bg-[#FFCC00]/10 text-[#FFCC00] flex items-center justify-center border border-[#FFCC00]/30">
                  {createdOrder.isManual ? (
                    <FileCheck className="w-6 h-6 text-[#FFCC00]" />
                  ) : (
                    <Clock className="w-6 h-6 animate-spin text-[#FFCC00]" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase">
                    {createdOrder.isManual ? 'Manual Deposit Submitted' : 'Checkout Order Created'}
                  </h2>
                  <p className="text-xs text-slate-400">Order #{createdOrder.orderNo}</p>
                </div>
              </div>

              {createdOrder.isManual ? (
                /* Manual Deposit Success Banner */
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-2">
                  <div className="font-bold flex items-center gap-2 text-emerald-400 text-sm">
                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                    <span>Payment Proof Received — Awaiting Admin Review</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    Your deposit request has been safely sent to our administration team. Once your screenshot and {createdOrder.method} tag are verified, your wallet balance will be credited automatically.
                  </p>
                </div>
              ) : (
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
                  <span className="text-slate-400">Payment Channel:</span>
                  <span className="font-semibold text-slate-200">
                    {createdOrder.method}
                  </span>
                </div>
                {createdOrder.senderTag && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Your Tag / Username:</span>
                    <span className="font-mono font-bold text-amber-300">{createdOrder.senderTag}</span>
                  </div>
                )}
                {createdOrder.proofImage && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Screenshot Proof:</span>
                    <button
                      type="button"
                      onClick={() => setPreviewImage(createdOrder.proofImage)}
                      className="text-[#FFCC00] hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Eye className="w-3.5 h-3.5" /> View Uploaded Screenshot
                    </button>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-slate-400">Reference Order No:</span>
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

              <div className="flex gap-4">
                <Link
                  href="/player/wallet/deposit-records"
                  className="flex-1 py-3 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 text-center font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md"
                >
                  View Deposit Records
                </Link>
                <button
                  onClick={() => {
                    setCreatedOrder(null);
                    setStatusMessage('');
                    setProofImage('');
                    setPlayerSenderTag('');
                  }}
                  className="flex-1 py-3 border border-white/20 text-slate-300 hover:bg-white/5 text-center font-semibold text-xs rounded-xl transition"
                >
                  Make Another Deposit
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Channels, Manual Details & Denominations (takes 2 cols) */}
              <div className="lg:col-span-2 space-y-6">
                {/* Pay Using */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-3 uppercase tracking-wider">
                    Pay Using Channel
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { name: 'Chime', icon: '🏦', badge: 'Direct Manual' },
                      { name: 'PayPal', icon: '🅿️', badge: 'Manual' },
                      { name: 'Cash App', icon: '💵', badge: 'Popular' },
                      { name: 'Google & Apple Pay', icon: '📱', badge: '1-Click' },
                      { name: 'BTC Lightning', icon: '⚡', badge: 'Instant' },
                      { name: 'Debit / Credit Card', icon: '💳', badge: 'Fast' },
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

                {/* REQUIREMENT: IF CHIME OR PAYPAL SELECTED -> DEDICATED MANUAL DETAILS BOX */}
                {isCurrentManual && (
                  <div className="bg-[#101117] border border-[#FFCC00]/40 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl animate-in fade-in duration-150">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-2xl bg-[#FFCC00]/10 border border-[#FFCC00]/30 text-[#FFCC00] flex items-center justify-center text-xl">
                          {payUsing.toLowerCase().includes('chime') ? '🏦' : '🅿️'}
                        </div>
                        <div>
                          <h3 className="font-black text-white text-base">
                            {payUsing} Manual Deposit Instructions
                          </h3>
                          <span className="text-[11px] text-amber-400 font-semibold">
                            Direct Transfer &amp; Screenshot Verification
                          </span>
                        </div>
                      </div>

                      {/* Prominent Payment Link Button (User clicks and goes to URL) */}
                      {currentManualConfig?.pay_url ? (
                        <a
                          href={currentManualConfig.pay_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5 shadow-md self-start sm:self-auto"
                        >
                          <span>Click Here to Pay via {payUsing}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      ) : null}
                    </div>

                    {/* Admin Instructions and Account Tag */}
                    <div className="space-y-3">
                      {currentManualConfig?.account_tag && (
                        <div className="bg-[#181922] p-3.5 rounded-2xl border border-white/10 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                              Send Payment To Our {payUsing} Tag:
                            </span>
                            <span className="font-mono font-black text-white text-base text-[#FFCC00]">
                              {currentManualConfig.account_tag}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyTagToClipboard(currentManualConfig.account_tag)}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                          >
                            {copiedTag ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedTag ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      )}

                      {/* Instructions */}
                      <p className="text-xs text-slate-300 leading-relaxed bg-white/[0.02] p-3.5 rounded-xl border border-white/5">
                        {currentManualConfig?.instructions ||
                          `Transfer your deposit amount via ${payUsing}. Once the payment is complete, upload your successful payment screenshot and write your ${payUsing} tag below.`}
                      </p>

                      {/* QR Code / Screenshot image from Admin (if available) */}
                      {currentManualConfig?.qr_image && (
                        <div className="p-3 bg-[#181922] rounded-2xl border border-white/10 flex items-center gap-4">
                          <img
                            src={currentManualConfig.qr_image}
                            alt={`${payUsing} Payment QR`}
                            onClick={() => setPreviewImage(currentManualConfig.qr_image)}
                            className="w-20 h-20 object-cover rounded-xl border border-white/20 bg-black cursor-pointer hover:opacity-90 transition"
                          />
                          <div className="space-y-1">
                            <span className="text-xs font-bold text-white block">
                              Scan or View Official Payment QR
                            </span>
                            <div className="flex items-center gap-3 pt-1">
                              <button
                                type="button"
                                onClick={() => setPreviewImage(currentManualConfig.qr_image)}
                                className="text-[#FFCC00] text-xs font-bold hover:underline flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" /> Enlarge QR / Details
                              </button>
                              <span className="text-slate-600">•</span>
                              <button
                                type="button"
                                onClick={() => handleDownloadQr(currentManualConfig.qr_image, payUsing)}
                                className="text-emerald-400 text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Download QR
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Step 2 Form: Tag, Email, and Screenshot Upload */}
                    <div className="pt-2 border-t border-white/10 space-y-4">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#FFCC00] text-slate-950 font-black text-xs flex items-center justify-center">
                          2
                        </span>
                        <h4 className="text-xs font-black text-white uppercase tracking-wider">
                          Submit Your Payment Details
                        </h4>
                      </div>

                      {/* Player's Tag / Username Field */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5">
                          Your {payUsing} Tag / Username / Handle *
                        </label>
                        <input
                          type="text"
                          required
                          value={playerSenderTag}
                          onChange={(e) => setPlayerSenderTag(e.target.value)}
                          placeholder={
                            payUsing.toLowerCase().includes('chime')
                              ? 'e.g. $your_chime_sign'
                              : 'e.g. your_paypal_tag'
                          }
                          className="w-full bg-[#181922] border border-white/10 text-white text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 font-mono"
                        />
                      </div>

                      {/* Player's Account Email Field */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                          <span>Your {payUsing} Account Email *</span>
                          <span className="text-[10px] text-slate-500 font-normal">Used to verify payment sender</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={playerSenderEmail}
                          onChange={(e) => setPlayerSenderEmail(e.target.value)}
                          placeholder="e.g. your_email@gmail.com"
                          className="w-full bg-[#181922] border border-white/10 text-white text-xs px-3.5 py-3 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 font-mono"
                        />
                      </div>

                      {/* Player's Payment Screenshot Upload */}
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                          <span>Payment Success Screenshot *</span>
                          <span className="text-[10px] text-amber-400 font-normal">(Required for admin verification)</span>
                        </label>

                        {proofImage ? (
                          <div className="p-3 bg-[#181922] rounded-2xl border border-emerald-500/40 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <img
                                src={proofImage}
                                alt="Payment Proof"
                                className="w-14 h-14 object-cover rounded-xl border border-emerald-500/30"
                              />
                              <div>
                                <span className="text-xs font-bold text-emerald-400 block flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Screenshot Attached
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPreviewImage(proofImage)}
                                  className="text-[11px] text-slate-400 hover:text-white underline flex items-center gap-1 mt-0.5"
                                >
                                  <Eye className="w-3 h-3" /> Preview
                                </button>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setProofImage('')}
                              className="px-2.5 py-1.5 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded-lg text-xs font-bold transition"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <label className="border-2 border-dashed border-white/15 hover:border-[#FFCC00]/50 rounded-2xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 bg-[#181922]/50 hover:bg-[#181922]">
                            <Upload className="w-6 h-6 text-[#FFCC00]" />
                            <div className="text-xs font-bold text-slate-200">
                              {isUploadingProof ? 'Uploading Screenshot...' : 'Click to Upload Payment Screenshot'}
                            </div>
                            <p className="text-[10px] text-slate-400">
                              PNG, JPG, or WebP up to 10MB
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploadingProof}
                              onChange={handleProofFileUpload}
                              className="hidden"
                            />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Live Bonus Match Banner (First Deposit vs Regular) */}
                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#FFCC00]/15 via-yellow-500/10 to-transparent border border-[#FFCC00]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-[0_0_20px_rgba(255,204,0,0.06)]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FFCC00] text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase tracking-wider text-[#FFCC00]">
                          {bonusInfo?.bonus_title || `Deposit Bonus Match (+${appliedBonusPercent}%)`}
                        </span>
                        {bonusInfo?.is_first_deposit && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            Welcome Offer
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Deposit <span className="font-bold text-white font-mono">${activeAmount}</span> &rarr; Receive <span className="font-bold text-emerald-400 font-mono">+${bonusAmountVal.toFixed(2)} Bonus ({appliedBonusPercent}%)</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right self-stretch sm:self-auto bg-[#181922]/70 sm:bg-transparent p-2.5 sm:p-0 rounded-xl border sm:border-0 border-white/5 flex sm:block justify-between items-center">
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Credits to Wallet</span>
                    <span className="text-base font-black text-[#FFCC00] font-mono">
                      ${totalCreditedCoins.toFixed(2)} USD
                    </span>
                  </div>
                </div>

                {/* Amount Section: Custom Amount Blank at the TOP */}
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
                    Minimum deposit amount is <strong className="text-white">$2.00</strong>.
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
                <div className="bg-[#101117] rounded-3xl p-6 border border-white/10 space-y-5 shadow-sm sticky top-24">
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

                    {isCurrentManual && (
                      <div className="flex justify-between items-center pt-3">
                        <span className="text-slate-400">Process Type</span>
                        <span className="font-bold text-amber-400">Manual Screenshot Review</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-3">
                      <span className="text-slate-400">Processing Fee</span>
                      <span className="font-bold text-emerald-400 font-mono">$0.00 (Free)</span>
                    </div>
                  </div>

                  <button
                    onClick={handleOpenModal}
                    disabled={isSubmitting || isUploadingProof}
                    className="w-full py-3.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition shadow-[0_4px_16px_rgba(255,204,0,0.3)] flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Submitting Deposit...</span>
                      </>
                    ) : (
                      <>
                        <span>{isCurrentManual ? `Submit Proof ($${activeAmount})` : `Proceed to Deposit ($${activeAmount})`}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* CONFIRM ORDER MODAL (For automated gateway channels) */}
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

      {/* Lightbox Modal for Player (to preview QR code or uploaded screenshot) */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md cursor-pointer animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#101117] border border-white/20 rounded-3xl p-4 max-w-2xl w-full max-h-[85vh] flex flex-col space-y-3 cursor-default"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#FFCC00]" />
                <span>Image Preview</span>
              </span>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-black/50 rounded-2xl">
              <img
                src={previewImage}
                alt="Enlarged Preview"
                className="max-h-[65vh] max-w-full object-contain rounded-xl"
              />
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
