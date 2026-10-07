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

export default function GameDepositRecordsPage() {
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [activePreset, setActivePreset] = useState('all');
  const [status, setStatus] = useState('All');
  const [platform, setPlatform] = useState('All');
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
      const currentStatus = overrides.status !== undefined ? overrides.status : status;
      const currentPlatform = overrides.platform !== undefined ? overrides.platform : platform;
      const currentOrderNo = overrides.orderNo !== undefined ? overrides.orderNo : orderNo;

      const params = new URLSearchParams();
      params.append('type', 'Deposit');
      if (currentFrom) params.append('dateFrom', currentFrom);
      if (currentTo) params.append('dateTo', currentTo);
      if (currentStatus !== 'All') params.append('status', currentStatus);
      if (currentPlatform !== 'All') params.append('platform', currentPlatform);
      if (currentOrderNo.trim()) params.append('orderNo', currentOrderNo.trim());

      const res = await fetch(`/api/games/records?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setRecords(data.records || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('[Game Deposit Records Error]', err);
    } finally {
      if (!silent) setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateFrom, dateTo, status, platform, orderNo]);

  useEffect(() => {
    refreshUserData();
    fetchRecords({}, false);
  }, []);

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
    setStatus('All');
    setPlatform('All');
    setOrderNo('');
    setCurrentPage(1);
    fetchRecords({ dateFrom: '', dateTo: '', status: 'All', platform: 'All', orderNo: '' }, false);
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const totalPages = Math.ceil(records.length / pageSize) || 1;
  const paginatedRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const totalAmountSum = records
    .filter((r) => r.status === 'Approved')
    .reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const approvedCount = records.filter((r) => r.status === 'Approved').length;
  const pendingCount = records.filter((r) => r.status === 'Pending').length;

  return (
    <div className="min-h-screen bg-[#f0f4f9] text-slate-800 flex">
      <Sidebar user={user} />

      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        <PlayerHeader
          user={user}
          onOpenChat={() => setIsChatOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Game Platform Deposit Records
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time history of wallet credits transferred into in-game platform IDs.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Live Sync</span>
                {lastUpdated && (
                  <span className="text-[10px] text-emerald-600/80 font-mono ml-0.5">
                    {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => fetchRecords({}, false)}
                disabled={isLoading || isRefreshing}
                title="Refresh Records"
                className="inline-flex items-center justify-center p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition disabled:opacity-50"
              >
                <RotateCw className={`w-4 h-4 ${isRefreshing || isLoading ? 'animate-spin text-amber-500' : ''}`} />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Total Transfers</span>
              <div className="text-xl font-black text-slate-900 mt-1">{records.length}</div>
              <span className="text-[10px] text-slate-400">Total in current filter</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">Credited to Games</span>
              <div className="text-xl font-black text-slate-900 mt-1">${totalAmountSum.toFixed(2)}</div>
              <span className="text-[10px] text-emerald-600 font-semibold">{approvedCount} Completed</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-2xs">
              <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Pending</span>
              <div className="text-xl font-black text-amber-600 font-mono mt-1">{pendingCount}</div>
              <span className="text-[10px] text-slate-400">Awaiting processing</span>
            </div>
          </div>

          {/* Filter Bar */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-5 shadow-2xs border border-slate-200/90 space-y-4">
            <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-100">
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
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition shadow-2xs ${
                    activePreset === p.id
                      ? 'bg-[#1a304e] text-white'
                      : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p.label}
                </button>
              ))}

              {(dateFrom || dateTo) && (
                <button
                  type="button"
                  onClick={() => handleQuickPreset('all')}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 ml-auto"
                >
                  <X className="w-3.5 h-3.5" /> Clear Dates
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[150px]">
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Date From</label>
                <div
                  onClick={() => dateFromInputRef.current?.showPicker && dateFromInputRef.current.showPicker()}
                  className="relative flex items-center border border-slate-300 rounded-lg px-3 py-2 bg-white hover:border-slate-400 transition cursor-pointer"
                >
                  <input
                    ref={dateFromInputRef}
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setActivePreset('custom');
                    }}
                    className="w-full text-xs text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 ml-1 pointer-events-none" />
                </div>
              </div>

              <div className="relative flex-1 min-w-[150px]">
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Date To</label>
                <div
                  onClick={() => dateToInputRef.current?.showPicker && dateToInputRef.current.showPicker()}
                  className="relative flex items-center border border-slate-300 rounded-lg px-3 py-2 bg-white hover:border-slate-400 transition cursor-pointer"
                >
                  <input
                    ref={dateToInputRef}
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setActivePreset('custom');
                    }}
                    className="w-full text-xs text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0 ml-1 pointer-events-none" />
                </div>
              </div>

              <div className="relative flex-1 min-w-[140px]">
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Platform</label>
                <select
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none cursor-pointer"
                >
                  <option value="All">All Platforms</option>
                  <option value="Fire Kirin">Fire Kirin</option>
                  <option value="Orion Stars">Orion Stars</option>
                  <option value="Juwa">Juwa</option>
                  <option value="Game Vault">Game Vault</option>
                  <option value="Milky Way">Milky Way</option>
                  <option value="Panda Master">Panda Master</option>
                </select>
              </div>

              <div className="relative flex-1 min-w-[140px]">
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none cursor-pointer"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="relative flex-1 min-w-[160px]">
                <label className="text-[10px] text-slate-500 font-semibold block mb-0.5">Order No</label>
                <input
                  type="text"
                  placeholder="Order No..."
                  value={orderNo}
                  onChange={(e) => setOrderNo(e.target.value)}
                  className="w-full text-xs text-slate-800 border border-slate-300 rounded-lg px-3 py-2 bg-white focus:outline-none placeholder-slate-400"
                />
              </div>

              <div className="flex items-center gap-2 mt-4 sm:mt-auto">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-[#1a304e] hover:bg-[#132238] text-white text-xs font-bold px-6 py-2.5 rounded-lg transition shadow-2xs flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 text-xs font-semibold px-5 py-2.5 rounded-lg transition shadow-2xs"
                >
                  Reset
                </button>
              </div>
            </div>
          </form>

          {/* Table Container */}
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/90 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-[#0f172a] text-slate-200 text-[11px] font-bold uppercase tracking-wider border-b border-slate-800 whitespace-nowrap">
                  <tr>
                    <th className="py-4 px-4">USERNAME</th>
                    <th className="py-4 px-4">ORDER NO</th>
                    <th className="py-4 px-4">GAME PLATFORM</th>
                    <th className="py-4 px-4">GAME ACCOUNT</th>
                    <th className="py-4 px-4">AMOUNT</th>
                    <th className="py-4 px-4">STATUS</th>
                    <th className="py-4 px-4">FAILURE REASON</th>
                    <th className="py-4 px-4">WALLET BALANCE BEFORE</th>
                    <th className="py-4 px-4">WALLET BALANCE AFTER</th>
                    <th className="py-4 px-4">CREATION TIME</th>
                    <th className="py-4 px-4">OPERATION TIME</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paginatedRecords.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-16 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <AlertCircle className="w-7 h-7 text-slate-300" />
                          <span className="font-semibold text-slate-500">
                            {isLoading ? 'Loading records...' : 'No game deposit records found.'}
                          </span>
                          {!isLoading && (
                            <button
                              onClick={handleReset}
                              className="text-xs text-blue-600 hover:underline font-bold mt-1"
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
                        <tr key={r.id} className="hover:bg-slate-50/70 transition">
                          <td className="py-4 px-4 font-bold text-slate-900">{r.username}</td>
                          <td className="py-4 px-4 font-mono font-medium text-slate-700 whitespace-nowrap">
                            <span className="flex items-center gap-1.5">
                              <span>{r.order_no}</span>
                              <button
                                type="button"
                                onClick={() => copyToClipboard(r.order_no, r.id)}
                                title="Copy Order Number"
                                className="text-slate-400 hover:text-slate-600 transition p-0.5"
                              >
                                {copiedId === r.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </span>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-800 whitespace-nowrap">{r.platform_name}</td>
                          <td className="py-4 px-4 font-mono text-slate-700 whitespace-nowrap">{r.game_account}</td>
                          <td className="py-4 px-4 font-black text-slate-900">${Number(r.amount || 0).toFixed(2)}</td>
                          <td className="py-4 px-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 text-white shadow-2xs ${
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
                          <td className="py-4 px-4 text-rose-600 text-xs font-semibold whitespace-nowrap">
                            {r.failure_reason || '-'}
                          </td>
                          <td className="py-4 px-4 text-slate-600 font-mono">
                            ${Number(r.wallet_balance_before || 0).toFixed(2)}
                          </td>
                          <td className="py-4 px-4 text-slate-600 font-mono">
                            ${Number(r.wallet_balance_after || 0).toFixed(2)}
                          </td>
                          <td className="py-4 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">{r.created_at}</td>
                          <td className="py-4 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">{r.operation_time}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 text-[11px]">
                Showing {records.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, records.length)} of {records.length} records
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="w-7 h-7 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center text-[11px] disabled:opacity-40 disabled:cursor-not-allowed transition"
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
                        ? 'bg-[#1a304e] text-white shadow-2xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {num}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="w-7 h-7 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center text-[11px] disabled:opacity-40 disabled:cursor-not-allowed transition"
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
