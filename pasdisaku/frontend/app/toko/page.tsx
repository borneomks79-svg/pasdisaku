'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import axios from 'axios';

const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

const fetcher = (url: string) => publicApi.get(url).then((res) => res.data);

export default function TokoPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSWR(
    `/public/products?search=${encodeURIComponent(search)}&page=${page}&pageSize=12`,
    fetcher
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #00a86b, #007a4d)',
          color: 'white',
          padding: '32px 20px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>🛍️ Pasdisaku</h1>
        <p style={{ opacity: 0.9, marginTop: 6 }}>Belanja mudah, harga bersahabat</p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
        <input
          placeholder="🔍 Cari produk..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            width: '100%',
            padding: 14,
            borderRadius: 10,
            border: '1.5px solid #e2e8f0',
            marginBottom: 24,
            fontSize: 15,
          }}
        />

        {isLoading && <p style={{ textAlign: 'center', color: '#718096' }}>Memuat produk...</p>}

        {data && data.items.length === 0 && (
          <p style={{ textAlign: 'center', color: '#a0aec0', padding: 40 }}>Belum ada produk tersedia.</p>
        )}

        {data && data.items.length > 0 && (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: 16,
                marginBottom: 24,
              }}
            >
              {data.items.map((p: any) => (
                <Link
                  key={p.id}
                  href={`/toko/${p.slug}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div
                    style={{
                      background: 'white',
                      borderRadius: 12,
                      overflow: 'hidden',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: 140,
                        background: '#edf2f7',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 32,
                      }}
                    >
                      {p.images && p.images[0] ? (
                        <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        '📦'
                      )}
                    </div>
                    <div style={{ padding: 12 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, lineHeight: 1.3 }}>
                        {p.name.length > 40 ? p.name.slice(0, 40) + '...' : p.name}
                      </p>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#00a86b' }}>
                        Rp {Number(p.salePrice).toLocaleString('id-ID')}
                      </p>
                      {p.category && (
                        <span
                          style={{
                            fontSize: 10,
                            background: '#e6fffa',
                            color: '#00796b',
                            padding: '2px 8px',
                            borderRadius: 8,
                            display: 'inline-block',
                            marginTop: 6,
                          }}
                        >
                          {p.category.name}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 40 }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: 'white',
                }}
              >
                ← Sebelumnya
              </button>
              <span style={{ padding: '8px 16px', color: '#718096' }}>
                Halaman {data.pagination.page} dari {data.pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pagination.totalPages}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: 'white',
                }}
              >
                Berikutnya →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
