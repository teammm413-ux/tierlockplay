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
  Edit
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

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const url = `/api/admin/users?q=${encodeURIComponent(searchQuery)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
      }
    } catch (err) {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [searchQuery]);

  const handleAdjustBalanceSubmit = async (e) => {
    e.preventDefault();
    if (!balanceModalUser) return;

    setIsSubmittingAdjust(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'adjust_balance',
          userId: balanceModalUser.id,
          amount: parseFloat(adjustAmount),
          adjustmentType: adjustType,
          reason: adjustReason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActionNotice(data.message);
        setBalanceModalUser(null);
        loadUsers();
      }
    } catch (err) {
      setActionNotice('Error adjusting balance');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const handleToggleStatus = async (user) => {
    const nextStatus = user.account_status === 'Active' ? 'Suspended' : 'Active';
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
        loadUsers();
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
        loadUsers();
      }
    } catch (err) {}
  };

  return (
    <div className="min-h-screen bg-[#06080e] text-white flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
          <div>
            <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-6 h-6 text-amber-400" />
              <span>Player Management Directory</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1">
              Search players by username or email, adjust balances, verify KYC, or initiate 1-on-1 WhatsApp chat.
            </p>
          </div>
        </div>

        {actionNotice && (
          <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
            <span>{actionNotice}</span>
            <button onClick={() => setActionNotice('')} className="text-emerald-400 font-bold">×</button>
          </div>
        )}

        {/* Search Bar */}
        <div className="bg-[#0e131d] border border-gray-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by username, email, or phone..."
              className="w-full bg-[#161d2c] border border-gray-800 text-white text-xs pl-10 pr-4 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
            />
          </div>
          <span className="text-xs text-gray-400 hidden sm:block">
            {users.length} Registered Players
          </span>
        </div>

        {/* Users Table */}
        <div className="bg-[#0e131d] border border-gray-800 rounded-2xl overflow-hidden shadow">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141b27] text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-800">
                <tr>
                  <th className="px-5 py-3.5">User</th>
                  <th className="px-5 py-3.5">Email &amp; Phone</th>
                  <th className="px-5 py-3.5">Wallet Balance</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">KYC Status</th>
                  <th className="px-5 py-3.5">Subscribed</th>
                  <th className="px-5 py-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/80">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                      {isLoading ? 'Loading players...' : 'No players match your search.'}
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{u.username}</div>
                        <span className="text-[10px] text-gray-500 font-mono">ID: #{u.id} • Ref: {u.invite_code}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-gray-300 font-mono">{u.email}</div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">{u.phone || 'No phone'}</div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono font-extrabold text-amber-400 text-sm">
                          ${u.wallet_balance.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            u.account_status === 'Active'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {u.account_status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleVerifyKyc(u)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase transition ${
                            u.kyc_status === 'VERIFIED'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                          title="Click to toggle KYC status"
                        >
                          {u.kyc_status}
                        </button>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          u.is_subscribed ? 'bg-blue-500/20 text-blue-300' : 'bg-gray-800 text-gray-500'
                        }`}>
                          {u.is_subscribed ? 'Subscribed' : 'Unsubscribed'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Adjust Balance */}
                          <button
                            onClick={() => setBalanceModalUser(u)}
                            className="p-1.5 bg-[#1b2436] hover:bg-amber-500 hover:text-black rounded-lg text-amber-400 transition"
                            title="Adjust Balance"
                          >
                            <DollarSign className="w-4 h-4" />
                          </button>

                          {/* Message User via Admin Chat */}
                          <Link
                            href={`/admin/chat?userId=${u.id}`}
                            className="p-1.5 bg-[#1b2436] hover:bg-emerald-600 hover:text-white rounded-lg text-emerald-400 transition"
                            title="Message User on WhatsApp Desk"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Link>

                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg transition ${
                              u.account_status === 'Active'
                                ? 'bg-[#1b2436] hover:bg-red-600 text-red-400 hover:text-white'
                                : 'bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white'
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
          <div className="w-full max-w-md bg-[#111723] border border-amber-500/40 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-amber-400" />
                <span>Adjust Balance: {balanceModalUser.username}</span>
              </h3>
              <button onClick={() => setBalanceModalUser(null)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustBalanceSubmit} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-[#0a0e16] border border-gray-800 rounded-xl flex items-center justify-between">
                <span className="text-gray-400">Current Balance:</span>
                <span className="font-mono font-bold text-amber-400 text-sm">
                  ${balanceModalUser.wallet_balance.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="block text-gray-400 font-bold uppercase mb-2">Adjustment Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustType('add')}
                    className={`py-2 rounded-xl font-bold transition ${
                      adjustType === 'add' ? 'bg-emerald-600 text-white' : 'bg-[#161d2c] text-gray-400'
                    }`}
                  >
                    + Add Funds
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustType('deduct')}
                    className={`py-2 rounded-xl font-bold transition ${
                      adjustType === 'deduct' ? 'bg-red-600 text-white' : 'bg-[#161d2c] text-gray-400'
                    }`}
                  >
                    - Deduct Funds
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold uppercase mb-1">Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full bg-[#161d2c] border border-gray-700 text-white font-mono text-sm px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold uppercase mb-1">Audit Reason</label>
                <input
                  type="text"
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full bg-[#161d2c] border border-gray-700 text-white text-xs px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setBalanceModalUser(null)}
                  className="flex-1 py-3 bg-[#192335] text-gray-300 hover:text-white rounded-xl text-xs font-bold uppercase transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="flex-1 btn-gold py-3 rounded-xl text-xs font-black uppercase text-slate-950 transition"
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
