'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '../../../lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

const STATUS_OPTIONS = ['pending', 'paid', 'processing', 'shipped', 'completed', 'cancelled'];

const STATUS_LABEL: Record<string, string> = {
  pending: 'Menunggu',
  paid: 'Dibayar',
  processing: 'Diproses',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
};

const STATUS_COLOR: Record<string, string> = {
  pending: '#d69e2e',
  paid: '#3182ce',
  processing: '#805ad5',
  shipped: '#00a86b',
  completed: '#22543d',
  cancelled: '#e53e3e',
};

export default function OrdersPage() {
  const [filter, setFilter] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const endpoint = filter ? `/orders?status=${filter}` : '/orders';
  const { data, isLoading } = useSWR(endpoint, fetcher);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      mutate(endpoint);
    } catch (err) {
      alert('Gagal mengubah status. Coba lagi.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="container">
      <h1 style={{ marginBottom: 20 }}>Pesanan</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('')}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid #cbd5e0',
            background: filter === '' ? '#2d3748' : 'white',
            color: filter === '' ? 'white' : '#2d3748',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Semua
        </button>
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: `1px solid ${STATUS_COLOR[s]}`,
              background: filter === s ? STATUS_COLOR[s] : 'white',
              color: filter === s ? 'white' : STATUS_COLOR[s],
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      <div className="card">
        {isLoading && <p>Memuat...</p>}
        {data && data.length === 0 && <p style={{ color: '#718096' }}>Belum ada pesanan.</p>}
        {data && data.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>No. Order</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Customer</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Total</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Sumber</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}></th>
              </tr>
            </thead>
            <tbody>
              {data.map((o: any) => (
                <>
                  <tr key={o.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 6px', fontWeight: 600 }}>{o.orderNumber}</td>
                    <td style={{ padding: '10px 6px' }}>
                      <div>{o.customerName || '-'}</div>
                      <div style={{ fontSize: 12, color: '#718096' }}>{o.customerPhone || ''}</div>
                    </td>
                    <td style={{ padding: '10px 6px', fontWeight: 700 }}>
                      Rp {Number(o.totalAmount).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '10px 6px' }}>
                      <select
                        value={o.status}
                        disabled={updatingId === o.id}
                        onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: `1px solid ${STATUS_COLOR[o.status] || '#cbd5e0'}`,
                          color: STATUS_COLOR[o.status] || '#2d3748',
                          fontWeight: 600,
                          fontSize: 13,
                          background: 'white',
                        }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '10px 6px', fontSize: 13, color: '#718096' }}>{o.source}</td>
                    <td style={{ padding: '10px 6px' }}>
                      <button
                        onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}
                        style={{ background: 'none', border: 'none', color: '#00a86b', fontWeight: 600, fontSize: 13 }}
                      >
                        {expandedId === o.id ? 'Tutup' : 'Detail'}
                      </button>
                    </td>
                  </tr>
                  {expandedId === o.id && (
                    <tr>
                      <td colSpan={6} style={{ padding: '0 6px 14px', background: '#f7fafc' }}>
                        <div style={{ padding: 12, borderRadius: 8, background: 'white', border: '1px solid #e2e8f0' }}>
                          <p style={{ fontSize: 12, color: '#718096', marginBottom: 8 }}>
                            Alamat: {o.customerAddress || '-'}
                          </p>
                          {o.items?.map((item: any) => (
                            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                              <span>{item.product?.name || 'Produk'} × {item.quantity}</span>
                              <span>Rp {Number(item.subtotal).toLocaleString('id-ID')}</span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
