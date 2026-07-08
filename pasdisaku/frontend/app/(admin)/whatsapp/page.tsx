'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '../../../lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function WhatsappPage() {
  const { data: contacts, mutate: mutateContacts } = useSWR('/crm-whatsapp/contacts', fetcher);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sendPhone, setSendPhone] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [status, setStatus] = useState('');

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');
    try {
      await api.post('/crm-whatsapp/contacts', { name, phone });
      setName('');
      setPhone('');
      mutateContacts();
      setStatus('Kontak berhasil ditambahkan.');
    } catch (err: any) {
      setStatus('Gagal: ' + (err?.response?.data?.message || err.message));
    }
  }

  async function handleDeleteContact(id: string) {
    if (!confirm('Hapus kontak ini?')) return;
    try {
      await api.delete(`/crm-whatsapp/contacts/${id}`);
      mutateContacts();
      setStatus('Kontak dihapus.');
    } catch (err: any) {
      setStatus('Gagal hapus: ' + (err?.response?.data?.message || err.message));
    }
  }

  function handlePickContact(phoneNumber: string) {
    setSendPhone(phoneNumber);
    setStatus(`Nomor ${phoneNumber} dipilih untuk kirim pesan.`);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');
    try {
      await api.post('/crm-whatsapp/send', { phone: sendPhone, message: sendMessage });
      setStatus('Pesan diproses untuk dikirim.');
      setSendMessage('');
    } catch (err: any) {
      setStatus('Gagal kirim: ' + (err?.response?.data?.message || err.message));
    }
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: 20 }}>CRM WhatsApp</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Tambah Kontak</h3>
        <form onSubmit={handleAddContact}>
          <div style={{ marginBottom: 10 }}>
            <input placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <input
              placeholder="Nomor WA (contoh: 628123456789)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn">Tambah Kontak</button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Kirim Pesan</h3>
        <p style={{ color: '#6b7280', marginBottom: 12, fontSize: 14 }}>
          Butuh WA_PHONE_NUMBER_ID dan WA_ACCESS_TOKEN aktif di backend (WhatsApp Business Cloud API).
          Tap "Kirim ke sini" di daftar kontak untuk mengisi nomor otomatis.
        </p>
        <form onSubmit={handleSend}>
          <div style={{ marginBottom: 10 }}>
            <input
              placeholder="Nomor tujuan"
              value={sendPhone}
              onChange={(e) => setSendPhone(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <textarea
              placeholder="Isi pesan"
              value={sendMessage}
              onChange={(e) => setSendMessage(e.target.value)}
              required
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', minHeight: 80 }}
            />
          </div>
          <button type="submit" className="btn">Kirim</button>
        </form>
      </div>

      {status && (
        <div className="card" style={{ marginBottom: 20 }}>
          <p>{status}</p>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>Daftar Kontak</h3>
        {contacts && contacts.length === 0 && <p>Belum ada kontak.</p>}
        {contacts && contacts.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Nomor</th>
                <th>Terakhir Dihubungi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c: any) => (
                <tr key={c.id}>
                  <td>{c.name || '-'}</td>
                  <td>{c.phone}</td>
                  <td>{c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleString('id-ID') : '-'}</td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    <button className="btn" onClick={() => handlePickContact(c.phone)}>
                      Kirim ke sini
                    </button>
                    <button
                      className="btn"
                      style={{ background: '#dc2626' }}
                      onClick={() => handleDeleteContact(c.id)}
                    >
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
