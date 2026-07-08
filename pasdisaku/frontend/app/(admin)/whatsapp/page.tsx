'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '../../../lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function WhatsappPage() {
  const { data: contacts, mutate: mutateContacts } = useSWR('/crm-whatsapp/contacts', fetcher);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [mode, setMode] = useState<'manual' | 'api'>('manual');

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
      setSelected((prev) => prev.filter((s) => s !== id));
    } catch (err: any) {
      setStatus('Gagal hapus: ' + (err?.response?.data?.message || err.message));
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  function toggleSelectAll() {
    if (!contacts) return;
    setSelected(selected.length === contacts.length ? [] : contacts.map((c: any) => c.id));
  }

  function waLink(phone: string) {
    return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(broadcastMessage)}`;
  }

  async function handleMarkSent(id: string) {
    try {
      await api.post(`/crm-whatsapp/contacts/${id}/mark-sent`, { message: broadcastMessage });
      mutateContacts();
    } catch {
      // abaikan, tidak kritis
    }
  }

  async function handleApiBroadcast(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length === 0) {
      setStatus('Pilih minimal 1 kontak dulu.');
      return;
    }
    setSending(true);
    setStatus('');
    const targets = contacts.filter((c: any) => selected.includes(c.id));
    let success = 0;
    let failed = 0;
    for (const c of targets) {
      try {
        await api.post('/crm-whatsapp/send', { phone: c.phone, message: broadcastMessage });
        success++;
      } catch {
        failed++;
      }
    }
    setSending(false);
    setStatus(`Selesai: ${success} terkirim, ${failed} gagal.`);
  }

  const selectedContacts = contacts ? contacts.filter((c: any) => selected.includes(c.id)) : [];

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
        <h3 style={{ marginBottom: 12 }}>Mode Pengiriman</h3>
        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <button
            className="btn"
            style={{ background: mode === 'manual' ? '#16a34a' : '#9ca3af' }}
            onClick={() => setMode('manual')}
          >
            Manual (buka WhatsApp)
          </button>
          <button
            className="btn"
            style={{ background: mode === 'api' ? '#16a34a' : '#9ca3af' }}
            onClick={() => setMode('api')}
          >
            Otomatis (API)
          </button>
        </div>
        <p style={{ color: '#6b7280', fontSize: 14 }}>
          {mode === 'manual'
            ? 'Mode Manual: tap "Buka WhatsApp" per kontak, pesan sudah terisi otomatis, tinggal tekan kirim di aplikasi WhatsApp.'
            : 'Mode Otomatis: butuh WA_PHONE_NUMBER_ID & WA_ACCESS_TOKEN aktif di backend (WhatsApp Business API resmi).'}
        </p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>
          Pesan {selected.length > 0 && `(${selected.length} kontak dipilih)`}
        </h3>
        <textarea
          placeholder="Tulis pesan untuk kontak terpilih"
          value={broadcastMessage}
          onChange={(e) => setBroadcastMessage(e.target.value)}
          style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', minHeight: 80, marginBottom: 10 }}
        />

        {mode === 'api' && (
          <button className="btn" onClick={handleApiBroadcast} disabled={sending}>
            {sending ? 'Mengirim...' : `Kirim Otomatis ke ${selected.length} Kontak`}
          </button>
        )}

        {mode === 'manual' && selectedContacts.length > 0 && (
          <div style={{ marginTop: 10 }}>
            {selectedContacts.map((c: any) => (
              <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <span style={{ minWidth: 150 }}>{c.name || c.phone}</span>
                <a
                  href={waLink(c.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn"
                  style={{ textDecoration: 'none', display: 'inline-block' }}
                  onClick={() => handleMarkSent(c.id)}
                >
                  Buka WhatsApp
                </a>
                {c.lastContactedAt && <span style={{ color: '#16a34a', fontSize: 13 }}>✓ Sudah dihubungi</span>}
              </div>
            ))}
          </div>
        )}
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
                <th>
                  <input type="checkbox" checked={selected.length === contacts.length} onChange={toggleSelectAll} />
                </th>
                <th>Nama</th>
                <th>Nomor</th>
                <th>Terakhir Dihubungi</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} />
                  </td>
                  <td>{c.name || '-'}</td>
                  <td>{c.phone}</td>
                  <td>{c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleString('id-ID') : '-'}</td>
                  <td>
                    <button className="btn" style={{ background: '#dc2626' }} onClick={() => handleDeleteContact(c.id)}>
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
