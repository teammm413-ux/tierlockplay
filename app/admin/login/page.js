'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Logo from '@/components/Logo';
import { ShieldCheck, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success) {
        router.push('/admin');
        router.refresh();
      } else {
        setErrorMsg(data.message || 'Invalid admin credentials');
      }
    } catch (err) {
      setErrorMsg('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080e] flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-red-600/10 rounded-full blur-[140px] pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10">
        <div className="flex justify-center mb-4">
          <Logo size="large" href="/admin/login" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold mb-2">
          <ShieldCheck className="w-4 h-4" />
          <span>VAULT ADMIN PORTAL</span>
        </div>
        <h2 className="text-xl font-black text-white tracking-wide uppercase">
          Administrative Access
        </h2>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-[#0e131d] border border-gray-800 py-8 px-6 sm:px-10 rounded-2xl shadow-2xl">
          {errorMsg && (
            <div className="mb-6 p-3.5 bg-red-500/15 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Admin Username / Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-[#151c2a] border border-gray-700 text-white text-xs pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#151c2a] border border-gray-700 text-white text-xs pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-red-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-black text-xs py-3.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 mt-4"
            >
              <span>{isLoading ? 'Verifying...' : 'Sign In as Administrator'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 p-3 rounded-xl bg-[#141a26] border border-dashed border-gray-800 text-[11px] text-gray-400 text-center">
            <span className="text-amber-400 font-bold">Configured Credentials: </span>
            <span className="font-mono text-white">admin / admin123</span>
            <p className="text-[10px] text-gray-500 mt-1">Configurable via ADMIN_USERNAME &amp; ADMIN_PASSWORD in .env or via Admin Accounts UI.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
