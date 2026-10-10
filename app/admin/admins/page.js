'use client';

import React, { useState, useEffect } from 'react';
import AdminSidebar from '@/components/AdminSidebar';
import {
  ShieldCheck,
  UserPlus,
  Lock,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Key,
  RefreshCw,
  Users
} from 'lucide-react';

export default function AdminManagementPage() {
  const [admins, setAdmins] = useState([]);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState({ text: '', isError: false });

  const loadAdmins = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/admins');
      const data = await res.json();
      if (data.success) {
        setAdmins(data.admins || []);
      }
    } catch (err) {} finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setNotice({ text: '', isError: false });
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setNotice({ text: data.message, isError: false });
        setFormData({ username: '', email: '', password: '', role: 'admin' });
        loadAdmins();
      } else {
        setNotice({ text: data.message || 'Failed to create admin', isError: true });
      }
    } catch (err) {
      setNotice({ text: 'Connection error', isError: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#07080b] text-slate-100 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto pt-16 lg:pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#FFCC00]" />
              <span>Administrator Accounts</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Create and manage administrative staff accounts, grant role-based permissions, or sync root admin via credentials.
            </p>
          </div>

          <button
            onClick={loadAdmins}
            className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 rounded-xl transition self-start sm:self-auto"
            title="Refresh List"
          >
            <RefreshCw className="w-4 h-4 text-[#FFCC00]" />
          </button>
        </div>

        {/* Info Banner on ENV configuration */}
        <div className="p-4 bg-[#FFCC00]/10 border border-[#FFCC00]/30 rounded-2xl flex items-start gap-3 shadow-lg">
          <Key className="w-5 h-5 text-[#FFCC00] shrink-0 mt-0.5" />
          <div className="text-xs text-[#FFCC00] leading-relaxed">
            <span className="font-bold text-white">Environment Credential Sync: </span>
            You can configure your master root admin credentials anytime in your{' '}
            <code className="bg-black/50 px-2 py-0.5 rounded text-white font-mono border border-white/10">.env.local</code> file via{' '}
            <code className="bg-black/50 px-2 py-0.5 rounded text-emerald-400 font-mono border border-white/10">ADMIN_USERNAME</code> and{' '}
            <code className="bg-black/50 px-2 py-0.5 rounded text-emerald-400 font-mono border border-white/10">ADMIN_PASSWORD</code>. Additional team members can be added below.
          </div>
        </div>

        {notice.text && (
          <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 shadow-lg ${
            notice.isError
              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
              : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
          }`}>
            {notice.isError ? <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            <span className="font-semibold">{notice.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Admin Form */}
          <div className="bg-[#101117] border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 pb-2 border-b border-white/10">
              <UserPlus className="w-4 h-4 text-[#FFCC00]" />
              <span>Create New Admin</span>
            </h2>

            <form onSubmit={handleCreateAdmin} className="space-y-4 text-xs">
              <div>
                <label className="text-slate-300 font-bold block mb-1.5 uppercase text-[11px]">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. manager_sarah"
                    className="w-full bg-[#181922] border border-white/10 text-white pl-10 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5 uppercase text-[11px]">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@tierlockplay.com"
                    className="w-full bg-[#181922] border border-white/10 text-white pl-10 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5 uppercase text-[11px]">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full bg-[#181922] border border-white/10 text-white pl-10 pr-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] placeholder-slate-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-300 font-bold block mb-1.5 uppercase text-[11px]">Role / Permissions</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-[#181922] border border-white/10 text-white px-3.5 py-2.5 rounded-xl focus:outline-none focus:border-[#FFCC00] transition"
                >
                  <option value="admin">Admin (Deposits &amp; Chat)</option>
                  <option value="superadmin">Superadmin (Full Access)</option>
                  <option value="support">Support Agent (Chat only)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider py-3.5 rounded-xl transition shadow-lg shadow-yellow-500/20 disabled:opacity-50 mt-2 active:scale-98 cursor-pointer"
              >
                {isSubmitting ? 'Creating Administrator...' : '+ Create Administrator'}
              </button>
            </form>
          </div>

          {/* Existing Admins Table */}
          <div className="lg:col-span-2 bg-[#101117] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col justify-between">
            <div>
              <div className="px-6 py-4 bg-[#181922] border-b border-white/10 flex items-center justify-between">
                <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FFCC00]" />
                  <span>Current Administrators ({admins.length})</span>
                </span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                  Active Team
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#12131a] text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-white/5">
                    <tr>
                      <th className="px-5 py-3.5">Admin User</th>
                      <th className="px-5 py-3.5">Email</th>
                      <th className="px-5 py-3.5">Role</th>
                      <th className="px-5 py-3.5">Created Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {isLoading ? (
                      <tr>
                        <td colSpan="4" className="text-center py-12 text-slate-500">
                          <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-[#FFCC00]" />
                          Loading admin accounts...
                        </td>
                      </tr>
                    ) : admins.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-12 text-slate-500">
                          No admin accounts found.
                        </td>
                      </tr>
                    ) : (
                      admins.map((a) => (
                        <tr key={a.id || a._id} className="hover:bg-white/[0.03] transition">
                          <td className="px-5 py-4 font-bold text-white flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#FFCC00]/15 text-[#FFCC00] border border-[#FFCC00]/30 flex items-center justify-center font-black text-xs">
                              {a.username ? a.username[0].toUpperCase() : 'A'}
                            </div>
                            <span className="font-semibold text-sm">{a.username}</span>
                          </td>
                          <td className="px-5 py-4 font-mono text-slate-300">
                            {a.email}
                          </td>
                          <td className="px-5 py-4">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border ${
                              a.role === 'superadmin'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : a.role === 'support'
                                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                : 'bg-[#FFCC00]/15 text-[#FFCC00] border-[#FFCC00]/30'
                            }`}>
                              {a.role}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                            {a.created_at ? a.created_at.substring(0, 10) : 'Active'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
