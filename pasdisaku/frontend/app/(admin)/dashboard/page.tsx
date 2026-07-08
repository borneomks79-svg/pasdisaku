'use client';

import useSWR from 'swr';
import { api } from '../../../lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function DashboardPage() {
  const { data, error, isLoading } = useSWR('/products/dashboard-stats', fetcher);

  return (
    <div className="container">
      <h1 style={{ marginBottom: 20 }}>Dashboard</h1>

      {isLoading && <p>Memuat statistik...</p>}
      {error && <p style={{ color: 'red' }}>Gagal memuat data. Pastikan sudah login.</p>}

      {data && (
        <div className="grid grid-4">
          <StatCard label="Total Produk" value={data.totalProducts} />
          <StatCard label="Produk Aktif" value={data.activeProducts} />
          <StatCard label="Stok Habis" value={data.outOfStock} />
          <StatCard label="Pesanan Pending" value={data.pendingOrders} />
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card">
      <p style={{ color: '#6b7280', fontSize: 14 }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 700 }}>{value?.toLocaleString('id-ID')}</p>
    </div>
  );
}
