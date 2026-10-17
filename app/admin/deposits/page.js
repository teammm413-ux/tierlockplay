'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import {
  ArrowDownLeft,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  X,
  FileText,
  CreditCard,
  ExternalLink,
  Upload,
  Image as ImageIcon,
  DollarSign,
  Eye,
  Sliders,
  ShieldCheck,
  HelpCircle,
  Save,
  Plus,
  Gift,
  Percent
} from 'lucide-react';

export default function AdminDepositsPage() {
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' or 'methods'
  const [deposits, setDeposits] = useState([]);
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Modal State for Approve/Reject
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [modalAction, setModalAction] = useState('approve'); // 'approve' or 'reject'
  const [creditAmountInput, setCreditAmountInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Lightbox modal for viewing screenshot proof
  const [previewScreenshot, setPreviewScreenshot] = useState(null);

  // Manual Deposit Methods State
  const [depositMethods, setDepositMethods] = useState([]);
  const [isLoadingMethods, setIsLoadingMethods] = useState(false);
  const [uploadingMethodId, setUploadingMethodId] = useState(null);
  const [savingMethodId, setSavingMethodId] = useState(null);

  // Deposit Bonus Match System State
  const [bonusConfig, setBonusConfig] = useState({
    first_deposit_bonus_percentage: 300,
    regular_deposit_bonus_percentage: 50,
    is_active: true,
  });
  const [isSavingBonus, setIsSavingBonus] = useState(false);

  const loadDeposits = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const url = `/api/admin/deposits?status=${statusFilter}&q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDeposits(data.deposits || []);
      }
    } catch (err) {
      // silent
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const loadDepositMethods = async () => {
    setIsLoadingMethods(true);
    try {
      const res = await fetch('/api/admin/deposit-methods');
      const data = await res.json();
      if (data.success) {
        setDepositMethods(data.methods || []);
      }
    } catch (err) {
      // silent
    } finally {
      setIsLoadingMethods(false);
    }
  };

  const loadBonusConfig = async () => {
    try {
      const res = await fetch('/api/admin/deposit-bonus');
      const data = await res.json();
      if (data.success && data.config) {
        setBonusConfig(data.config);
      }
    } catch (err) {
      // silent
    }
  };

  const handleSaveBonusConfig = async (e) => {
    if (e) e.preventDefault();
    setIsSavingBonus(true);
    try {
      const res = await fetch('/api/admin/deposit-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bonusConfig),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice('Deposit Bonus Match Settings saved successfully!');
        if (data.config) setBonusConfig(data.config);
      } else {
        alert(data.message || 'Failed to save bonus config');
      }
    } catch (err) {
      alert('Network error saving bonus settings');
    } finally {
      setIsSavingBonus(false);
    }
  };

  useEffect(() => {
    loadDeposits(false);
    loadDepositMethods();
    loadBonusConfig();
  }, [statusFilter, searchQuery]);

  // Real-time automatic background polling every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDeposits(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [statusFilter, searchQuery]);

  const openActionModal = (deposit, action) => {
    setActiveModalItem(deposit);
    setModalAction(action);
    const suggestedCredit = deposit.total_credit_amount || deposit.received_amount || deposit.paid_amount || '';
    setCreditAmountInput(String(suggestedCredit));
    setNoteInput(
      action === 'approve'
        ? `Payment verified. Credited $${suggestedCredit} to wallet balance.`
        : 'Payment screenshot unverified or tag not found in account.'
    );
  };

  const closeActionModal = () => {
    setActiveModalItem(null);
    setCreditAmountInput('');
    setNoteInput('');
    setIsSubmitting(false);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    if (!activeModalItem || isSubmitting) return;

    if (modalAction === 'approve') {
      const amtNum = parseFloat(creditAmountInput);
      if (isNaN(amtNum) || amtNum < 0) {
        alert('Please enter a valid credit amount ($)');
        return;
      }
    }

    if (modalAction === 'reject' && !noteInput.trim()) {
      alert('Please provide a reason note explaining why this deposit is being rejected.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeModalItem.id,
          action: modalAction,
          approvedAmount: modalAction === 'approve' ? parseFloat(creditAmountInput) : undefined,
          note: noteInput.trim(),
          reason: noteInput.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message);
        closeActionModal();
        loadDeposits(true);
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      alert('Network error executing action');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Method upload file handler
  const handleMethodUpload = async (methodId, file) => {
    if (!file) return;
    setUploadingMethodId(methodId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'methods');

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        // Update local state
        setDepositMethods((prev) =>
          prev.map((m) => (m.id === methodId ? { ...m, qr_image: data.url } : m))
        );
        setActionNotice('Payment screenshot / QR uploaded! Click "Save Settings" to persist.');
      } else {
        alert(data.message || 'Upload failed');
      }
    } catch (err) {
      alert('Network error uploading image');
    } finally {
      setUploadingMethodId(null);
    }
  };

  // Method save handler
  const handleSaveMethod = async (method) => {
    setSavingMethodId(method.id);
    try {
      const res = await fetch('/api/admin/deposit-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(method),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(`${method.name} settings saved successfully!`);
        loadDepositMethods();
      } else {
        alert(data.message || 'Failed to save method settings');
      }
    } catch (err) {
      alert('Network error saving method');
    } finally {
      setSavingMethodId(null);
    }
  };

  const copyToClipboard = (text, id) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const pendingCount = deposits.filter((d) => d.status === 'Pending' || d.status === 'Created').length;
  const activeMethodsCount = depositMethods.filter((m) => m.is_active).length;

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto pt-16 lg:pt-6">
        {/* Title Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                <ArrowDownLeft className="w-6 h-6 text-[#FFCC00]" />
                <span>Wallet Deposits &amp; Manual Channels</span>
              </h1>
              {pendingCount > 0 && (
                <span className="bg-[#FFCC00] text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-full shadow-[0_0_12px_rgba(255,204,0,0.5)] animate-pulse">
                  {pendingCount} Pending
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Review player deposit screenshots, adjust wallet credit amounts on approval, or configure Chime &amp; PayPal payment links and instructions.
            </p>
          </div>

          <button
            onClick={() => {
              loadDeposits(false);
              loadDepositMethods();
            }}
            className="self-start sm:self-auto px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#FFCC00]" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Global Action Banner */}
        {actionNotice && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-semibold flex items-center justify-between shadow-lg">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice('')} className="text-emerald-400 font-bold hover:opacity-80">
              ×
            </button>
          </div>
        )}

        {/* Navigation Tabs between Requests and Manual Channels */}
        <div className="flex items-center gap-3 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'bg-[#FFCC00] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Deposit Requests</span>
            {pendingCount > 0 && (
              <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                activeTab === 'requests' ? 'bg-slate-950 text-[#FFCC00]' : 'bg-[#FFCC00] text-slate-950'
              }`}>
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('methods')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'methods'
                ? 'bg-[#FFCC00] text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white bg-white/5'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Manual Channels (Chime &amp; PayPal)</span>
            <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
              activeTab === 'methods' ? 'bg-slate-950 text-[#FFCC00]' : 'bg-white/10 text-slate-300'
            }`}>
              {activeMethodsCount} Active
            </span>
          </button>
        </div>

        {/* TAB 1: DEPOSIT REQUESTS */}
        {activeTab === 'requests' && (
          <div className="space-y-5">
            {/* Filters & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {['All', 'Pending', 'Created', 'Approved', 'Rejected', 'Expired'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                      statusFilter === status
                        ? 'bg-[#FFCC00] text-slate-950 font-black shadow-[0_2px_15px_rgba(255,204,0,0.3)]'
                        : 'bg-[#101117] text-slate-300 border border-white/10 hover:bg-white/5'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by order #, player, tag..."
                  className="w-full bg-[#101117] border border-white/10 text-white text-xs pl-9 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition"
                />
              </div>
            </div>

            {/* Deposits Table */}
            <div className="bg-[#101117] rounded-2xl border border-white/10 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-[#181922] text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-white/10">
                    <tr>
                      <th className="py-4 px-4">Order No</th>
                      <th className="py-4 px-4">Player</th>
                      <th className="py-4 px-4">Channel / Method</th>
                      <th className="py-4 px-4">Amount</th>
                      <th className="py-4 px-4">Player Tag / Username</th>
                      <th className="py-4 px-4">Payment Screenshot</th>
                      <th className="py-4 px-4">Status &amp; Reason</th>
                      <th className="py-4 px-4">Submitted At</th>
                      <th className="py-4 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {deposits.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="py-16 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="w-7 h-7 text-slate-600" />
                            <span className="font-semibold text-slate-400">
                              {isLoading ? 'Loading live deposits...' : 'No deposit requests found matching criteria.'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      deposits.map((d) => {
                        const isPending = d.status === 'Pending' || d.status === 'Created';
                        const isApproved = d.status === 'Approved';
                        const isRejected = d.status === 'Rejected';

                        return (
                          <tr key={d.id} className="hover:bg-white/[0.03] transition">
                            <td className="py-4 px-4 font-mono font-medium text-slate-200">
                              <span className="flex items-center gap-1.5">
                                <span>{d.order_no}</span>
                                <button
                                  type="button"
                                  onClick={() => copyToClipboard(d.order_no, d.id)}
                                  className="text-slate-500 hover:text-slate-300 transition"
                                  title="Copy order #"
                                >
                                  {copiedId === d.id ? (
                                    <Check className="w-3 h-3 text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </span>
                            </td>
                            <td className="py-4 px-4 font-bold text-white">
                              <span>{d.username}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-200 font-semibold text-[11px] inline-flex items-center gap-1">
                                {d.payment_method?.toLowerCase().includes('chime') ? '🏦' : d.payment_method?.toLowerCase().includes('paypal') ? '🅿️' : '💵'}
                                <span>{d.payment_method}</span>
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono">
                              <div className="font-black text-[#FFCC00] text-sm">
                                ${Number(d.paid_amount || 0).toFixed(2)}
                              </div>
                              {d.bonus_percentage ? (
                                <div className="mt-1">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400/20 text-[#FFCC00] border border-[#FFCC00]/30">
                                    <Gift className="w-2.5 h-2.5" /> +{d.bonus_percentage}% ({d.bonus_type === 'first_deposit' ? '1st Bonus' : 'Reload'})
                                  </span>
                                  <div className="text-[10px] font-bold text-emerald-400 mt-0.5">
                                    Total: ${Number(d.total_credit_amount || d.received_amount || d.paid_amount || 0).toFixed(2)}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-400">
                                  Credited: ${Number(d.received_amount || d.paid_amount || 0).toFixed(2)}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4 font-mono text-slate-200">
                              <div className="space-y-1">
                                {d.sender_tag || d.transaction_proof ? (
                                  <span className="bg-[#181922] px-2.5 py-1 rounded-lg border border-white/10 font-bold text-amber-300 block w-fit">
                                    {d.sender_tag || d.transaction_proof}
                                  </span>
                                ) : (
                                  <span className="text-slate-500 italic block">None</span>
                                )}
                                {d.sender_email && (
                                  <span className="text-[10px] text-slate-300 block truncate max-w-[140px]" title={d.sender_email}>
                                    ✉️ {d.sender_email}
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* Payment Screenshot Thumbnail Column */}
                            <td className="py-4 px-4">
                              {d.proof_image ? (
                                <button
                                  type="button"
                                  onClick={() => setPreviewScreenshot(d.proof_image)}
                                  className="group relative flex items-center gap-1.5 p-1 bg-[#181922] rounded-lg border border-white/15 hover:border-[#FFCC00] transition overflow-hidden"
                                  title="Click to view full screenshot"
                                >
                                  <img
                                    src={d.proof_image}
                                    alt="Payment Proof"
                                    className="w-12 h-12 object-cover rounded-md"
                                  />
                                  <div className="flex flex-col text-left pr-2">
                                    <span className="text-[10px] font-bold text-slate-300 group-hover:text-[#FFCC00] flex items-center gap-1">
                                      <Eye className="w-3 h-3" /> View
                                    </span>
                                    <span className="text-[9px] text-slate-500">Screenshot</span>
                                  </div>
                                </button>
                              ) : (
                                <span className="text-slate-500 text-[11px] italic">No image</span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 text-slate-950 ${
                                  isApproved
                                    ? 'bg-emerald-400'
                                    : isRejected
                                    ? 'bg-rose-500 text-white'
                                    : isPending
                                    ? 'bg-[#FFCC00]'
                                    : 'bg-slate-700 text-white'
                                }`}
                              >
                                {isPending && <Clock className="w-3 h-3" />}
                                {isApproved && <CheckCircle2 className="w-3 h-3" />}
                                <span>{d.status}</span>
                              </span>
                              {(d.failure_reason || d.admin_notes) && (
                                <div className="mt-1 text-[10px] text-slate-400 max-w-[180px] truncate" title={d.failure_reason || d.admin_notes}>
                                  {d.failure_reason ? `Reason: ${d.failure_reason}` : `Note: ${d.admin_notes}`}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-4 font-mono text-slate-400 text-[11px]">
                              {d.created_at ? new Date(d.created_at).toLocaleString() : ''}
                            </td>
                            <td className="py-4 px-4 text-right">
                              {isPending ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => openActionModal(d, 'approve')}
                                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-lg transition flex items-center gap-1 shadow-sm"
                                  >
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    onClick={() => openActionModal(d, 'reject')}
                                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-lg transition flex items-center gap-1"
                                  >
                                    <XCircle className="w-3.5 h-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-500 font-semibold">Processed</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: MANUAL DEPOSIT CHANNELS (CHIME & PAYPAL) */}
        {activeTab === 'methods' && (
          <div className="space-y-6">
            <div className="bg-[#101117] rounded-2xl border border-white/10 p-5 space-y-2">
              <h2 className="text-base font-black text-white uppercase flex items-center gap-2">
                <Sliders className="w-5 h-5 text-[#FFCC00]" />
                <span>Configure Chime &amp; PayPal Payment Channels</span>
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Provide your custom payment link (URL) and payment instructions or QR / cashtag screenshot. Players will click your link to transfer funds, and then submit their payment screenshot and username tag for manual approval.
              </p>
            </div>

            {/* Deposit Bonus Match System Settings Card */}
            <div className="bg-[#101117] rounded-2xl border border-amber-500/30 p-6 space-y-4 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-white/10 gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-[#FFCC00] flex items-center justify-center">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-white text-base tracking-tight flex items-center gap-2">
                      <span>Deposit Bonus Match Configuration</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-[#FFCC00] font-bold">
                        Auto Calculator
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Set bonus match rates. User requests will automatically include calculated bonus coins for admin review.
                    </p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer self-start sm:self-auto bg-white/5 px-3 py-1.5 rounded-xl border border-white/10">
                  <span className="text-xs font-bold text-slate-300">
                    {bonusConfig.is_active ? 'Bonus Active' : 'Bonus Disabled'}
                  </span>
                  <input
                    type="checkbox"
                    checked={bonusConfig.is_active}
                    onChange={(e) => setBonusConfig((prev) => ({ ...prev, is_active: e.target.checked }))}
                    className="w-4 h-4 accent-[#FFCC00] rounded cursor-pointer"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#181922] p-4 rounded-xl border border-white/10 space-y-2">
                  <label className="block text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-[#FFCC00]" />
                    <span>First Deposit Bonus Match (%)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={bonusConfig.first_deposit_bonus_percentage}
                      onChange={(e) => setBonusConfig((prev) => ({ ...prev, first_deposit_bonus_percentage: Number(e.target.value) }))}
                      className="w-full bg-[#07080b] border border-white/10 text-white font-mono font-black text-base px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00]"
                      placeholder="300"
                    />
                    <span className="absolute right-3.5 text-slate-400 font-bold text-sm">%</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    E.g. 300% bonus turns $50 into $200 total coins. Automatically applied on player&apos;s 1st approved deposit.
                  </p>
                </div>

                <div className="bg-[#181922] p-4 rounded-xl border border-white/10 space-y-2">
                  <label className="block text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-[#FFCC00]" />
                    <span>Regular Reload Bonus Match (%)</span>
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={bonusConfig.regular_deposit_bonus_percentage}
                      onChange={(e) => setBonusConfig((prev) => ({ ...prev, regular_deposit_bonus_percentage: Number(e.target.value) }))}
                      className="w-full bg-[#07080b] border border-white/10 text-white font-mono font-black text-base px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00]"
                      placeholder="50"
                    />
                    <span className="absolute right-3.5 text-slate-400 font-bold text-sm">%</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    E.g. 50% bonus turns $50 into $75 total coins. Automatically applied on subsequent deposits.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleSaveBonusConfig}
                  disabled={isSavingBonus}
                  className="px-6 py-2.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingBonus ? 'Saving...' : 'Save Bonus Settings'}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {depositMethods.map((method) => {
                const isSaving = savingMethodId === method.id;
                const isUploading = uploadingMethodId === method.id;

                return (
                  <div
                    key={method.id}
                    className="bg-[#101117] border border-white/10 rounded-2xl p-6 space-y-5 shadow-xl relative"
                  >
                    {/* Header: Name and Active Toggle */}
                    <div className="flex items-center justify-between pb-3 border-b border-white/10">
                      <div className="flex items-center gap-2.5">
                        <span className="text-2xl">
                          {method.name.toLowerCase().includes('chime') ? '🏦' : method.name.toLowerCase().includes('paypal') ? '🅿️' : '💳'}
                        </span>
                        <div>
                          <h3 className="font-black text-white text-base tracking-tight">{method.name}</h3>
                          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Manual Channel</span>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs font-bold text-slate-300">
                          {method.is_active ? 'Active' : 'Disabled'}
                        </span>
                        <input
                          type="checkbox"
                          checked={method.is_active}
                          onChange={(e) => {
                            const updated = { ...method, is_active: e.target.checked };
                            setDepositMethods((prev) =>
                              prev.map((m) => (m.id === method.id ? updated : m))
                            );
                          }}
                          className="w-4 h-4 accent-[#FFCC00] rounded cursor-pointer"
                        />
                      </label>
                    </div>

                    {/* Payment Link (URL) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <span>Payment Link / URL *</span>
                          <span className="text-[10px] text-slate-500 font-normal">(User clicks this to pay)</span>
                        </label>
                        {method.pay_url && (
                          <a
                            href={method.pay_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] text-[#FFCC00] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <span>Test Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      <input
                        type="url"
                        value={method.pay_url || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDepositMethods((prev) =>
                            prev.map((m) => (m.id === method.id ? { ...m, pay_url: val } : m))
                          );
                        }}
                        placeholder={method.name.toLowerCase().includes('chime') ? 'https://chime.com/... or https://member.chime.com/pay/...' : 'https://paypal.me/yourusername'}
                        className="w-full bg-[#181922] border border-white/10 text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition font-mono"
                      />
                    </div>

                    {/* Admin Tag / Handle */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Account Tag / Sign / Email
                      </label>
                      <input
                        type="text"
                        value={method.account_tag || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDepositMethods((prev) =>
                            prev.map((m) => (m.id === method.id ? { ...m, account_tag: val } : m))
                          );
                        }}
                        placeholder={method.name.toLowerCase().includes('chime') ? '$ChimeTag' : 'paypal@domain.com'}
                        className="w-full bg-[#181922] border border-white/10 text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition"
                      />
                    </div>

                    {/* Screenshot / QR Code Upload */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Payment QR Code or Instruction Screenshot
                      </label>
                      <div className="flex items-center gap-3">
                        {method.qr_image ? (
                          <div className="relative group shrink-0">
                            <img
                              src={method.qr_image}
                              alt="QR Code"
                              className="w-16 h-16 object-cover rounded-xl border border-white/20 bg-[#181922]"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setDepositMethods((prev) =>
                                  prev.map((m) => (m.id === method.id ? { ...m, qr_image: '' } : m))
                                );
                              }}
                              className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white p-0.5 rounded-full hover:bg-rose-700"
                              title="Remove image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-xl border border-dashed border-white/20 bg-[#181922] flex items-center justify-center shrink-0 text-slate-500">
                            <ImageIcon className="w-6 h-6" />
                          </div>
                        )}

                        <div className="flex-1 space-y-2">
                          <label className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-bold rounded-xl cursor-pointer transition border border-white/10">
                            <Upload className="w-3.5 h-3.5 text-[#FFCC00]" />
                            <span>{isUploading ? 'Uploading...' : 'Upload Image File'}</span>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isUploading}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleMethodUpload(method.id, f);
                              }}
                              className="hidden"
                            />
                          </label>
                          <input
                            type="text"
                            value={method.qr_image || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setDepositMethods((prev) =>
                                prev.map((m) => (m.id === method.id ? { ...m, qr_image: val } : m))
                              );
                            }}
                            placeholder="Or enter image URL (/uploads/... or https://)"
                            className="w-full bg-[#181922] border border-white/10 text-white text-[11px] px-3 py-1.5 rounded-lg focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Deposit Instructions for Player */}
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Instructions Displayed to Player
                      </label>
                      <textarea
                        rows={2}
                        value={method.instructions || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setDepositMethods((prev) =>
                            prev.map((m) => (m.id === method.id ? { ...m, instructions: val } : m))
                          );
                        }}
                        placeholder="e.g. Send payment via Chime, then upload payment confirmation screenshot with your username."
                        className="w-full bg-[#181922] border border-white/10 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition resize-none"
                      />
                    </div>

                    {/* Min & Max Deposit */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Min Deposit ($)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={method.min_deposit ?? 2}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDepositMethods((prev) =>
                              prev.map((m) => (m.id === method.id ? { ...m, min_deposit: val } : m))
                            );
                          }}
                          className="w-full bg-[#181922] border border-white/10 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[#FFCC00]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Max Deposit ($)
                        </label>
                        <input
                          type="number"
                          step="any"
                          value={method.max_deposit ?? 1000}
                          onChange={(e) => {
                            const val = e.target.value;
                            setDepositMethods((prev) =>
                              prev.map((m) => (m.id === method.id ? { ...m, max_deposit: val } : m))
                            );
                          }}
                          className="w-full bg-[#181922] border border-white/10 text-white text-xs px-3 py-2 rounded-xl focus:outline-none focus:border-[#FFCC00]"
                        />
                      </div>
                    </div>

                    {/* Save Button */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => handleSaveMethod(method)}
                        disabled={isSaving}
                        className="w-full py-2.5 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-[0_2px_15px_rgba(255,204,0,0.2)] disabled:opacity-50"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? 'Saving...' : `Save ${method.name} Settings`}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modal for Approve with Editable Credit Amount & Note */}
        {activeModalItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
            <div className="bg-[#101117] border border-white/15 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#FFCC00]" />
                  <h3 className="font-black text-white text-sm uppercase">
                    {modalAction === 'approve' ? 'Approve Deposit & Credit Wallet' : 'Reject Deposit & Add Reason'}
                  </h3>
                </div>
                <button
                  onClick={closeActionModal}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Order Info Card */}
              <div className="bg-[#181922] p-4 rounded-2xl border border-white/10 text-xs space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Order Number:</span>
                  <span className="font-mono font-bold text-white">{activeModalItem.order_no}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Player:</span>
                  <span className="font-bold text-white">{activeModalItem.username}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Payment Channel:</span>
                  <span className="font-bold text-amber-300">{activeModalItem.payment_method}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Player Tag / Sign:</span>
                  <span className="font-mono font-bold text-amber-300 bg-black/40 px-2 py-0.5 rounded">
                    {activeModalItem.sender_tag || activeModalItem.transaction_proof || 'N/A'}
                  </span>
                </div>
                {activeModalItem.sender_email && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Player Tag Email:</span>
                    <span className="font-mono font-bold text-slate-200">
                      {activeModalItem.sender_email}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-white/10">
                  <span className="text-slate-400">Player Paid Amount:</span>
                  <span className="font-black text-white font-mono text-sm">${Number(activeModalItem.paid_amount || 0).toFixed(2)} USD</span>
                </div>
              </div>

              {/* Bonus Match Calculation Breakdown */}
              {activeModalItem.bonus_percentage ? (
                <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center justify-between font-bold text-amber-300">
                    <span className="flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-[#FFCC00]" />
                      <span>{activeModalItem.bonus_type === 'first_deposit' ? 'First Deposit Bonus Match' : 'Regular Reload Bonus Match'}</span>
                    </span>
                    <span className="px-2 py-0.5 bg-[#FFCC00] text-slate-950 font-black rounded text-[11px]">
                      +{activeModalItem.bonus_percentage}%
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
                    <div className="bg-[#181922] p-2 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-400">Paid</div>
                      <div className="font-bold text-white text-xs">${Number(activeModalItem.paid_amount || 0).toFixed(2)}</div>
                    </div>
                    <div className="bg-[#181922] p-2 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-400">Bonus</div>
                      <div className="font-bold text-[#FFCC00] text-xs">+${Number(activeModalItem.bonus_amount || 0).toFixed(2)}</div>
                    </div>
                    <div className="bg-[#181922] p-2 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-400">Total Credits</div>
                      <div className="font-black text-emerald-400 text-xs">
                        ${Number(activeModalItem.total_credit_amount || activeModalItem.paid_amount || 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {/* Payment Screenshot Proof in Modal */}
              {activeModalItem.proof_image && (
                <div className="p-3 bg-[#181922] rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-[#FFCC00]" />
                      <span>Payment Screenshot Submitted by Player:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewScreenshot(activeModalItem.proof_image)}
                      className="text-[#FFCC00] hover:underline text-[11px] font-semibold flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> Full View
                    </button>
                  </div>
                  <div
                    onClick={() => setPreviewScreenshot(activeModalItem.proof_image)}
                    className="max-h-48 overflow-hidden rounded-xl border border-white/10 cursor-pointer group relative bg-black/40 flex items-center justify-center"
                  >
                    <img
                      src={activeModalItem.proof_image}
                      alt="Player Payment Proof"
                      className="w-full object-contain max-h-48 group-hover:scale-105 transition duration-200"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs font-bold text-white gap-1.5">
                      <Eye className="w-4 h-4" /> Click to enlarge
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleModalSubmit} className="space-y-4">
                {modalAction === 'approve' ? (
                  <>
                    {/* REQUIREMENT: Editable Amount to credit to user's wallet! */}
                    <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-1.5">
                      <label className="block text-xs font-black text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-emerald-400" />
                        <span>Amount to Credit in Player Wallet ($):</span>
                      </label>
                      <div className="relative flex items-center">
                        <span className="absolute left-3 text-emerald-400 font-black text-sm">$</span>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          required
                          value={creditAmountInput}
                          onChange={(e) => setCreditAmountInput(e.target.value)}
                          className="w-full bg-[#07080b] border border-emerald-500/50 text-white font-mono font-black text-base pl-7 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-emerald-400"
                          placeholder="e.g. 50.00"
                        />
                      </div>
                      <p className="text-[11px] text-emerald-400/80">
                        Pre-filled with player deposit amount. You can edit this amount before approving (e.g. to include bonus or match actual received amount). Player balance will be updated instantly by this exact amount.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5">
                        Approval Note for Player (Visible in player records):
                      </label>
                      <textarea
                        rows={2}
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        placeholder="e.g. Payment verified via Chime"
                        className="w-full bg-[#07080b] border border-white/10 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition resize-none"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-rose-300 mb-1.5 flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-400" />
                      <span>Rejection Reason (Required - Player will see this note):</span>
                    </label>
                    <textarea
                      rows={3}
                      value={noteInput}
                      onChange={(e) => setNoteInput(e.target.value)}
                      required
                      placeholder="e.g. Payment screenshot unverified, fake cashtag, or payment not received in account."
                      className="w-full bg-[#07080b] border border-rose-500/40 text-white text-xs p-3 rounded-xl focus:outline-none focus:border-rose-400 placeholder-slate-500 transition resize-none"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Explain clearly why the deposit is rejected so the player knows what went wrong.
                    </p>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={closeActionModal}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-3 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg ${
                      modalAction === 'approve'
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-slate-950'
                        : 'bg-rose-600 hover:bg-rose-700 text-white'
                    }`}
                  >
                    {isSubmitting ? (
                      <span>Processing...</span>
                    ) : modalAction === 'approve' ? (
                      <span>Confirm &amp; Credit ${Number(creditAmountInput || 0).toFixed(2)}</span>
                    ) : (
                      <span>Confirm Rejection</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Screenshot Lightbox / Fullscreen Viewer */}
        {previewScreenshot && (
          <div
            onClick={() => setPreviewScreenshot(null)}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150 cursor-pointer"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#101117] border border-white/20 rounded-3xl p-4 max-w-3xl w-full max-h-[90vh] flex flex-col space-y-3 shadow-2xl cursor-default"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#FFCC00]" />
                  <span>Payment Proof Screenshot Preview</span>
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={previewScreenshot}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-[#FFCC00] hover:underline flex items-center gap-1 px-2.5 py-1 bg-white/5 rounded-lg border border-white/10"
                  >
                    <span>Open Original</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setPreviewScreenshot(null)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto flex items-center justify-center p-2 bg-black/50 rounded-2xl min-h-[300px]">
                <img
                  src={previewScreenshot}
                  alt="Full Screenshot"
                  className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-lg"
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
