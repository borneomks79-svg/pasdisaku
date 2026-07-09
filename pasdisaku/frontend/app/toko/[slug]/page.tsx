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
    return <div style={{ padding: 40, textAlign: 'center', color: '#718096' }}>Memuat produk...</div>;
  }

  if (error || !product) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <p style={{ color: '#e53e3e', marginBottom: 16 }}>Produk tidak ditemukan.</p>
        <Link href="/toko" style={{ color: '#00a86b', fontWeight: 600 }}>
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
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <div style={{ background: 'linear-gradient(135deg, #00a86b, #007a4d)', color: 'white', padding: '20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/toko" style={{ color: 'white', fontSize: 20, textDecoration: 'none' }}>←</Link>
        <span style={{ fontWeight: 700 }}>Detail Produk</span>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
        <div style={{ width: '100%', aspectRatio: '1 / 1', background: '#edf2f7', borderRadius: 16, backgroundImage: image ? `url(${image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', marginBottom: 20 }} />

        {product.category?.name && (
          <p style={{ fontSize: 12, color: '#00a86b', fontWeight: 700, textTransform: 'uppercase', margin: 0, marginBottom: 6 }}>
            {product.category.name}
          </p>
        )}

        <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>{product.name}</h1>
        <p style={{ fontSize: 24, fontWeight: 800, color: '#007a4d', marginTop: 10 }}>
          Rp{Number(price).toLocaleString('id-ID')}
        </p>
        <p style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>Stok: {product.stock ?? 0}</p>

        {product.description && (
          <div style={{ marginTop: 20 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Deskripsi</h2>
            <p style={{ fontSize: 14, color: '#4a5568', lineHeight: 1.6 }}>{product.description}</p>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ padding: '10px 16px', background: 'white', border: 'none', fontSize: 16 }}>−</button>
            <span style={{ padding: '0 14px', fontWeight: 600 }}>{qty}</span>
            <button onClick={() => setQty((q) => q + 1)} style={{ padding: '10px 16px', background: 'white', border: 'none', fontSize: 16 }}>+</button>
          </div>

          <button onClick={handleAddToCart} style={{ flex: 1, padding: '14px', borderRadius: 10, border: 'none', background: added ? '#22543d' : '#00a86b', color: 'white', fontWeight: 700, fontSize: 15 }}>
            {added ? 'Ditambahkan ✓' : 'Tambah ke Keranjang'}
          </button>
        </div>

        <button onClick={() => router.push('/keranjang')} style={{ width: '100%', marginTop: 12, padding: '14px', borderRadius: 10, border: '1px solid #00a86b', background: 'white', color: '#00a86b', fontWeight: 700, fontSize: 15 }}>
          Lihat Keranjang
        </button>
      </div>
    </div>
  );
}
