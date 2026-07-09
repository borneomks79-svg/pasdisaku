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
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: categoriesData } = useSWR('/public/categories', fetcher);
  const categories = categoriesData || [];

  const { data, isLoading, error } = useSWR(
    `/public/products?search=${encodeURIComponent(search)}&page=${page}&pageSize=12${
      activeCategory ? `&category=${encodeURIComponent(activeCategory)}` : ''
    }`,
    fetcher
  );

  const products = data?.items || data?.data || [];
  const totalPages = data?.pagination?.totalPages || data?.totalPages || 1;

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <style>{`
        .produk-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
          margin-top: 14px;
          padding-bottom: 24px;
        }
        @media (min-width: 560px) {
          .produk-grid { grid-template-columns: repeat(3, 1fr); gap: 12px; }
        }
        @media (min-width: 860px) {
          .produk-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 1140px) {
          .produk-grid { grid-template-columns: repeat(5, 1fr); }
        }
        .kategori-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div
        style={{
          background: 'linear-gradient(135deg, #059669, #047857)',
          padding: '28px 16px 90px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -60,
            right: -40,
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -30,
            left: -20,
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)',
          }}
        />
        <div style={{ position: 'relative', textAlign: 'center', color: 'white' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>🛍️ Pasdisaku</h1>
          <p style={{ fontSize: 14, opacity: 0.9, marginTop: 4 }}>Belanja mudah, harga bersahabat</p>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '-56px auto 0', padding: '0 16px' }}>
        <div
          style={{
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            padding: 6,
          }}
        >
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
              padding: '13px 16px',
              fontSize: 15,
              border: 'none',
              outline: 'none',
              borderRadius: 12,
              boxSizing: 'border-box',
            }}
          />
        </div>

        {categories.length > 0 && (
          <div
            className="kategori-scroll"
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              padding: '16px 2px 6px',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            <button
              onClick={() => {
                setActiveCategory(null);
                setPage(1);
              }}
              style={{
                flexShrink: 0,
                padding: '9px 18px',
                borderRadius: 999,
                border: 'none',
                background: !activeCategory ? '#059669' : 'white',
                color: !activeCategory ? 'white' : '#374151',
                fontWeight: 600,
                fontSize: 13.5,
                whiteSpace: 'nowrap',
                boxShadow: !activeCategory ? '0 2px 8px rgba(5,150,105,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              Semua
            </button>
            {categories.map((c: any) => (
              <button
                key={c.id}
                onClick={() => {
                  setActiveCategory(c.slug);
                  setPage(1);
                }}
                style={{
                  flexShrink: 0,
                  padding: '9px 18px',
                  borderRadius: 999,
                  border: 'none',
                  background: activeCategory === c.slug ? '#059669' : 'white',
                  color: activeCategory === c.slug ? 'white' : '#374151',
                  fontWeight: 600,
                  fontSize: 13.5,
                  whiteSpace: 'nowrap',
                  boxShadow: activeCategory === c.slug ? '0 2px 8px rgba(5,150,105,0.3)' : '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                {c.name} ({c.productCount})
              </button>
            ))}
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 14 }}>
            Memuat produk...
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#dc2626', fontSize: 14 }}>
            Gagal memuat produk. Coba muat ulang halaman.
          </div>
        )}

        {!isLoading && !error && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af', fontSize: 14 }}>
            Belum ada produk ditemukan.
          </div>
        )}

        <div className="produk-grid">
          {products.map((p: any) => {
            const price = p.salePrice ?? p.basePrice ?? p.price ?? 0;
            return (
              <Link
                key={p.id}
                href={`/toko/${p.slug}`}
                style={{
                  display: 'block',
                  background: 'white',
                  borderRadius: 14,
                  overflow: 'hidden',
                  textDecoration: 'none',
                  color: 'inherit',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                    background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                    backgroundImage: p.images
                      ? `url(${Array.isArray(p.images) ? p.images[0] : p.images})`
                      : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                  }}
                >
                  {!p.images && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 26,
                        opacity: 0.3,
                      }}
                    >
                      📦
                    </div>
                  )}
                </div>
                <div style={{ padding: '9px 10px 11px' }}>
                  {p.category?.name && (
                    <p
                      style={{
                        fontSize: 9.5,
                        color: '#059669',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: 0.3,
                        margin: 0,
                        marginBottom: 3,
                      }}
                    >
                      {p.category.name}
                    </p>
                  )}
                  <p
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      margin: 0,
                      lineHeight: 1.35,
                      overflow: 'hidden',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '2.6em',
                    }}
                  >
                    {p.name}
                  </p>
                  <p style={{ fontSize: 13.5, fontWeight: 800, color: '#047857', marginTop: 5, marginBottom: 0 }}>
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
              alignItems: 'center',
              gap: 14,
              margin: '8px 0 32px',
            }}
          >
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: 'none',
                background: page <= 1 ? '#f3f4f6' : 'white',
                color: page <= 1 ? '#d1d5db' : '#374151',
                fontWeight: 600,
                fontSize: 13,
                boxShadow: page <= 1 ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              ← Sebelumnya
            </button>
            <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 500 }}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{
                padding: '9px 16px',
                borderRadius: 10,
                border: 'none',
                background: page >= totalPages ? '#f3f4f6' : 'white',
                color: page >= totalPages ? '#d1d5db' : '#374151',
                fontWeight: 600,
                fontSize: 13,
                boxShadow: page >= totalPages ? 'none' : '0 1px 4px rgba(0,0,0,0.08)',
              }}
            >
              Berikutnya →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
