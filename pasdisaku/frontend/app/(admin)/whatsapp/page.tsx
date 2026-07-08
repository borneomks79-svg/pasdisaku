'use client';

import { useState, useRef } from 'react';
import useSWR from 'swr';
import { api } from '../../../lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

function isSentToday(lastContactedAt: string | null) {
  if (!lastContactedAt) return false;
  const d = new Date(lastContactedAt);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export default function WhatsappPage() {
  const { data: contacts, mutate: mutateContacts } = useSWR('/crm-whatsapp/contacts', fetcher);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [jeda, setJeda] = useState(8);
  const [status, setStatus] = useState('');

  const [queue, setQueue] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [log, setLog] = useState<{ text: string; ok: boolean }[]>([]);
  const [sentCount, setSentCount] = useState(0);
  const [skipCount, setSkipCount] = useState(0);

  const timerRef = useRef<any>(null);
  const cdRef = useRef<any>(null);
  const stoppedRef = useRef(false);
  const pausedRef = useRef(false);

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

  function waLink(phoneNumber: string) {
    return `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  }

  function addLog(text: string, ok: boolean) {
    setLog((prev) => [{ text, ok }, ...prev]);
  }

  function startQueue() {
    if (selected.length === 0) {
      setStatus('Pilih minimal 1 kontak dulu.');
      return;
    }
    if (!message.trim()) {
      setStatus('Tulis pesan dulu.');
      return;
    }
    const targets = contacts.filter((c: any) => selected.includes(c.id));
    setQueue(targets);
    setIdx(0);
    setSentCount(0);
    setSkipCount(0);
    setLog([]);
    setStatus('');
    stoppedRef.current = false;
    pausedRef.current = false;
    setPaused(false);
    setRunning(true);
    processIndex(targets, 0);
  }

  async function processIndex(q: any[], i: number) {
    if (stoppedRef.current) return;
    if (i >= q.length) {
      finishQueue();
      return;
    }
    const contact = q[i];
    setIdx(i);

    if (isSentToday(contact.lastContactedAt)) {
      addLog(`⛔ ${contact.name || contact.phone} — sudah dikirim hari ini`, false);
      setSkipCount((s) => s + 1);
      advance(q, i);
      return;
    }

    window.open(waLink(contact.phone), '_blank');
    try {
      await api.post(`/crm-whatsapp/contacts/${contact.id}/mark-sent`, { message });
    } catch {
      // tidak kritis
    }
    addLog(`✅ ${contact.name || contact.phone}`, true);
    setSentCount((s) => s + 1);
    mutateContacts();
    advance(q, i);
  }

  function advance(q: any[], i: number) {
    const next = i + 1;
    if (next >= q.length) {
      setTimeout(finishQueue, 500);
      return;
    }
    startCountdown(q, next);
  }

  function startCountdown(q: any[], nextIdx: number) {
    let s = jeda;
    setCountdown(s);
    clearInterval(cdRef.current);
    cdRef.current = setInterval(() => {
      if (pausedRef.current) return;
      s--;
      setCountdown(s);
      if (s <= 0) {
        clearInterval(cdRef.current);
        processIndex(q, nextIdx);
      }
    }, 1000);
  }

  function finishQueue() {
    setRunning(false);
    setStatus(`Selesai! ${sentCount} terkirim, ${skipCount} dilewati.`);
    clearInterval(cdRef.current);
    clearTimeout(timerRef.current);
  }

  function pauseQueue() {
    pausedRef.current = true;
    setPaused(true);
  }

  function resumeQueue() {
    pausedRef.current = false;
    setPaused(false);
  }

  function stopQueue() {
    stoppedRef.current = true;
    clearInterval(cdRef.current);
    clearTimeout(timerRef.current);
    setRunning(false);
    setStatus(`Dihentikan. ${sentCount} terkirim, ${skipCount} dilewati.`);
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
        <h3 style={{ marginBottom: 12 }}>
          Kirim Massal {selected.length > 0 && `(${selected.length} kontak dipilih)`}
        </h3>

        {!running && (
          <>
            <textarea
              placeholder="Tulis pesan untuk semua kontak terpilih"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #d1d5db', minHeight: 80, marginBottom: 10 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <label style={{ fontSize: 14 }}>Jeda antar kirim (detik):</label>
              <input
                type="number"
                value={jeda}
                onChange={(e) => setJeda(Math.max(3, parseInt(e.target.value) || 8))}
                style={{ width: 70 }}
              />
            </div>
            <button className="btn" onClick={startQueue}>
              Mulai Kirim ({selected.length} Kontak)
            </button>
          </>
        )}

        {running && queue.length > 0 && (
          <div>
            <div style={{ textAlign: 'center', padding: 20, background: '#f0fdf4', borderRadius: 10, marginBottom: 16 }}>
              <p style={{ color: '#6b7280', marginBottom: 8 }}>
                Kontak {idx + 1} dari {queue.length}
              </p>
              <h2 style={{ marginBottom: 12 }}>{queue[idx]?.name || queue[idx]?.phone}</h2>
              {countdown > 0 && !paused && (
                <>
                  <p style={{ fontSize: 32, fontWeight: 700, color: '#16a34a', margin: '6px 0' }}>{countdown}s</p>
                  <p style={{ fontSize: 13, color: '#6b7280' }}>Membuka WhatsApp berikutnya otomatis...</p>
                </>
              )}
              {paused && <p style={{ fontSize: 20, color: '#d69e2e' }}>⏸ Dijeda</p>}
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ background: '#e5e7eb', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                <div
                  style={{
                    background: '#16a34a',
                    height: 8,
                    width: `${((idx + 1) / queue.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {!paused && (
                <button className="btn" style={{ background: '#d69e2e' }} onClick={pauseQueue}>
                  Jeda
                </button>
              )}
              {paused && (
                <button className="btn" onClick={resumeQueue}>
                  Lanjutkan
                </button>
              )}
              <button className="btn" style={{ background: '#dc2626' }} onClick={stopQueue}>
                Hentikan
              </button>
            </div>

            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {log.map((l, i) => (
                <p key={i} style={{ fontSize: 13, color: l.ok ? '#16a34a' : '#9ca3af', marginBottom: 4 }}>
                  {l.text}
                </p>
              ))}
            </div>
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
                  <td>
                    {c.lastContactedAt ? new Date(c.lastContactedAt).toLocaleString('id-ID') : '-'}
                    {isSentToday(c.lastContactedAt) && (
                      <span style={{ color: '#16a34a', fontSize: 12, marginLeft: 6 }}>✓ hari ini</span>
                    )}
                  </td>
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
