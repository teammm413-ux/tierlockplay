'use client';

import AdminSidebar from '@/components/AdminSidebar';

/** Fixed left sidebar; only the right pane scrolls on desktop */
export default function AdminPageShell({ children }) {
  return (
    <div className="min-h-screen lg:h-screen bg-[#07080b] text-slate-100 font-sans lg:overflow-hidden">
      <AdminSidebar />
      <div className="lg:ml-64 min-h-screen lg:h-screen lg:overflow-y-auto overflow-x-hidden pt-16 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
