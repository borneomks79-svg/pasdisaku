'use client';

import { useState } from 'react';
import { api } from '../../../lib/api';

export default function SettingsPage() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupStatus, setBackupStatus] = useState('');

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setStatus('');

    if (newPassword.length < 8) {
      setStatus('Password baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      setStatus('Password berhasil diganti. Gunakan password baru saat login berikutnya.');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setStatus('Gagal: ' + (err?.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  }

  async function handleBackup() {
    setBackupLoading(true);
    setBackupStatus('');
    try {
      const res = await api.get('/backup/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const filename = `pasdisaku-backup-${new Date().toISOString().slice(0, 10)}.json`;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      setBackupStatus('Backup berhasil diunduh. Simpan file ini di tempat aman (Google Drive/HP).');
    } catch (err: any) {
      setBackupStatus('Gagal: ' + (err?.response?.data?.message || err.message));
    } finally {
      setBackupLoading(false);
    }
  }

  return (
    <div className="container">
      <h1 style={{ marginBottom: 20 }}>Pengaturan Akun</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 12 }}>Ganti Password</h3>
        <form onSubmit={handleChangePassword}>
          <div style={{ marginBottom: 10 }}>
            <input
              type="password"
              placeholder="Password lama"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <input
              type="password"
              placeholder="Password baru (minimal 8 karakter)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div style={{ marginBottom: 10 }}>
            <input
              type="password"
              placeholder="Konfirmasi password baru"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Menyimpan...' : 'Ganti Password'}
          </button>
        </form>
        {status && <p style={{ marginTop: 12 }}>{status}</p>}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 12 }}>💾 Backup Data</h3>
        <p style={{ color: '#718096', fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
          Unduh salinan semua data toko (produk, kategori, pesanan, kontak WhatsApp) sebagai file JSON.
          Lakukan ini secara berkala (misal seminggu sekali) dan simpan filenya di Google Drive atau HP,
          sebagai jaga-jaga kalau suatu saat perlu memulihkan data.
        </p>
        <button className="btn" onClick={handleBackup} disabled={backupLoading}>
          {backupLoading ? 'Menyiapkan backup...' : '⬇️ Unduh Backup Sekarang'}
        </button>
        {backupStatus && <p style={{ marginTop: 12 }}>{backupStatus}</p>}
      </div>
    </div>
  );
}
