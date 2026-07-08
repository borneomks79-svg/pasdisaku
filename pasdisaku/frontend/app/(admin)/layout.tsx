import Link from 'next/link';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: 220, background: '#111827', color: '#fff', padding: 20 }}>
        <h3 style={{ marginBottom: 24 }}>Pasdisaku</h3>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link href="/dashboard" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</Link>
          <Link href="/products" style={{ color: '#fff', textDecoration: 'none' }}>Produk</Link>
          <Link href="/orders" style={{ color: '#fff', textDecoration: 'none' }}>Pesanan</Link>
          <Link href="/suppliers" style={{ color: '#fff', textDecoration: 'none' }}>Supplier</Link>
          <Link href="/markup" style={{ color: '#fff', textDecoration: 'none' }}>Markup</Link>
        </nav>
      </aside>
      <main style={{ flex: 1 }}>{children}</main>
    </div>
  );
}
