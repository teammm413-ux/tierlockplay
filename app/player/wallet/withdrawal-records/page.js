'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PlayerHeader from '@/components/PlayerHeader';
import Sidebar from '@/components/Sidebar';
import WhatsAppChat from '@/components/WhatsAppChat';
import FreeplayModal from '@/components/FreeplayModal';
import {
  Calendar,
  Copy,
  Check,
  Search,
  RotateCw,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';

export default function WithdrawalRecordsPage() {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activePreset, setActivePreset] = useState('all');
  const [paymentMethod, setPaymentMethod] = useState('All');
  const [status, setStatus] = useState('All');
  const [orderNo, setOrderNo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const dateFromInputRef = useRef(null);
  const dateToInputRef = useRef(null);

  const formatDateString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const refreshUserData = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.success && data.user) setUser(data.user);
    } catch (err) {}
  };

  const fetchRecords = useCallback(async (overrides = {}, silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const currentFrom = overrides.dateFrom !== undefined ? overrides.dateFrom : dateFrom;
      const currentTo = overrides.dateTo !== undefined ? overrides.dateTo : dateTo;
      const currentMethod = overrides.paymentMethod !== undefined ? overrides.paymentMethod : paymentMethod;
      const currentStatus = overrides.status !== undefined ? overrides.status : status;
      const currentOrderNo = overrides.orderNo !== undefined ? overrides.orderNo : orderNo;

      const params = new URLSearchParams();
      if (currentFrom) params.append('dateFrom', currentFrom);
      if (currentTo) params.append('dateTo', currentTo);
      if (currentMethod !== 'All') params.append('paymentMethod', currentMethod);
      if (currentStatus !== 'All') params.append('status', currentStatus);
      if (currentOrderNo.trim()) params.append('orderNo', currentOrderNo.trim());

      const res = await fetch(`/api/wallet/withdrawal-records?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('[Withdrawal Records Error]', err);
    } finally {
      if (!silent) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateFrom, dateTo, paymentMethod, status, orderNo]);

  useEffect(() => {
    refreshUserData();
    fetchRecords({}, false);
  }, []);

  // Real-time live polling (every 4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRecords({}, true);
    }, 4000);
    return () => clearInterval(interval);
  }, [fetchRecords]);

  const handleQuickPreset = (preset) => {
    setActivePreset(preset);
    const now = new Date();
    let from = '';
    let to = '';

    if (preset === 'today') {
      from = formatDateString(now);
      to = formatDateString(now);
    } else if (preset === 'yesterday') {
      const y = new Date();
      y.setDate(y.getDate() - 1);
      from = formatDateString(y);
      to = formatDateString(y);
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      from = formatDateString(past);
      to = formatDateString(now);
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(past.getDate() - 29);
      from = formatDateString(past);
      to = formatDateString(now);
    } else {
      from = '';
      to = '';
    }

    setDateFrom(from);
    setDateTo(to);
    setCurrentPage(1);
    fetchRecords({ dateFrom: from, dateTo: to }, false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchRecords({}, false);
  };

  const handleReset = () => {
    setDateFrom('');
    setDateTo('');
    setActivePreset('all');
    setPaymentMethod('All');
    setStatus('All');
    setOrderNo('');
    setCurrentPage(1);
    fetchRecords({ dateFrom: '', dateTo: '', paymentMethod: 'All', status: 'All', orderNo: '' }, false);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const totalPages = Math.ceil(records.length / pageSize) || 1;
  const paginatedRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalWithdrawnSum = records
    .filter((r) => r.status === 'Approved')
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const approvedCount = records.filter((r) => r.status === 'Approved').length;
  const pendingCount = records.filter((r) => r.status === 'Pending').length;
  const rejectedCount = records.filter((r) => r.status === 'Rejected').length;

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <PlayerHeader
          user={user}
          onOpenChat={() => setIsChatOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
                Wallet Withdrawal Records
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time tracking of cashout and payout requests.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#FFCC00]/10 text-[#FFCC00] border border-[#FFCC00]/30 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#FFCC00] animate-pulse"></span>
                <span>Live Sync</span>
                {lastUpdated && (
                  <span className="text-[10px] text-[#FFCC00]/80 font-mono ml-0.5">
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fetchRecords({}, false)}
                disabled={isLoading || isRefreshing}
                title="Refresh Records"
                className="inline-flex items-center justify-center p-2 rounded-xl bg-[#181922] border border-white/10 text-slate-300 hover:text-white hover:bg-white/5 transition disabled:opacity-50"
              >
                <RotateCw className={`w-4 h-4 ${isRefreshing || isLoading ? 'animate-spin text-[#FFCC00]' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#101117] rounded-2xl p-4 border border-white/10">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Requests</span>
              <div className="text-xl font-black text-white mt-1 font-mono">{records.length}</div>
              <span className="text-[10px] text-slate-500">In current filter</span>
            </div>
            <div className="bg-[#101117] rounded-2xl p-4 border border-white/10">
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">Paid Out</span>
              <div className="text-xl font-black text-[#FFCC00] mt-1 font-mono">${totalWithdrawnSum.toFixed(2)}</div>
              <span className="text-[10px] text-emerald-400 font-semibold">{approvedCount} Approved</span>
            </div>
            <div className="bg-[#101117] rounded-2xl p-4 border border-white/10">
              <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">Pending Review</span>
              <div className="text-xl font-black text-amber-400 font-mono mt-1">{pendingCount}</div>
              <span className="text-[10px] text-slate-500">Awaiting processing</span>
            </div>
            <div className="bg-[#101117] rounded-2xl p-4 border border-white/10">
              <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider block">Rejected</span>
              <div className="text-xl font-black text-white mt-1 font-mono">{rejectedCount}</div>
              <span className="text-[10px] text-slate-500">Declined requests</span>
            </div>
          </div>

          {/* Filter Bar with Interactive Calendar & Presets */}
          <form onSubmit={handleSearch} className="bg-[#101117] rounded-2xl p-5 border border-white/10 space-y-4">
            <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-white/10">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Quick Range:</span>
              {[
                { id: 'all', label: 'All Time' },
                { id: 'today', label: 'Today' },
                { id: 'yesterday', label: 'Yesterday' },
                { id: '7days', label: 'Last 7 Days' },
                { id: '30days', label: 'Last 30 Days' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleQuickPreset(p.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition shadow-xs ${
                    activePreset === p.id
                      ? 'bg-[#FFCC00] text-slate-950 font-black shadow-lg shadow-yellow-500/20'
                      : 'bg-[#181922] text-slate-300 border border-white/10 hover:border-white/20 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}

              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => handleQuickPreset('all')}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 ml-auto"
                >
                  <X className="w-3.5 h-3.5" /> Clear Dates
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[150px]">
                <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Date From</label>
                <div
                  onClick={() => dateFromInputRef.current?.showPicker && dateFromInputRef.current.showPicker()}
                  className="relative flex items-center border border-white/10 rounded-lg px-3 py-2 bg-[#181922] hover:border-white/20 transition cursor-pointer"
                >
                  <input
                    ref={dateFromInputRef}
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setActivePreset('custom');
                    }}
                    className="w-full text-xs text-slate-200 bg-transparent focus:outline-none cursor-pointer"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 ml-1 pointer-events-none" />
                </div>
              </div>

              <div className="relative flex-1 min-w-[150px]">
                <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Date To</label>
                <div
                  onClick={() => dateToInputRef.current?.showPicker && dateToInputRef.current.showPicker()}
                  className="relative flex items-center border border-white/10 rounded-lg px-3 py-2 bg-[#181922] hover:border-white/20 transition cursor-pointer"
                >
                  <input
                    ref={dateToInputRef}
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setActivePreset('custom');
                    }}
                    className="w-full text-xs text-slate-200 bg-transparent focus:outline-none cursor-pointer"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 ml-1 pointer-events-none" />
                </div>
              </div>

              <div className="relative flex-1 min-w-[140px]">
                <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full text-xs text-slate-200 border border-white/10 rounded-lg px-3 py-2 bg-[#181922] focus:outline-none cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="Cash App">Cash App</option>
                  <option value="Paypal">Paypal</option>
                  <option value="Crypto">Crypto (BTC/USDT)</option>
                </select>
              </div>

              <div className="relative flex-1 min-w-[140px]">
                <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs text-slate-200 border border-white/10 rounded-lg px-3 py-2 bg-[#181922] focus:outline-none cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="relative flex-1 min-w-[160px]">
                <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Order No</label>
                <input
                  type="text"
                  placeholder="Order No..."
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  className="w-full text-xs text-slate-200 border border-white/10 rounded-lg px-3 py-2 bg-[#181922] focus:outline-none placeholder-slate-500"
                />
              </div>

              <div className="flex items-center gap-2 mt-4 sm:mt-auto">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#FFCC00] hover:bg-[#e6b800] text-slate-950 text-xs font-black px-6 py-2.5 rounded-lg transition shadow-lg shadow-yellow-500/20 flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-[#181922] border border-white/10 hover:bg-white/5 text-slate-300 text-xs font-semibold px-5 py-2.5 rounded-lg transition"
                >
                  Reset
                </button>
              </div>
            </div>
          </form>

          {/* Table Container */}
          <div className="bg-[#101117] rounded-2xl border border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#181922] text-slate-300 text-[11px] font-bold uppercase tracking-wider border-b border-white/10 whitespace-nowrap">
                  <tr>
                    <th className="py-4 px-4">USERNAME</th>
                    <th className="py-4 px-4">ORDER NO</th>
                    <th className="py-4 px-4">PAYMENT METHOD</th>
                    <th className="py-4 px-4">PAYMENT INFO</th>
                    <th className="py-4 px-4">AMOUNT</th>
                    <th className="py-4 px-4">SERVICE FEE</th>
                    <th className="py-4 px-4">RECEIVED</th>
                    <th className="py-4 px-4">STATUS</th>
                    <th className="py-4 px-4">FAILURE REASON</th>
                    <th className="py-4 px-4">WALLET BALANCE BEFORE</th>
                    <th className="py-4 px-4">WALLET BALANCE AFTER</th>
                    <th className="py-4 px-4">CREATION TIME</th>
                    <th className="py-4 px-4">OPERATION TIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-16 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle className="w-7 h-7 text-slate-600" />
                          <span className="font-semibold text-slate-400">
                            {isLoading ? 'Loading records...' : 'No withdrawal records found.'}
                          </span>
                          {!isLoading && (
                            <button
                              onClick={handleReset}
                              className="text-xs text-[#FFCC00] hover:underline font-bold mt-1"
                            >
                              Reset filters to view all records
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedRecords.map((r) => {
                      const isApproved = r.status === 'Approved';
                      const isPending = r.status === 'Pending';
                      const isRejected = r.status === 'Rejected';

                      return (
                        <tr key={r.id} className="hover:bg-white/[0.03] transition">
                          <td className="py-4 px-4 font-bold text-white">{r.username}</td>
                          <td className="py-4 px-4 font-mono font-medium text-slate-300 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <span>{r.order_no}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(r.order_no, r.id)}
                                title="Copy Order Number"
                                className="text-slate-500 hover:text-slate-300 transition p-0.5"
                              >
                                {copiedId === r.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-200 whitespace-nowrap">{r.payment_method}</td>
                          <td className="py-4 px-4 font-mono text-slate-300 whitespace-nowrap">{r.payment_info}</td>
                          <td className="py-4 px-4 font-black text-white font-mono">${Number(r.amount || 0).toFixed(2)}</td>
                          <td className="py-4 px-4 text-slate-400 font-mono">-${Number(r.service_fee || 0).toFixed(2)}</td>
                          <td className="py-4 px-4 font-bold text-[#FFCC00] font-mono text-sm">
                            ${Number(r.received_amount || 0).toFixed(2)}
                          </td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 text-white shadow-xs ${
                                isApproved
                                  ? 'bg-emerald-600'
                                  : isRejected
                                  ? 'bg-rose-600'
                                  : isPending
                                  ? 'bg-blue-600'
                                  : 'bg-amber-600'
                              }`}
                            >
                              {isPending && <Clock className="w-3 h-3" />}
                              {isApproved && <CheckCircle2 className="w-3 h-3" />}
                              <span>{r.status}</span>
                            </span>
                          </td>
                          <td className="py-4 px-4 text-rose-400 text-xs font-semibold whitespace-nowrap">
                            {r.failure_reason || '-'}
                          </td>
                          <td className="py-4 px-4 text-slate-400 font-mono">
                            ${Number(r.wallet_balance_before || 0).toFixed(2)}
                          </td>
                          <td className="py-4 px-4 text-slate-400 font-mono">
                            ${Number(r.wallet_balance_after || 0).toFixed(2)}
                          </td>
                          <td className="py-4 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">{r.created_at}</td>
                          <td className="py-4 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">{r.operation_time}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-400 text-[11px]">
                Showing {records.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, records.length)} of {records.length} records
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="w-7 h-7 rounded border border-white/10 bg-[#181922] hover:bg-white/5 text-slate-300 flex items-center justify-center text-[11px] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setCurrentPage(num)}
                    className={`w-7 h-7 rounded text-[11px] font-bold flex items-center justify-center transition ${
                      currentPage === num
                        ? 'bg-[#FFCC00] text-slate-950 font-black shadow-xs'
                        : 'bg-[#181922] border border-white/10 text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="w-7 h-7 rounded border border-white/10 bg-[#181922] hover:bg-white/5 text-slate-300 flex items-center justify-center text-[11px] disabled:opacity-40 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      <FreeplayModal onBonusClaimed={(newBal) => setUser((prev) => ({ ...prev, wallet_balance: newBal }))} />
      <WhatsAppChat
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        user={user}
      />
    </div>
  );
}
