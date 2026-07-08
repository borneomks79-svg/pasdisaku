'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { api } from '../../../lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useSWR(
    `/products?search=${encodeURIComponent(search)}&page=${page}&pageSize=25`,
    fetcher,
  );

  return (
    <div className="container">
      <h1 style={{ marginBottom: 20 }}>Produk</h1>

      <div className="card" style={{ marginBottom: 16 }}>
        <input
          placeholder="Cari nama produk..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <div className="card">
        {isLoading && <p>Memuat...</p>}
        {data && (
          <>
            <table>
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Harga Jual</th>
                  <th>Stok</th>
                  <th>Status</th>
                  <th>Supplier</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p: any) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td>Rp {Number(p.salePrice).toLocaleString('id-ID')}</td>
                    <td>{p.stock}</td>
                    <td>{p.status}</td>
                    <td>{p.supplier?.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
              <span>
                Halaman {data.pagination.page} dari {data.pagination.totalPages} ({data.pagination.total} produk)
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </button>
                <button
                  className="btn"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Berikutnya
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
