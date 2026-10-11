'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Check, X, Sparkles, ShieldCheck } from 'lucide-react';

export default function ChromeNotificationPrompt() {
  const [permission, setPermission] = useState('default');
  const [showBanner, setShowBanner] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isEnabling, setIsEnabling] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      if (Notification.permission === 'default') {
        const dismissed = sessionStorage.getItem('trp_push_prompt_dismissed');
        if (!dismissed) {
          // Delay by 1.5 seconds so user sees dashboard first
          const timer = setTimeout(() => setShowBanner(true), 1500);
          return () => clearTimeout(timer);
        }
      }
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setStatusMessage('Notifications are not supported in this browser.');
      return;
    }

    setIsEnabling(true);
    setStatusMessage('');

    try {
      const res = await Notification.requestPermission();
      setPermission(res);

      if (res === 'granted') {
        setStatusMessage('Notifications Enabled! 🎉');
        try {
          new Notification('TierlockPlay Alerts Activated! 🎰', {
            body: 'You will now receive instant alerts for deposits, cashouts & game credentials.',
            icon: '/favicon.ico',
          });
        } catch (e) {}

        setTimeout(() => setShowBanner(false), 1500);
      } else if (res === 'denied') {
        setStatusMessage('Blocked in browser settings. Please click the site icon in address bar to allow.');
      }
    } catch (err) {
      console.error('Notification permission error:', err);
      setStatusMessage('Error requesting notification permission.');
    } finally {
      setIsEnabling(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    sessionStorage.setItem('trp_push_prompt_dismissed', '1');
  };

  // Poll for backend notifications if permission granted
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || permission !== 'granted') {
      return;
    }

    const checkNotifications = async () => {
      try {
        const res = await fetch('/api/notifications/chrome');
        const data = await res.json();
        if (data.success && data.notifications && data.notifications.length > 0) {
          const unread = data.notifications.filter((n) => !n.is_read);
          if (unread.length > 0) {
            const latest = unread[0];
            try {
              new Notification(latest.title, {
                body: latest.message,
                icon: '/favicon.ico',
              });
            } catch (e) {}

            fetch('/api/notifications/chrome', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: latest.id }),
            }).catch(() => {});
          }
        }
      } catch (err) {}
    };

    const interval = setInterval(checkNotifications, 12000);
    return () => clearInterval(interval);
  }, [permission]);

  if (!showBanner || !isSupported) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 bg-[#101117] border border-[#FFCC00]/40 rounded-2xl p-4 sm:p-5 shadow-[0_10px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(255,204,0,0.15)] animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-[#FFCC00]/15 text-[#FFCC00] flex items-center justify-center shrink-0 border border-[#FFCC00]/30 shadow-sm">
          <Bell className="w-5 h-5 animate-bounce" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs sm:text-sm font-black text-white uppercase tracking-wide">
                Enable Push Notifications
              </span>
              <span className="text-[9px] bg-[#FFCC00] text-slate-950 font-black px-1.5 py-0.2 rounded-md tracking-wider">
                VIP
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">
            Get instant real-time browser alerts when deposits clear, cashouts are dispatched, or exclusive freeplay bonuses drop!
          </p>

          {statusMessage && (
            <p className="text-[11px] font-semibold text-[#FFCC00] mt-2 bg-[#FFCC00]/10 border border-[#FFCC00]/20 rounded-lg p-2">
              {statusMessage}
            </p>
          )}

          <div className="flex items-center gap-2.5 mt-3.5">
            <button
              onClick={requestPermission}
              disabled={isEnabling}
              className="flex-1 bg-[#FFCC00] hover:bg-yellow-300 text-slate-950 font-black text-xs py-2 px-3.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-md shadow-yellow-500/20 uppercase tracking-wide"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>{isEnabling ? 'Enabling...' : 'Turn On Alerts'}</span>
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-2 text-xs font-semibold text-slate-400 hover:text-white transition rounded-xl hover:bg-white/5"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
