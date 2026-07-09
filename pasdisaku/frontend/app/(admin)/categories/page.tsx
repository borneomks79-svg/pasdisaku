'use client';

import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import { api } from '../../../lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export default function CategoriesPage() {
  const { data, isLoading } = useSWR('/categories', fetcher);

  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('');
  const [keywords, setKeywords] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = async () => {
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg('Nama kategori wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      const autoRule = keywords.trim()
        ? { keywords: keywords.split(',').map((k) => k.trim()).filter(Boolean) }
        : undefined;

      await api.post('/categories', {
        name: name.trim(),
        slug: slugify(name),
        parentId: parentId || undefined,
        autoRule,
      });

      setName('');
      setParentId('');
      setKeywords('');
      mutate('/categories');
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Gagal membuat kategori.');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (cat: any) => {
    setEditingId(cat.id);
    setEditName(cat.name);
  };

  const saveEdit = async (id: string) => {
    try {
      await api.patch(`/categories/${id}`, { name: editName, slug: slugify(editName) });
      setEditingId(null);
      mutate('/categories');
    } catch {
      alert('Gagal menyimpan perubahan.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus kategori "${name}"? Produk di kategori ini akan menjadi tanpa kategori.`)) return;
    try {
      await api.delete(`/categories/${id}`);
      mutate('/categories');
    } catch {
      alert('Gagal menghapus kategori.');
    }
  };

  const categories = data || [];

  return (
    <div className="container">
      <h1 style={{ marginBottom: 20 }}>Kategori</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Tambah Kategori Baru</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 480 }}>
          <div>
            <label style={{ fontSize: 13, color: '#4a5568', display: 'block', marginBottom: 4 }}>
              Nama Kategori
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Elektronik"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e0' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 13, color: '#4a5568', display: 'block', marginBottom: 4 }}>
              Induk Kategori (opsional)
            </label>
            <select
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e0' }}
            >
              <option value="">— Tanpa induk (kategori utama) —</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 13, color: '#4a5568', display: 'block', marginBottom: 4 }}>
              Kata kunci auto-kategorisasi (opsional, pisahkan dengan koma)
            </label>
            <input
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="Misal: charger, kabel, powerbank"
              style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid #cbd5e0' }}
            />
            <p style={{ fontSize: 12, color: '#a0aec0', marginTop: 4 }}>
              Produk baru dengan nama mengandung kata ini akan otomatis masuk kategori ini saat import.
            </p>
          </div>

          {errorMsg && <p style={{ color: '#e53e3e', fontSize: 13 }}>{errorMsg}</p>}

          <button className="btn" onClick={handleCreate} disabled={submitting} style={{ alignSelf: 'flex-start' }}>
            {submitting ? 'Menyimpan...' : 'Tambah Kategori'}
          </button>
        </div>
      </div>

      <div className="card">
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>Daftar Kategori</h2>
        {isLoading && <p>Memuat...</p>}
        {categories.length === 0 && !isLoading && <p style={{ color: '#718096' }}>Belum ada kategori.</p>}
        {categories.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Nama</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Slug</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}>Induk</th>
                <th style={{ textAlign: 'left', padding: '8px 6px' }}></th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c: any) => {
                const parent = categories.find((p: any) => p.id === c.parentId);
                return (
                  <tr key={c.id} style={{ borderTop: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '10px 6px' }}>
                      {editingId === c.id ? (
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #cbd5e0' }}
                        />
                      ) : (
                        c.name
                      )}
                    </td>
                    <td style={{ padding: '10px 6px', color: '#718096', fontSize: 13 }}>{c.slug}</td>
                    <td style={{ padding: '10px 6px', color: '#718096', fontSize: 13 }}>{parent?.name || '-'}</td>
                    <td style={{ padding: '10px 6px', display: 'flex', gap: 10 }}>
                      {editingId === c.id ? (
                        <>
                          <button onClick={() => saveEdit(c.id)} style={{ background: 'none', border: 'none', color: '#00a86b', fontWeight: 600, fontSize: 13 }}>
                            Simpan
                          </button>
                          <button onClick={() => setEditingId(null)} style={{ background: 'none', border: 'none', color: '#718096', fontSize: 13 }}>
                            Batal
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEdit(c)} style={{ background: 'none', border: 'none', color: '#3182ce', fontWeight: 600, fontSize: 13 }}>
                            Edit
                          </button>
                          <button onClick={() => handleDelete(c.id, c.name)} style={{ background: 'none', border: 'none', color: '#e53e3e', fontSize: 13 }}>
                            Hapus
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
