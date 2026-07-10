'use client';

import { useState } from 'react';
import Link from 'next/link';
import axios from 'axios';

const BLUE = '#0ea5e9';
const BLUE_DARK = '#0284c7';

const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu Konfirmasi',
  paid: 'Sudah Dibayar',
  processing: 'Sedang Diproses',
  shipped: 'Sedang Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const STATUS_STEPS = ['pending', 'paid', 'processing', 'shipped', 'completed'];

export default function LacakPesananPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [result, setResult] = useState<any>(null);

  const handleTrack = async () => {
    setErrorMsg('');
    setResult(null);
    if (!orderNumber.trim() || !phone.trim()) {
      setErrorMsg('Isi nomor pesanan dan nomor HP.');
      return;
    }
    setLoading(true);
    try {
      const res = await publicApi.get('/public/orders/track', {
        params: { orderNumber: orderNumber.trim(), phone: phone.trim() },
      });
      setResult(res.data);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Pesanan tidak ditemukan.');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = result ? STATUS_STEPS.indexOf(result.status) : -1;
  const isCancelled = result?.status === 'cancelled';

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <div
        style={{
          background: `linear-gradient(135deg, ${BLUE}, ${BLUE_DARK})`,
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Link href="/toko" style={{ color: 'white', fontSize: 20, textDecoration: 'none', lineHeight: 1 }}>←</Link>
        <span style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>Lacak Pesanan</span>
      </div>

      <div style={{ maxWidth: 480, margin: '0 auto', padding: 16 }}>
        <div style={{ background: 'white', borderRadius: 14, padding: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)', marginBottom: 16 }}>
          <label style={{ fontSize: 12.5, color: '#6b7280', display: 'block', marginBottom: 4 }}>Nomor Pesanan</label>
          <input
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            placeholder="Contoh: PSD-1783598249683"
            style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', marginBottom: 12, fontSize: 14, boxSizing: 'border-box' }}
          />
          <label style={{ fontSize: 12.5, color: '#6b7280', display: 'block', marginBottom: 4 }}>Nomor WhatsApp saat checkout</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="08xxxxxxxxxx"
            style={{ width: '100%', padding: '11px 12px', borderRadius: 10, border: '1.5px solid #e5e7eb', marginBottom: 14, fontSize: 14, boxSizing: 'border-box' }}
          />
          {errorMsg && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{errorMsg}</p>}
          <button
            onClick={handleTrack}
            disabled={loading}
            style={{ width: '100%', padding: '13px', borderRadius: 12, border: 'none', background: loading ? '#94a3b8' : BLUE, color: 'white', fontWeight: 700, fontSize: 14.5 }}
          >
            {loading ? 'Mencari...' : 'Lacak Pesanan'}
          </button>
        </div>

        {result && (
          <div style={{ background: 'white', borderRadius: 14, padding: 18, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Nomor Pesanan</p>
            <p style={{ fontSize: 15, fontWeight: 800, marginTop: 2, marginBottom: 16 }}>{result.orderNumber}</p>

            {isCancelled ? (
              <p style={{ color: '#dc2626', fontWeight: 700, fontSize: 14 }}>❌ Pesanan Dibatalkan</p>
            ) : (
              <div style={{ marginBottom: 20 }}>
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= currentStepIndex;
                  return (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: i < STATUS_STEPS.length - 1 ? 4 : 0 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div
                          style={{
                            width: 22, height: 22, borderRadius: '50%',
                            background: done ? BLUE : '#e5e7eb',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0,
                          }}
                        >
                          {done ? '✓' : ''}
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div style={{ width: 2, height: 22, background: i < currentStepIndex ? BLUE : '#e5e7eb' }} />
                        )}
                      </div>
                      <span style={{ fontSize: 13.5, fontWeight: done ? 700 : 500, color: done ? '#111827' : '#9ca3af', paddingBottom: i < STATUS_STEPS.length - 1 ? 20 : 0 }}>
                        {STATUS_LABEL[step]}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
              <p style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 8, color: '#374151' }}>Rincian Pesanan</p>
              {result.items.map((item: any, i: number) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                  <span style={{ color: '#6b7280' }}>{item.name} × {item.quantity}</span>
                  <span>Rp{item.subtotal.toLocaleString('id-ID')}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 14, marginTop: 8, paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>
                <span>Total</span>
                <span style={{ color: BLUE_DARK }}>Rp{result.totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
