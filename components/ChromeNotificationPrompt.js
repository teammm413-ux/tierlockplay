'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Check, X, ShieldAlert } from 'lucide-react';

export default function ChromeNotificationPrompt() {
  const [permission, setPermission] = useState('default');
  const [showBanner, setShowBanner] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState(Date.now());

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'default') {
        const dismissed = localStorage.getItem('vv_notif_dismissed');
        if (!dismissed) {
          setShowBanner(true);
        }
      }
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const res = await Notification.requestPermission();
        setPermission(res);
        setShowBanner(false);
        if (res === 'granted') {
          new Notification('TierlockPlay Notifications Enabled! 🎰', {
            body: 'You will now receive instant alerts for bonuses, deposits & payout updates.',
            icon: '/favicon.ico',
          });
        }
      } catch (err) {
        console.error('Notification error:', err);
      }
    }
  };

  // Poll for new notifications
  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const res = await fetch('/api/notifications/chrome');
        const data = await res.json();
        if (data.success && data.notifications && data.notifications.length > 0) {
          const unread = data.notifications.filter((n) => !n.is_read);
          if (unread.length > 0 && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
            const latest = unread[0];
            new Notification(latest.title, {
              body: latest.message,
              icon: '/favicon.ico',
            });
            // Mark read
            fetch('/api/notifications/chrome', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: latest.id }),
            });
          }
        }
      } catch (err) {
        // ignore
      }
    };

    const interval = setInterval(checkNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-20 left-6 z-40 max-w-sm bg-[#131b26] border border-amber-500/40 rounded-xl p-3.5 shadow-2xl animate-in slide-in-from-bottom duration-300">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
          <Bell className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold text-white flex items-center gap-1.5">
            <span>Enable Chrome Notifications</span>
            <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1.5 py-0.2 rounded font-semibold">VIP</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1 leading-snug">
            Get instant Chrome alerts when payouts clear or exclusive deposit promo codes drop!
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <button
              onClick={requestPermission}
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-black text-[11px] font-bold px-3 py-1 rounded-md hover:brightness-110 transition shadow-sm"
            >
              Allow Alerts
            </button>
            <button
              onClick={() => {
                setShowBanner(false);
                localStorage.setItem('vv_notif_dismissed', '1');
              }}
              className="text-gray-400 hover:text-white text-[11px] px-2 py-1"
            >
              Later
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="text-gray-500 hover:text-gray-300 p-0.5"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
