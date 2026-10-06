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
  Key
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex font-sans">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        <div className="pb-4 border-b border-slate-200">
          <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-500" />
            <span>Administrator Account Management</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create and manage administrator accounts directly from this panel or configure root admin credentials via .env file.
          </p>
        </div>

        {/* Info Banner on ENV configuration */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 shadow-sm">
          <Key className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 leading-relaxed">
            <span className="font-bold text-amber-950">Environment Credential Sync: </span>
            You can configure your master root admin credentials anytime in your <code className="bg-amber-100 px-1.5 py-0.5 rounded text-amber-900 font-mono">.env.local</code> file via <code className="font-mono font-bold text-slate-900">ADMIN_USERNAME</code> and <code className="font-mono font-bold text-slate-900">ADMIN_PASSWORD</code>. Additional team members can be added below.
          </div>
        </div>

        {notice.text && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 shadow-sm ${
            notice.isError ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
          }`}>
            {notice.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{notice.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Admin Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-500" />
              <span>Create New Admin</span>
            </h2>

            <form onSubmit={handleCreateAdmin} className="space-y-3.5 text-xs">
              <div>
                <label className="text-slate-600 font-semibold block mb-1">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. manager_sarah"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white placeholder-slate-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@vegasvault.com"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white placeholder-slate-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white placeholder-slate-400 transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-semibold block mb-1">Role / Permissions</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-900 px-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white transition"
                >
                  <option value="admin">Admin (Deposits &amp; Chat)</option>
                  <option value="superadmin">Superadmin (Full Access)</option>
                  <option value="support">Support Agent (Chat only)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-gold py-3 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wide transition shadow-sm disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Creating...' : '+ Create Administrator'}
              </button>
            </form>
          </div>

          {/* Existing Admins Table */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Current Administrators ({admins.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Admin User</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {admins.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-5 py-4 font-bold text-slate-900 flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-black text-xs">
                          {a.username[0].toUpperCase()}
                        </div>
                        <span>{a.username}</span>
                      </td>
                      <td className="px-5 py-4 font-mono text-slate-700">
                        {a.email}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          a.role === 'superadmin' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}>
                          {a.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                        {a.created_at}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
