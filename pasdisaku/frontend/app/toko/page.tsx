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

  const { data, isLoading, error } = useSWR(
    `/public/products?search=${encodeURIComponent(search)}&page=${page}&pageSize=12`,
    fetcher
  );

  const products = data?.items || data?.data || [];
  const totalPages = data?.totalPages || 1;

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
          type="text"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          style={{
            width: '100%',
            padding: '14px 18px',
            fontSize: 16,
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            outline: 'none',
          }}
        />

        {isLoading && (
          <p style={{ textAlign: 'center', marginTop: 40, color: '#718096' }}>
            Memuat produk...
          </p>
        )}

        {error && (
          <p style={{ textAlign: 'center', marginTop: 40, color: '#e53e3e' }}>
            Gagal memuat produk. Coba muat ulang halaman.
          </p>
        )}

        {!isLoading && !error && products.length === 0 && (
          <p style={{ textAlign: 'center', marginTop: 40, color: '#718096' }}>
            Belum ada produk ditemukan.
          </p>
        )}

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
            marginTop: 24,
          }}
        >
          {products.map((p: any) => {
            const price = p.salePrice ?? p.basePrice ?? p.price ?? 0;
            return (
              <Link
                key={p.id}
                href={`/toko/${p.id}`}
                style={{
                  display: 'block',
                  background: 'white',
                  borderRadius: 14,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    background: '#edf2f7',
                    backgroundImage: p.images
                      ? `url(${Array.isArray(p.images) ? p.images[0] : p.images})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <div style={{ padding: 12 }}>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {p.name}
                  </p>
                  <p style={{ fontSize: 15, fontWeight: 800, color: '#007a4d', marginTop: 6 }}>
                    Rp{Number(price).toLocaleString('id-ID')}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {!isLoading && products.length > 0 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 12,
              margin: '32px 0',
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: page <= 1 ? '#f7fafc' : 'white',
              }}
            >
              Sebelumnya
            </button>
            <span style={{ alignSelf: 'center', color: '#718096' }}>
              Halaman {page} dari {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                background: page >= totalPages ? '#f7fafc' : 'white',
              }}
            >
              Berikutnya
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
