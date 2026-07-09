'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useCart } from '../../lib/useCart';
import { cartTotal, clearCart } from '../../lib/cart';

const BLUE = '#0ea5e9';
const BLUE_DARK = '#0284c7';

const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

const SHIPPING_FLAT_RATE = 15000;

export default function CheckoutPage() {
  const cart = useCart();
  const subtotal = cartTotal(cart);
  const shipping = cart.length > 0 ? SHIPPING_FLAT_RATE : 0;
  const total = subtotal + shipping;

  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successOrder, setSuccessOrder] = useState<any>(null);

  const handleChange = (field: string, value: string) => setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!form.name || !form.phone || !form.address) {
      setErrorMsg('Mohon lengkapi nama, no. HP, dan alamat.');
      return;
    }
    if (cart.length === 0) {
      setErrorMsg('Keranjang kosong.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await publicApi.post('/public/orders', {
        customerName: form.name,
        customerPhone: form.phone,
        customerAddress: form.address,
        shippingCost: shipping,
        items: cart.map((c) => ({ productId: c.id, quantity: c.qty })),
      });
      setSuccessOrder(res.data);
      clearCart();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal membuat pesanan. Coba lagi beberapa saat.');
    } finally {
      setSubmitting(false);
    }
  };

  if (successOrder) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: 20 }}>
        <div style={{ maxWidth: 480, margin: '60px auto', background: 'white', borderRadius: 18, padding: 28, textAlign: 'center', boxShadow: '0 1px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 42, marginBottom: 10 }}>✅</div>
          <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Pesanan Berhasil Dibuat!</h1>
          <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 16 }}>
            Nomor pesanan: <strong style={{ color: '#111827' }}>{successOrder.orderNumber}</strong>
          </p>
          <p style={{ color: '#6b7280', fontSize: 13.5, marginBottom: 24, lineHeight: 1.5 }}>
            Kami akan menghubungi Anda melalui WhatsApp untuk konfirmasi pembayaran dan pengiriman.
          </p>
          <Link href="/toko" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 12, background: BLUE, color: 'white', fontWeight: 700, textDecoration: 'none', fontSize: 14 }}>
            Kembali Belanja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div
        style={{
          background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Link href="/keranjang" style={{ color: 'white', fontSize: 20, textDecoration: 'none', lineHeight: 1 }}>←</Link>
        <span style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>Checkout</span>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 16 }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <p style={{ color: '#9ca3af', marginBottom: 16, fontSize: 14 }}>Keranjang kosong.</p>
            <Link href="/toko" style={{ color: BLUE, fontWeight: 700, fontSize: 14 }}>Mulai belanja →</Link>
          </div>
        ) : (
          <>
            <div style={{ background: 'white', borderRadius: 14, padding: 16, marginBottom: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 12, color: '#111827' }}>Data Pengiriman</h2>

              <label style={{ fontSize: 12.5, color: '#6b7280', display: 'block', marginBottom: 4 }}>Nama Lengkap</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nama Anda"
                style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', marginBottom: 12, fontSize: 14, boxSizing: 'border-box' }}
              />

              <label style={{ fontSize: 12.5, color: '#6b7280', display: 'block', marginBottom: 4 }}>Nomor WhatsApp</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="08xxxxxxxxxx"
                style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', marginBottom: 12, fontSize: 14, boxSizing: 'border-box' }}
              />

              <label style={{ fontSize: 12.5, color: '#6b7280', display: 'block', marginBottom: 4 }}>Alamat Lengkap</label>
              <textarea
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Alamat pengiriman lengkap"
                rows={3}
                style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', fontSize: 14, resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ background: 'white', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 12, color: '#111827' }}>Ringkasan Pesanan</h2>
              {cart.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#6b7280' }}>{item.name} × {item.qty}</span>
                  <span style={{ color: '#111827' }}>Rp{(item.price * item.qty).toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #f3f4f6', marginTop: 10, paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#6b7280' }}>Subtotal</span>
                  <span>Rp{subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
                  <span style={{ color: '#6b7280' }}>Ongkos Kirim</span>
                  <span>Rp{shipping.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, marginTop: 8 }}>
                  <span>Total</span>
                  <span style={{ color: BLUE_DARK }}>Rp{total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {errorMsg && <p style={{ color: '#dc2626', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{errorMsg}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              style={{ width: '100%', marginTop: 16, marginBottom: 24, padding: '14px', borderRadius: 12, border: 'none', background: submitting ? '#94a3b8' : BLUE, color: 'white', fontWeight: 700, fontSize: 15 }}
            >
              {submitting ? 'Memproses...' : 'Buat Pesanan'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
