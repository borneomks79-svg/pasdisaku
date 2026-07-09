'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { useCart } from '../../lib/useCart';
import { cartCount } from '../../lib/cart';

const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

const fetcher = (url: string) => publicApi.get(url).then((res) => res.data);

const const ORANGE = '#0ea5e9';
const const ORANGE_DARK = '#0284c7';

const CATEGORY_ICONS: Record<string, string> = {
  elektronik: '🔌',
  fashion: '👕',
  aksesoris: '💍',
  'rumah tangga': '🏠',
  umum: '🛍️',
};

export default function TokoPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const router = useRouter();
  const cart = useCart();

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
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 70 }}>
      <style>{`
        .produk-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          margin-top: 12px;
        }
        @media (min-width: 560px) { .produk-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 860px) { .produk-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1140px) { .produk-grid { grid-template-columns: repeat(5, 1fr); } }
        .kategori-scroll::-webkit-scrollbar { display: none; }
      `}</style>

      <div style={{ background: ORANGE, padding: '14px 12px 44px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, background: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', padding: '9px 12px' }}>
            <span style={{ fontSize: 15, opacity: 0.4, marginRight: 8 }}>🔍</span>
            <input
              type="text"
              placeholder="Cari produk..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ flex: 1, border: 'none', outline: 'none', fontSize: 14, color: '#333' }}
            />
          </div>
        </div>
        <p style={{ color: 'white', fontWeight: 800, fontSize: 20, marginTop: 12, letterSpacing: -0.3 }}>
          🛍️ Pasdisaku
        </p>
      </div>

      <div style={{ maxWidth: 1100, margin: '-30px auto 0', padding: '0 10px' }}>
        {categories.length > 0 && (
          <div style={{ background: 'white', borderRadius: 10, padding: '14px 6px', boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}>
            <div
              className="kategori-scroll"
              style={{ display: 'flex', gap: 4, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}
            >
              <button
                onClick={() => { setActiveCategory(null); setPage(1); }}
                style={{ flexShrink: 0, width: 68, background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 2px' }}
              >
                <div style={{
                  width: 46, height: 46, borderRadius: '50%',
                  background: !activeCategory ? ORANGE : '#fff5f2',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  🛍️
                </div>
                <span style={{ fontSize: 10.5, color: !activeCategory ? ORANGE : '#555', fontWeight: !activeCategory ? 700 : 500, textAlign: 'center', lineHeight: 1.2 }}>
                  Semua
                </span>
              </button>
              {categories.map((c: any) => {
                const isActive = activeCategory === c.slug;
                const icon = CATEGORY_ICONS[c.name.toLowerCase()] || '📦';
                return (
                  <button
                    key={c.id}
                    onClick={() => { setActiveCategory(c.slug); setPage(1); }}
                    style={{ flexShrink: 0, width: 68, background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '4px 2px' }}
                  >
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%',
                      background: isActive ? ORANGE : '#fff5f2',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                    }}>
                      {icon}
                    </div>
                    <span style={{ fontSize: 10.5, color: isActive ? ORANGE : '#555', fontWeight: isActive ? 700 : 500, textAlign: 'center', lineHeight: 1.2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>
                      {c.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isLoading && (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#9ca3af', fontSize: 13.5 }}>Memuat produk...</div>
        )}
        {error && (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#dc2626', fontSize: 13.5 }}>Gagal memuat produk.</div>
        )}
        {!isLoading && !error && products.length === 0 && (
          <div style={{ textAlign: 'center', padding: '50px 0', color: '#9ca3af', fontSize: 13.5 }}>Belum ada produk ditemukan.</div>
        )}

        <div className="produk-grid">
          {products.map((p: any) => {
            const price = p.salePrice ?? p.basePrice ?? p.price ?? 0;
            return (
              <Link
                key={p.id}
                href={`/toko/${p.slug}`}
                style={{ display: 'block', background: 'white', borderRadius: 4, overflow: 'hidden', textDecoration: 'none', color: 'inherit' }}
              >
                <div style={{
                  width: '100%', aspectRatio: '1 / 1',
                  background: 'linear-gradient(135deg, #f8f8f8, #eee)',
                  backgroundImage: p.images ? `url(${Array.isArray(p.images) ? p.images[0] : p.images})` : undefined,
                  backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative',
                }}>
                  {!p.images && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, opacity: 0.25 }}>📦</div>
                  )}
                </div>
                <div style={{ padding: '7px 8px 9px' }}>
                  <p style={{
                    fontSize: 12.5, fontWeight: 400, margin: 0, lineHeight: 1.35, color: '#222',
                    overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', minHeight: '2.6em',
                  }}>
                    {p.name}
                  </p>
                  <p style={{ fontSize: 14.5, fontWeight: 700, color: ORANGE, marginTop: 5, marginBottom: 2 }}>
                    Rp{Number(price).toLocaleString('id-ID')}
                  </p>
                  {p.category?.name && (
                    <p style={{ fontSize: 10, color: '#999', margin: 0 }}>{p.category.name}</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>

        {!isLoading && products.length > 0 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 14, margin: '16px 0 24px' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #e5e7eb', background: page <= 1 ? '#f5f5f5' : 'white', color: page <= 1 ? '#ccc' : '#333', fontWeight: 600, fontSize: 12.5 }}
            >
              ← Sebelumnya
            </button>
            <span style={{ fontSize: 12.5, color: '#666' }}>{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              style={{ padding: '8px 14px', borderRadius: 6, border: '1px solid #e5e7eb', background: page >= totalPages ? '#f5f5f5' : 'white', color: page >= totalPages ? '#ccc' : '#333', fontWeight: 600, fontSize: 12.5 }}
            >
              Berikutnya →
            </button>
          </div>
        )}
      </div>

      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white',
        borderTop: '1px solid #eee', display: 'flex', maxWidth: 1100, margin: '0 auto',
      }}>
        <button style={{ flex: 1, padding: '9px 0 8px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: ORANGE }}>
          <span style={{ fontSize: 19 }}>🏠</span>
          <span style={{ fontSize: 10.5, fontWeight: 700 }}>Beranda</span>
        </button>
        <button
          onClick={() => router.push('/keranjang')}
          style={{ flex: 1, padding: '9px 0 8px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: '#666', position: 'relative' }}
        >
          <span style={{ fontSize: 19 }}>🛒</span>
          <span style={{ fontSize: 10.5 }}>Keranjang</span>
          {cartCount(cart) > 0 && (
            <span style={{
              position: 'absolute', top: 3, right: '28%', background: ORANGE, color: 'white',
              fontSize: 9, fontWeight: 700, borderRadius: 999, minWidth: 15, height: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 3px',
            }}>
              {cartCount(cart)}
            </span>
          )}
        </button>
        <button style={{ flex: 1, padding: '9px 0 8px', background: 'none', border: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, color: '#666' }}>
          <span style={{ fontSize: 19 }}>👤</span>
          <span style={{ fontSize: 10.5 }}>Akun</span>
        </button>
      </div>
    </div>
  );
}
