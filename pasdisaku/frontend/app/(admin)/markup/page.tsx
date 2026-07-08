'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '../../../lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function MarkupPage() {
  const { data, isLoading, mutate } = useSWR('/markup-rules', fetcher);
  const [ruleType, setRuleType] = useState('percentage');
  const [value, setValue] = useState('20');
  const [message, setMessage] = useState('');

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setMessage('');
    try {
      await api.post('/markup-rules', {
        name: 'Markup Global',
        scope: 'global',
        ruleType,
        value: parseFloat(value),
        priority: 0,
      });
      mutate();
      setMessage('Aturan markup berhasil ditambahkan.');
    } catch (err: any) {
      setMessage('Gagal: ' + (err?.response?.data?.message || err.message));
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Hapus aturan ini?')) return;
    try {
      await api.delete(`/markup-rules/${id}`);
      mutate();
    } catch (err: any) {
      setMessage('Gagal hapus: ' + (err?.response?.data?.message || err.message));
    }
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: 20 }}>Aturan Markup Keuntungan</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Tambah Aturan Global</h3>
        <p style={{ color: '#6b7280', marginBottom: 12, fontSize: 14 }}>
          Aturan ini berlaku untuk semua produk kecuali ada aturan khusus per kategori/supplier.
        </p>
        <form onSubmit={handleAdd}>
          <div style={{ marginBottom: 10 }}>
            <select
              value={ruleType}
              onChange={(e) => setRuleType(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db' }}
            >
              <option value="percentage">Persentase (%)</option>
              <option value="fixed_amount">Nominal Tetap (Rp)</option>
            </select>
          </div>
          <div style={{ marginBottom: 10 }}>
            <input
              type="number"
              placeholder={ruleType === 'percentage' ? 'Contoh: 20 (artinya markup 20%)' : 'Contoh: 5000 (tambah Rp5.000)'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn">Simpan Aturan</button>
        </form>
        {message && <p style={{ marginTop: 10 }}>{message}</p>}
      </div>

      <div className="card">
        {isLoading && <p>Memuat...</p>}
        {data && data.length === 0 && <p>Belum ada aturan markup.</p>}
        {data && data.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Cakupan</th>
                <th>Tipe</th>
                <th>Nilai</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r: any) => (
                <tr key={r.id}>
                  <td>{r.name}</td>
                  <td>{r.scope}</td>
                  <td>{r.ruleType === 'percentage' ? 'Persentase' : 'Nominal'}</td>
                  <td>{r.ruleType === 'percentage' ? `${r.value}%` : `Rp ${Number(r.value).toLocaleString('id-ID')}`}</td>
                  <td>
                    <button className="btn" style={{ background: '#dc2626' }} onClick={() => handleDelete(r.id)}>
                      Hapus
                    </button>
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
