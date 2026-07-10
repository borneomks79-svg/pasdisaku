'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '../../../lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function SuppliersPage() {
  const { data, isLoading, mutate } = useSWR('/suppliers', fetcher);
  const [name, setName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [feedUrl, setFeedUrl] = useState('');
  const [interval, setInterval] = useState('60');
  const [message, setMessage] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editWa, setEditWa] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/suppliers', {
        name,
        whatsappNumber,
        sourceType: 'csv_feed',
        apiCredentials: { feedUrl },
        syncIntervalMinutes: parseInt(interval, 10),
      });
      setName('');
      setWhatsappNumber('');
      setFeedUrl('');
      setInterval('60');
      mutate();
      setMessage('Supplier berhasil ditambahkan.');
    } catch (err: any) {
      setMessage('Gagal: ' + (err?.response?.data?.message || err.message));
    }
  }

  async function handleImport(id: string) {
    setMessage('');
    try {
      await api.post(`/suppliers/${id}/import`);
      setMessage('Import dijadwalkan, cek produk beberapa saat lagi.');
    } catch (err: any) {
      setMessage('Gagal: ' + (err?.response?.data?.message || err.message));
    }
  }

  async function handleSync(id: string) {
    setMessage('');
    try {
      await api.post(`/suppliers/${id}/sync`);
      setMessage('Sync harga/stok dijadwalkan.');
    } catch (err: any) {
      setMessage('Gagal: ' + (err?.response?.data?.message || err.message));
    }
  }

  function startEditWa(s: any) {
    setEditingId(s.id);
    setEditWa(s.whatsappNumber || '');
  }

  async function saveEditWa(id: string) {
    try {
      await api.patch(`/suppliers/${id}`, { whatsappNumber: editWa });
      setEditingId(null);
      mutate();
    } catch (err: any) {
      setMessage('Gagal simpan nomor WA: ' + (err?.response?.data?.message || err.message));
    }
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: 20 }}>Supplier</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Tambah Supplier (CSV Feed)</h3>
        <form onSubmit={handleAdd}>
          <div style={{ marginBottom: 10 }}>
            <input
              placeholder="Nama supplier"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <input
              placeholder="Nomor WhatsApp supplier (contoh: 08123456789)"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <input
              placeholder="URL feed CSV (https://...)"
              value={feedUrl}
              onChange={(e) => setFeedUrl(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <input
              type="number"
              placeholder="Interval sync (menit)"
              value={interval}
              onChange={(e) => setInterval(e.target.value)}
            />
          </div>
          <button type="submit" className="btn">Tambah Supplier</button>
        </form>
        {message && <p style={{ marginTop: 10 }}>{message}</p>}
      </div>

      <div className="card">
        {isLoading && <p>Memuat...</p>}
        {data && data.length === 0 && <p>Belum ada supplier.</p>}
        {data && data.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Nomor WA</th>
                <th>Tipe</th>
                <th>Interval</th>
                <th>Terakhir Sync</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((s: any) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>
                    {editingId === s.id ? (
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          value={editWa}
                          onChange={(e) => setEditWa(e.target.value)}
                          placeholder="08xxxxxxxxxx"
                          style={{ width: 140 }}
                        />
                        <button className="btn" onClick={() => saveEditWa(s.id)}>Simpan</button>
                        <button className="btn" style={{ background: '#a0aec0' }} onClick={() => setEditingId(null)}>Batal</button>
                      </div>
                    ) : (
                      <span onClick={() => startEditWa(s)} style={{ cursor: 'pointer', color: s.whatsappNumber ? '#2d3748' : '#a0aec0' }}>
                        {s.whatsappNumber || 'Belum diisi — klik untuk isi'}
                      </span>
                    )}
                  </td>
                  <td>{s.sourceType}</td>
                  <td>{s.syncIntervalMinutes} mnt</td>
                  <td>{s.lastSyncedAt ? new Date(s.lastSyncedAt).toLocaleString('id-ID') : '-'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" onClick={() => handleImport(s.id)}>Import</button>
                    <button className="btn" onClick={() => handleSync(s.id)}>Sync</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
