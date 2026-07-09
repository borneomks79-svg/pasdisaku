'use client';

import { useState, useRef } from 'react';
import useSWR from 'swr';
import * as XLSX from 'xlsx';
import { api } from '../../../lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

const GREEN = '#00a86b';
const GREEN_DARK = '#007a4d';

function isSentToday(lastContactedAt: string | null) {
  if (!lastContactedAt) return false;
  const d = new Date(lastContactedAt);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function normalizePhone(raw: string) {
  let s = String(raw || '').replace(/\D/g, '');
  if (s.startsWith('0')) s = '62' + s.slice(1);
  if (!s.startsWith('62') && s.length > 0) s = '62' + s;
  return s;
}

export default function WhatsappPage() {
  const { data: contacts, mutate: mutateContacts } = useSWR('/crm-whatsapp/contacts', fetcher);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [jeda, setJeda] = useState(8);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [queue, setQueue] = useState<any[]>([]);
  const [idx, setIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [log, setLog] = useState<{ text: string; ok: boolean }[]>([]);
  const [sentCount, setSentCount] = useState(0);
  const [skipCount, setSkipCount] = useState(0);

  const cdRef = useRef<any>(null);
  const stoppedRef = useRef(false);
  const pausedRef = useRef(false);

  const filteredContacts = (contacts || []).filter((c: any) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (c.name || '').toLowerCase().includes(q) || (c.phone || '').includes(q);
  });

  const totalContacts = contacts ? contacts.length : 0;
  const sentTodayCount = contacts ? contacts.filter((c: any) => isSentToday(c.lastContactedAt)).length : 0;
  const neverSentCount = contacts ? contacts.filter((c: any) => !c.lastContactedAt).length : 0;

  async function handleAddContact(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');
    try {
      await api.post('/crm-whatsapp/contacts', { name, phone: normalizePhone(phone) });
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
    if (!filteredContacts.length) return;
    const allIds = filteredContacts.map((c: any) => c.id);
    const allSelected = allIds.every((id: string) => selected.includes(id));
    setSelected(allSelected ? selected.filter((s) => !allIds.includes(s)) : [...new Set([...selected, ...allIds])]);
  }

  function handleFileSelect() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setStatus('');
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

      const contactsToImport = rows
        .map((row) => {
          const nameKey = Object.keys(row).find((k) => /nama|name/i.test(k));
          const phoneKey = Object.keys(row).find((k) => /hp|phone|telp|nomor|wa/i.test(k));
          return {
            name: nameKey ? String(row[nameKey]).trim() : '',
            phone: normalizePhone(phoneKey ? row[phoneKey] : ''),
          };
        })
        .filter((c) => c.phone.length >= 8);

      if (contactsToImport.length === 0) {
        setStatus('Tidak ada data valid ditemukan di file. Pastikan ada kolom Nama dan No HP.');
        setImporting(false);
        return;
      }

      const { data } = await api.post('/crm-whatsapp/contacts/bulk-import', { contacts: contactsToImport });
      mutateContacts();
      setStatus(`Import selesai: ${data.created} kontak diproses, ${data.skipped} dilewati (tidak ada nomor).`);
    } catch (err: any) {
      setStatus('Gagal import: ' + (err?.message || 'file tidak valid'));
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
    setRunning(false);
    setStatus(`Dihentikan. ${sentCount} terkirim, ${skipCount} dilewati.`);
  }

  return (
    <div className="container">
      <div
        style={{
          background: `linear-gradient(135deg, ${GREEN}, ${GREEN_DARK})`,
          color: 'white',
          padding: '18px 24px',
          borderRadius: 12,
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>💬 CRM WhatsApp</h1>
        <p style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>Kelola kontak dan kirim pesan massal</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: GREEN }}>{totalContacts}</p>
          <p style={{ fontSize: 11, color: '#718096' }}>Total Kontak</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: GREEN }}>{sentTodayCount}</p>
          <p style={{ fontSize: 11, color: '#718096' }}>Terkirim Hari Ini</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#d69e2e' }}>{neverSentCount}</p>
          <p style={{ fontSize: 11, color: '#718096' }}>Belum Pernah Dikirim</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 24, fontWeight: 700, color: GREEN }}>{selected.length}</p>
          <p style={{ fontSize: 11, color: '#718096' }}>Dipilih</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>📂 Import Data Kontak</h3>
        <p style={{ color: '#718096', fontSize: 13, marginBottom: 12 }}>
          Upload file Excel/CSV dengan kolom "Nama" dan "No HP" (nama kolom bebas, sistem deteksi otomatis).
        </p>
        <input type="file" ref={fileInputRef} accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileChange} />
        <button className="btn" style={{ background: '#1d6f42' }} onClick={handleFileSelect} disabled={importing}>
          {importing ? 'Mengimport...' : '📁 Import Excel/CSV'}
        </button>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>➕ Tambah Kontak Manual</h3>
        <form onSubmit={handleAddContact}>
          <div style={{ marginBottom: 10 }}>
            <input placeholder="Nama" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <input
              placeholder="Nomor WA (contoh: 08123456789)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn">Tambah Kontak</button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>📤 Kirim Massal {selected.length > 0 && `(${selected.length} kontak dipilih)`}</h3>

        {!running && (
          <>
            <textarea
              placeholder="Tulis pesan untuk semua kontak terpilih"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #e2e8f0', minHeight: 80, marginBottom: 10 }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <label style={{ fontSize: 13, color: '#4a5568' }}>Jeda antar kirim (detik):</label>
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
            <div style={{ textAlign: 'center', padding: 20, background: '#f0fff4', border: '1.5px solid #9ae6b4', borderRadius: 10, marginBottom: 16 }}>
              <p style={{ color: '#718096', marginBottom: 8, fontSize: 12 }}>
                Kontak {idx + 1} dari {queue.length}
              </p>
              <h2 style={{ marginBottom: 12, color: '#276749' }}>{queue[idx]?.name || queue[idx]?.phone}</h2>
              {countdown > 0 && !paused && (
                <>
                  <p style={{ fontSize: 32, fontWeight: 700, color: GREEN, margin: '6px 0' }}>{countdown}s</p>
                  <p style={{ fontSize: 12, color: '#718096' }}>Membuka WhatsApp berikutnya otomatis...</p>
                </>
              )}
              {paused && <p style={{ fontSize: 20, color: '#d69e2e' }}>⏸ Dijeda</p>}
            </div>

            <div style={{ marginBottom: 10 }}>
              <div style={{ background: '#e5e7eb', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                <div style={{ background: GREEN, height: 8, width: `${((idx + 1) / queue.length) * 100}%` }} />
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
              <button className="btn" style={{ background: '#e53e3e' }} onClick={stopQueue}>
                Hentikan
              </button>
            </div>

            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {log.map((l, i) => (
                <p key={i} style={{ fontSize: 13, color: l.ok ? GREEN : '#a0aec0', marginBottom: 4 }}>
                  {l.text}
                </p>
              ))}
            </div>
          </div>
        )}
      </div>

      {status && (
        <div className="card" style={{ marginBottom: 20, background: '#f0fff4', border: '1px solid #9ae6b4' }}>
          <p style={{ color: '#276749' }}>{status}</p>
        </div>
      )}

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>👥 Daftar Kontak</h3>
        <input
          placeholder="🔍 Cari nama atau nomor HP..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        {filteredContacts.length === 0 && <p style={{ color: '#a0aec0', textAlign: 'center', padding: 24 }}>Belum ada kontak.</p>}
        {filteredContacts.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>
                  <input type="checkbox" onChange={toggleSelectAll} />
                </th>
                <th>Nama</th>
                <th>Nomor</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((c: any) => (
                <tr key={c.id}>
                  <td>
                    <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} />
                  </td>
                  <td>{c.name || '-'}</td>
                  <td>{c.phone}</td>
                  <td>
                    {isSentToday(c.lastContactedAt) ? (
                      <span style={{ background: '#c6f6d5', color: '#276749', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                        ✓ Hari Ini
                      </span>
                    ) : c.lastContactedAt ? (
                      <span style={{ background: '#feebc8', color: '#7b341e', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                        Pernah Dikirim
                      </span>
                    ) : (
                      <span style={{ background: '#e2e8f0', color: '#4a5568', padding: '2px 8px', borderRadius: 12, fontSize: 11, fontWeight: 600 }}>
                        Belum Pernah
                      </span>
                    )}
                  </td>
                  <td>
                    <button className="btn" style={{ background: '#e53e3e' }} onClick={() => handleDeleteContact(c.id)}>
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
