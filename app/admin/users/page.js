'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminSidebar from '@/components/AdminSidebar';
import {
  Users,
  Search,
  DollarSign,
  ShieldCheck,
  MessageSquare,
  Ban,
  CheckCircle2,
  AlertCircle,
  X,
  Edit,
  RefreshCw,
  Download,
  Eye,
  ExternalLink,
  Clock,
  FileText,
  Camera
} from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');

  // Balance Adjustment Modal State
  const [balanceModalUser, setBalanceModalUser] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('50');
  const [adjustType, setAdjustType] = useState('add');
  const [adjustReason, setAdjustReason] = useState('VIP Reload Bonus');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // KYC Review & Download Modal State
  const [kycModalUser, setKycModalUser] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessingKyc, setIsProcessingKyc] = useState(false);
  const [zoomImage, setZoomImage] = useState(null);

  const loadUsers = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const url = `/api/admin/users?q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {} finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(false);
  }, [searchQuery]);

  // Real-time automatic background polling every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadUsers(true);
    }, 4000);
    return () => clearInterval(interval);
  }, [searchQuery]);

  const handleAdjustBalanceSubmit = async (e) => {
    e.preventDefault();
    if (!balanceModalUser || isSubmittingAdjust) return;

    setIsSubmittingAdjust(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_balance',
          userId: balanceModalUser.id,
          amount: parseFloat(adjustAmount),
          type: adjustType,
          reason: adjustReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message);
        setBalanceModalUser(null);
        loadUsers(true);
      } else {
        alert(data.message || 'Balance adjustment failed');
      }
    } catch (err) {
      alert('Error updating user balance');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.account_status === 'Active' ? 'Suspended' : 'Active';
    if (!confirm(`Are you sure you want to mark ${user.username} as ${nextStatus}?`)) return;

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_status',
          userId: user.id,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message);
        loadUsers(true);
      }
    } catch (err) {}
  };

  const handleKycAction = async (action) => {
    if (!kycModalUser || isProcessingKyc) return;
    if (action === 'reject_kyc' && !rejectionReason.trim()) {
      alert('Please provide a reason for rejecting the KYC verification.');
      return;
    }

    setIsProcessingKyc(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userId: kycModalUser.id,
          reason: rejectionReason.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message);
        setKycModalUser(null);
        setRejectionReason('');
        loadUsers(true);
      } else {
        alert(data.message || 'KYC update failed');
      }
    } catch (err) {
      alert('Error updating user KYC status');
    } finally {
      setIsProcessingKyc(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto pt-16 lg:pt-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Users className="w-6 h-6 text-[#FFCC00]" />
              <span>Player Management Directory</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Search players by username or email, adjust balances, verify KYC, or initiate 1-on-1 WhatsApp chat.
            </p>
          </div>

          <button
            onClick={() => loadUsers(false)}
            className="self-start sm:self-auto px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-slate-300 hover:text-white flex items-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#FFCC00]" />
            <span>Refresh</span>
          </button>
        </div>

        {actionNotice && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between shadow-lg">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice('')} className="text-emerald-400 font-bold hover:text-emerald-200">×</button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-[#101117] border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-lg">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username, email, or phone..."
              className="w-full bg-[#07080b] border border-white/10 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition"
            />
          </div>
          <span className="text-xs text-slate-400 font-bold hidden sm:block">
            {users.length} Registered Players
          </span>
        </div>

        {/* Users Table */}
        <div className="bg-[#101117] border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181922] text-slate-300 uppercase tracking-wider font-bold text-[11px] border-b border-white/10">
                <tr>
                  <th className="px-5 py-4">User</th>
                  <th className="px-5 py-4">Email &amp; Phone</th>
                  <th className="px-5 py-4">Wallet Balance</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">KYC Status</th>
                  <th className="px-5 py-4">Subscribed</th>
                  <th className="px-5 py-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-slate-500">
                      {isLoading ? 'Loading players...' : 'No players match your search.'}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.03] transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{u.username}</div>
                        <span className="text-[10px] text-slate-500 font-mono">ID: #{u.id} • Ref: {u.invite_code}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-slate-300 font-mono">{u.email}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">{u.phone || 'No phone'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-black text-[#FFCC00] text-sm">
                          ${u.wallet_balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            u.account_status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {u.account_status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        {u.kyc_status === 'PENDING' ? (
                          <button
                            onClick={() => {
                              setKycModalUser(u);
                              setRejectionReason(u.kyc_rejection_reason || '');
                            }}
                            className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition flex items-center gap-1.5 animate-pulse shadow-sm shadow-amber-500/10"
                            title="Click to review submitted KYC documents"
                          >
                            <Clock className="w-3 h-3" />
                            <span>REVIEW KYC</span>
                          </button>
                        ) : u.kyc_status === 'VERIFIED' ? (
                          <button
                            onClick={() => {
                              setKycModalUser(u);
                              setRejectionReason('');
                            }}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition flex items-center gap-1"
                            title="KYC Verified - Click to view documents"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>VERIFIED</span>
                          </button>
                        ) : u.kyc_status === 'REJECTED' ? (
                          <button
                            onClick={() => {
                              setKycModalUser(u);
                              setRejectionReason(u.kyc_rejection_reason || '');
                            }}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition flex items-center gap-1"
                            title="KYC Rejected - Click to view details"
                          >
                            <AlertCircle className="w-3 h-3" />
                            <span>REJECTED</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setKycModalUser(u);
                              setRejectionReason('');
                            }}
                            className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase bg-white/5 text-slate-400 border border-white/10 hover:border-white/20 hover:text-white transition"
                            title="Click to view details or manage KYC"
                          >
                            INCOMPLETE
                          </button>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          u.is_subscribed ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'bg-white/5 text-slate-500'
                        }`}>
                          {u.is_subscribed ? 'Subscribed' : 'Unsubscribed'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* KYC Review & Download Button */}
                          <button
                            onClick={() => {
                              setKycModalUser(u);
                              setRejectionReason(u.kyc_rejection_reason || '');
                            }}
                            className={`p-2 rounded-xl border border-white/10 transition shadow-sm ${
                              u.kyc_status === 'PENDING'
                                ? 'bg-amber-500 text-slate-950 hover:bg-yellow-400 font-bold'
                                : 'bg-white/5 hover:bg-[#FFCC00] hover:text-slate-950 text-[#FFCC00]'
                            }`}
                            title="Review KYC & Download ID Images"
                          >
                            <ShieldCheck className="w-4 h-4" />
                          </button>

                          {/* Adjust Balance */}
                          <button
                            onClick={() => setBalanceModalUser(u)}
                            className="p-2 bg-white/5 hover:bg-[#FFCC00] hover:text-slate-950 rounded-xl text-[#FFCC00] border border-white/10 transition shadow-sm"
                            title="Adjust Balance"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>

                          {/* Message User via Admin Chat */}
                          <Link
                            href={`/admin/chat?userId=${u.id}`}
                            className="p-2 bg-white/5 hover:bg-emerald-500 hover:text-slate-950 rounded-xl text-emerald-400 border border-white/10 transition shadow-sm"
                            title="Message User on WhatsApp Desk"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Link>

                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-2 rounded-xl border border-white/10 transition shadow-sm ${
                              u.account_status === 'Active'
                                ? 'bg-white/5 hover:bg-rose-600 text-rose-400 hover:text-white'
                                : 'bg-emerald-500/20 hover:bg-emerald-600 text-emerald-300 hover:text-white'
                            }`}
                            title={u.account_status === 'Active' ? 'Suspend Account' : 'Reactivate Account'}
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Adjust Balance Modal */}
      {balanceModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#101117] border border-white/10 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-[#FFCC00]" />
                <span>Adjust Balance: {balanceModalUser.username}</span>
              </h3>
              <button onClick={() => setBalanceModalUser(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustBalanceSubmit} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-[#181922] border border-white/5 rounded-xl flex items-center justify-between">
                <span className="text-slate-400 font-medium">Current Balance:</span>
                <span className="font-mono font-bold text-[#FFCC00] text-sm">
                  ${balanceModalUser.wallet_balance.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-2">Adjustment Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-2 rounded-xl font-black text-xs transition ${
                      adjustType === 'add' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    + Add Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('deduct')}
                    className={`py-2 rounded-xl font-black text-xs transition ${
                      adjustType === 'deduct' ? 'bg-rose-600 text-white shadow-md' : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    - Deduct Funds
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full bg-[#07080b] border border-white/10 text-white font-mono text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00]"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase mb-1">Audit Reason</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-[#07080b] border border-white/10 text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00]"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalUser(null)}
                  className="flex-1 py-3 bg-white/5 text-slate-300 hover:text-white rounded-xl text-xs font-bold uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="flex-1 bg-[#FFCC00] hover:bg-yellow-300 py-3 rounded-xl text-xs font-black uppercase text-slate-950 transition shadow-lg shadow-yellow-500/20"
                >
                  {isSubmittingAdjust ? 'Updating...' : 'Confirm Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KYC Review & Download Modal */}
      {kycModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-[#101117] border border-white/10 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FFCC00]/15 text-[#FFCC00] flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight">
                    KYC Compliance Review: {kycModalUser.username}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Inspect submitted government identity documents, save images, and update approval status.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setKycModalUser(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Identity Details Card */}
            <div className="bg-[#181922] border border-white/10 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-bold mb-0.5">Legal Name</span>
                <span className="text-white font-bold text-sm">{kycModalUser.kyc_name || 'Not provided'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-bold mb-0.5">Document Type</span>
                <span className="text-white font-semibold">{kycModalUser.kyc_id_type || 'Driver License'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-bold mb-0.5">ID Number</span>
                <span className="text-[#FFCC00] font-mono font-bold">{kycModalUser.kyc_id_number || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-bold mb-0.5">Current Status</span>
                <span
                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    kycModalUser.kyc_status === 'VERIFIED'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : kycModalUser.kyc_status === 'PENDING'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {kycModalUser.kyc_status}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-bold mb-0.5">Date of Birth</span>
                <span className="text-slate-300 font-mono">{kycModalUser.kyc_dob || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-bold mb-0.5">Email</span>
                <span className="text-slate-300 font-mono truncate block">{kycModalUser.email}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-bold mb-0.5">Phone</span>
                <span className="text-slate-300 font-mono">{kycModalUser.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase font-bold mb-0.5">Submitted On</span>
                <span className="text-slate-300 font-mono text-[11px]">
                  {kycModalUser.kyc_submitted_at ? new Date(kycModalUser.kyc_submitted_at).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            {/* Document Images Grid (Front, Back, Selfie) */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Submitted Identification Images</span>
                <span className="text-[11px] text-slate-500 font-normal">Click any image to zoom &amp; inspect</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* ID Front */}
                <div className="bg-[#181922] border border-white/10 rounded-2xl p-3 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 uppercase block mb-2">ID Document Front</span>
                    {kycModalUser.kyc_front_image ? (
                      <div
                        onClick={() => setZoomImage({ url: kycModalUser.kyc_front_image, title: `${kycModalUser.username} - Front ID` })}
                        className="relative w-full h-36 rounded-xl overflow-hidden border border-white/10 cursor-pointer group bg-black/40"
                      >
                        <img
                          src={kycModalUser.kyc_front_image}
                          alt="Front ID"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-xs font-bold transition">
                          <Eye className="w-4 h-4 text-[#FFCC00]" />
                          <span>Click to Zoom</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-36 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 text-xs">
                        <FileText className="w-6 h-6 mb-1 text-slate-600" />
                        <span>No Front Image</span>
                      </div>
                    )}
                  </div>

                  {kycModalUser.kyc_front_image && (
                    <a
                      href={kycModalUser.kyc_front_image}
                      download={`kyc-front-${kycModalUser.username}.jpg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 bg-[#FFCC00]/15 hover:bg-[#FFCC00] text-[#FFCC00] hover:text-slate-950 border border-[#FFCC00]/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download / Save</span>
                    </a>
                  )}
                </div>

                {/* ID Back */}
                <div className="bg-[#181922] border border-white/10 rounded-2xl p-3 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 uppercase block mb-2">ID Document Back</span>
                    {kycModalUser.kyc_back_image ? (
                      <div
                        onClick={() => setZoomImage({ url: kycModalUser.kyc_back_image, title: `${kycModalUser.username} - Back ID` })}
                        className="relative w-full h-36 rounded-xl overflow-hidden border border-white/10 cursor-pointer group bg-black/40"
                      >
                        <img
                          src={kycModalUser.kyc_back_image}
                          alt="Back ID"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-xs font-bold transition">
                          <Eye className="w-4 h-4 text-[#FFCC00]" />
                          <span>Click to Zoom</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-36 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 text-xs">
                        <FileText className="w-6 h-6 mb-1 text-slate-600" />
                        <span>No Back Image</span>
                      </div>
                    )}
                  </div>

                  {kycModalUser.kyc_back_image && (
                    <a
                      href={kycModalUser.kyc_back_image}
                      download={`kyc-back-${kycModalUser.username}.jpg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 bg-[#FFCC00]/15 hover:bg-[#FFCC00] text-[#FFCC00] hover:text-slate-950 border border-[#FFCC00]/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download / Save</span>
                    </a>
                  )}
                </div>

                {/* Selfie with ID */}
                <div className="bg-[#181922] border border-white/10 rounded-2xl p-3 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 uppercase block mb-2">Selfie Photo</span>
                    {kycModalUser.kyc_selfie_image ? (
                      <div
                        onClick={() => setZoomImage({ url: kycModalUser.kyc_selfie_image, title: `${kycModalUser.username} - Selfie` })}
                        className="relative w-full h-36 rounded-xl overflow-hidden border border-white/10 cursor-pointer group bg-black/40"
                      >
                        <img
                          src={kycModalUser.kyc_selfie_image}
                          alt="Selfie"
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1 text-white text-xs font-bold transition">
                          <Eye className="w-4 h-4 text-[#FFCC00]" />
                          <span>Click to Zoom</span>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-36 rounded-xl border border-dashed border-white/10 flex flex-col items-center justify-center text-slate-500 text-xs">
                        <Camera className="w-6 h-6 mb-1 text-slate-600" />
                        <span>No Selfie Image</span>
                      </div>
                    )}
                  </div>

                  {kycModalUser.kyc_selfie_image && (
                    <a
                      href={kycModalUser.kyc_selfie_image}
                      download={`kyc-selfie-${kycModalUser.username}.jpg`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 bg-[#FFCC00]/15 hover:bg-[#FFCC00] text-[#FFCC00] hover:text-slate-950 border border-[#FFCC00]/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download / Save</span>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Rejection / Note Input */}
            <div>
              <label className="block text-slate-300 font-bold uppercase text-xs mb-1.5">
                Admin Compliance Feedback / Rejection Reason (Visible to Player)
              </label>
              <input
                type="text"
                placeholder="e.g. ID photo is blurry, document expired, or name does not match profile"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full bg-[#07080b] border border-white/10 text-white text-xs px-4 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00]"
              />
            </div>

            {/* Admin Decision Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => handleKycAction('reset_kyc')}
                disabled={isProcessingKyc}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-xl text-xs font-bold transition"
              >
                Reset to Incomplete
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setKycModalUser(null)}
                  className="px-4 py-2.5 text-slate-400 hover:text-white text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleKycAction('reject_kyc')}
                  disabled={isProcessingKyc}
                  className="px-5 py-2.5 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl text-xs font-black transition flex items-center gap-1.5"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Reject KYC</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleKycAction('approve_kyc')}
                  disabled={isProcessingKyc}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition shadow-lg shadow-emerald-500/20 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isProcessingKyc ? 'Updating...' : 'Approve & Verify KYC'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Lightbox Modal */}
      {zoomImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="max-w-4xl max-h-[90vh] flex flex-col items-center justify-center relative space-y-4">
            <button
              onClick={() => setZoomImage(null)}
              className="absolute -top-10 right-0 text-slate-300 hover:text-white bg-white/10 p-2 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={zoomImage.url}
              alt={zoomImage.title}
              className="max-h-[75vh] w-auto max-w-full rounded-2xl border border-white/20 shadow-2xl object-contain bg-black"
            />
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-white">{zoomImage.title}</span>
              <a
                href={zoomImage.url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="py-2 px-4 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>Save / Download Image</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
