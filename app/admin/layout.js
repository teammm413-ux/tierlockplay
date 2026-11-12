'use client';

import { usePathname } from 'next/navigation';
import AdminPageShell from '@/components/AdminPageShell';

export default function AdminLayout({ children }) {
  const pathname = usePathname();
  if (pathname === '/admin/login') {
    return children;
  }
  return <AdminPageShell>{children}</AdminPageShell>;
}
