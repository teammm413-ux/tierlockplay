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
  RefreshCw
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

  const handleVerifyKyc = async (user) => {
    const nextKyc = user.kyc_status === 'VERIFIED' ? 'INCOMPLETE' : 'VERIFIED';
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_kyc',
          userId: user.id,
          kyc_status: nextKyc,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message);
        loadUsers(true);
      }
    } catch (err) {}
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
                        <button
                          onClick={() => handleVerifyKyc(u)}
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase transition ${
                            u.kyc_status === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30'
                          }`}
                          title="Click to toggle KYC status"
                        >
                          {u.kyc_status}
                        </button>
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
    </div>
  );
}
