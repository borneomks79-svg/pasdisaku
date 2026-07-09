'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import axios from 'axios';
import { addToCart } from '../../../lib/cart';

const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

const fetcher = (url: string) => publicApi.get(url).then((res) => res.data);

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const { data: product, isLoading, error } = useSWR(
    slug ? `/public/products/${slug}` : null,
    fetcher
  );

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
        Memuat produk...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <p style={{ color: '#dc2626', fontSize: 14 }}>Produk tidak ditemukan.</p>
        <Link href="/toko" style={{ color: '#059669', fontWeight: 700, fontSize: 14 }}>
          Kembali ke toko
        </Link>
      </div>
    );
  }

  const price = product.salePrice ?? product.basePrice ?? 0;
  const image = product.images
    ? Array.isArray(product.images) ? product.images[0] : product.images
    : null;

  const handleAddToCart = () => {
    addToCart(
      { id: product.id, slug: product.slug, name: product.name, price: Number(price), image },
      qty
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', paddingBottom: 100 }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #059669, #047857)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Link href="/toko" style={{ color: 'white', fontSize: 20, textDecoration: 'none', lineHeight: 1 }}>←</Link>
        <span style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>Detail Produk</span>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: '#9ca3af', marginBottom: 14, flexWrap: 'wrap' }}>
          <Link href="/toko" style={{ color: '#9ca3af', textDecoration: 'none' }}>Toko</Link>
          {product.category?.name && (
            <>
              <span>/</span>
              <Link
                href={`/toko?category=${product.category.slug}`}
                style={{ color: '#059669', textDecoration: 'none', fontWeight: 600 }}
              >
                {product.category.name}
              </Link>
            </>
          )}
          <span>/</span>
          <span style={{ color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
            {product.name}
          </span>
        </div>

        <div
          style={{
            width: '100%',
            aspectRatio: '1 / 1',
            background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
            borderRadius: 18,
            backgroundImage: image ? `url(${image})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            marginBottom: 18,
            position: 'relative',
          }}
        >
          {!image && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, opacity: 0.25 }}>
              📦
            </div>
          )}
        </div>

        <div style={{ background: 'white', borderRadius: 16, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          {product.category?.name && (
            <p style={{ fontSize: 11.5, color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3, margin: 0, marginBottom: 6 }}>
              {product.category.name}
            </p>
          )}

          <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, lineHeight: 1.3 }}>{product.name}</h1>
          <p style={{ fontSize: 24, fontWeight: 800, color: '#047857', marginTop: 10 }}>
            Rp{Number(price).toLocaleString('id-ID')}
          </p>
          <p style={{ fontSize: 12.5, color: '#9ca3af', marginTop: 2 }}>Stok: {product.stock ?? 0}</p>

          {product.description && (
            <div style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid #f3f4f6' }}>
              <h2 style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8, color: '#374151' }}>Deskripsi</h2>
              <p style={{ fontSize: 13.5, color: '#6b7280', lineHeight: 1.6, margin: 0 }}>{product.description}</p>
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'white',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
          padding: '12px 16px',
          display: 'flex',
          gap: 10,
          maxWidth: 560,
          margin: '0 auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ padding: '10px 14px', background: 'white', border: 'none', fontSize: 16, color: '#374151' }}>−</button>
          <span style={{ padding: '0 12px', fontWeight: 700, fontSize: 14 }}>{qty}</span>
          <button onClick={() => setQty((q) => q + 1)} style={{ padding: '10px 14px', background: 'white', border: 'none', fontSize: 16, color: '#374151' }}>+</button>
        </div>

        <button
          onClick={handleAddToCart}
          style={{
            flex: 1,
            padding: '13px',
            borderRadius: 12,
            border: 'none',
            background: added ? '#065f46' : '#059669',
            color: 'white',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          {added ? '✓ Ditambahkan' : 'Tambah ke Keranjang'}
        </button>

        <button
          onClick={() => router.push('/keranjang')}
          style={{
            padding: '13px 16px',
            borderRadius: 12,
            border: '1.5px solid #059669',
            background: 'white',
            color: '#059669',
            fontWeight: 700,
            fontSize: 14,
            flexShrink: 0,
          }}
        >
          🛒
        </button>
      </div>
    </div>
  );
}
