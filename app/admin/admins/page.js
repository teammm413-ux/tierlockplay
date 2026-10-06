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
    <div className="min-h-screen bg-[#06080e] text-white flex">
      <AdminSidebar />

      <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto space-y-6 overflow-y-auto">
        <div className="pb-4 border-b border-gray-800">
          <h1 className="text-2xl font-black text-white uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-amber-400" />
            <span>Administrator Account Management</span>
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Create and manage administrator accounts directly from this panel or configure root admin credentials via .env file.
          </p>
        </div>

        {/* Info Banner on ENV configuration */}
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start gap-3">
          <Key className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            <span className="font-bold text-amber-300">Environment Credential Sync: </span>
            You can configure your master root admin credentials anytime in your <code className="bg-black/40 px-1.5 py-0.5 rounded text-amber-400 font-mono">.env.local</code> file via <code className="text-white font-mono">ADMIN_USERNAME</code> and <code className="text-white font-mono">ADMIN_PASSWORD</code>. Additional team members can be added below.
          </div>
        </div>

        {notice.text && (
          <div className={`p-3.5 rounded-xl text-xs flex items-center gap-2 ${
            notice.isError ? 'bg-red-500/20 text-red-300 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
          }`}>
            {notice.isError ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
            <span>{notice.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Add Admin Form */}
          <div className="bg-[#0e131d] border border-gray-800 rounded-2xl p-6 shadow space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-amber-400" />
              <span>Create New Admin</span>
            </h2>

            <form onSubmit={handleCreateAdmin} className="space-y-3.5 text-xs">
              <div>
                <label className="text-gray-400 font-semibold block mb-1">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="e.g. manager_sarah"
                    className="w-full bg-[#161d2c] border border-gray-700 text-white pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="sarah@vegasvault.com"
                    className="w-full bg-[#161d2c] border border-gray-700 text-white pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Min 6 characters"
                    className="w-full bg-[#161d2c] border border-gray-700 text-white pl-9 pr-3 py-2.5 rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-gray-400 font-semibold block mb-1">Role / Permissions</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full bg-[#161d2c] border border-gray-700 text-white px-3 py-2.5 rounded-xl focus:outline-none"
                >
                  <option value="admin">Admin (Deposits &amp; Chat)</option>
                  <option value="superadmin">Superadmin (Full Access)</option>
                  <option value="support">Support Agent (Chat only)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full btn-gold py-3 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wide transition shadow disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'Creating...' : '+ Create Administrator'}
              </button>
            </form>
          </div>

          {/* Existing Admins Table */}
          <div className="lg:col-span-2 bg-[#0e131d] border border-gray-800 rounded-2xl overflow-hidden shadow">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Current Administrators ({admins.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#141b27] text-gray-400 uppercase tracking-wider font-semibold border-b border-gray-800">
                  <tr>
                    <th className="px-5 py-3.5">Admin User</th>
                    <th className="px-5 py-3.5">Email</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/80">
                  {admins.map((a) => (
                    <tr key={a.id} className="hover:bg-white/[0.02] transition">
                      <td className="px-5 py-4 font-bold text-white flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-black text-xs">
                          {a.username[0].toUpperCase()}
                        </div>
                        <span>{a.username}</span>
                      </td>
                      <td className="px-5 py-4 font-mono text-gray-300">
                        {a.email}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          a.role === 'superadmin' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {a.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-400 font-mono text-[11px]">
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
