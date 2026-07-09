'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.replace('/login');
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#718096',
        }}
      >
        Memeriksa akses...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, background: '#111827', color: '#fff', padding: 20 }}>
        <h3 style={{ marginBottom: 24 }}>Pasdisaku</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link href="/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/products" style={{ color: '#fff', textDecoration: 'none' }}>Produk</Link>
          <Link href="/categories" style={{ color: '#fff', textDecoration: 'none' }}>Kategori</Link>
          <Link href="/orders" style={{ color: '#fff', textDecoration: 'none' }}>Pesanan</Link>
          <Link href="/suppliers" style={{ color: '#fff', textDecoration: 'none' }}>Supplier</Link>
          <Link href="/markup" style={{ color: '#fff', textDecoration: 'none' }}>Markup</Link>
          <Link href="/whatsapp" style={{ color: '#fff', textDecoration: 'none' }}>WhatsApp</Link>
          <Link href="/settings" style={{ color: '#fff', textDecoration: 'none' }}>Pengaturan</Link>
        </nav>
      </aside>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
