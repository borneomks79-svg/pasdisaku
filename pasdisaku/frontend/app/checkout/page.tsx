'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useCart } from '../../lib/useCart';
import { cartTotal, clearCart } from '../../lib/cart';

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
      <div style={{ minHeight: '100vh', background: '#f7fafc', padding: 20 }}>
        <div style={{ maxWidth: 500, margin: '60px auto', background: 'white', borderRadius: 16, padding: 28, textAlign: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
          <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>Pesanan Berhasil Dibuat!</h1>
          <p style={{ color: '#718096', fontSize: 14, marginBottom: 16 }}>
            Nomor pesanan: <strong>{successOrder.orderNumber}</strong>
          </p>
          <p style={{ color: '#718096', fontSize: 14, marginBottom: 24 }}>
            Kami akan menghubungi Anda melalui WhatsApp untuk konfirmasi pembayaran dan pengiriman.
          </p>
          <Link href="/toko" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 10, background: '#00a86b', color: 'white', fontWeight: 700, textDecoration: 'none' }}>
            Kembali Belanja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <div style={{ background: 'linear-gradient(135deg, #00a86b, #007a4d)', color: 'white', padding: '20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/keranjang" style={{ color: 'white', fontSize: 20, textDecoration: 'none' }}>←</Link>
        <span style={{ fontWeight: 700 }}>Checkout</span>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <p style={{ color: '#718096', marginBottom: 16 }}>Keranjang kosong.</p>
            <Link href="/toko" style={{ color: '#00a86b', fontWeight: 700 }}>Mulai belanja →</Link>
          </div>
        ) : (
          <>
            <div style={{ background: 'white', borderRadius: 12, padding: 16, marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Data Pengiriman</h2>

              <label style={{ fontSize: 13, color: '#4a5568', display: 'block', marginBottom: 4 }}>Nama Lengkap</label>
              <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Nama Anda" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12, fontSize: 14 }} />

              <label style={{ fontSize: 13, color: '#4a5568', display: 'block', marginBottom: 4 }}>Nomor WhatsApp</label>
              <input type="tel" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="08xxxxxxxxxx" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', marginBottom: 12, fontSize: 14 }} />

              <label style={{ fontSize: 13, color: '#4a5568', display: 'block', marginBottom: 4 }}>Alamat Lengkap</label>
              <textarea value={form.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Alamat pengiriman lengkap" rows={3} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, resize: 'vertical' }} />
            </div>

            <div style={{ background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>Ringkasan Pesanan</h2>
              {cart.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ color: '#4a5568' }}>{item.name} × {item.qty}</span>
                  <span>Rp{(item.price * item.qty).toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 10, paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: '#4a5568' }}>Subtotal</span>
                  <span>Rp{subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginTop: 4 }}>
                  <span style={{ color: '#4a5568' }}>Ongkos Kirim</span>
                  <span>Rp{shipping.toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 15, marginTop: 8 }}>
                  <span>Total</span>
                  <span style={{ color: '#007a4d' }}>Rp{total.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {errorMsg && <p style={{ color: '#e53e3e', fontSize: 13, marginTop: 12, textAlign: 'center' }}>{errorMsg}</p>}

            <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', marginTop: 16, padding: '14px', borderRadius: 10, border: 'none', background: submitting ? '#a0aec0' : '#00a86b', color: 'white', fontWeight: 700, fontSize: 15 }}>
              {submitting ? 'Memproses...' : 'Buat Pesanan'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
