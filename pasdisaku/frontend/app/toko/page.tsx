'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import axios from 'axios';

const publicApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
});

const fetcher = (url: string) => publicApi.get(url).then((res) => res.data);

export default function TokoPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useSWR(
    `/public/products?search=${encodeURIComponent(search)}&page=${page}&pageSize=12`,
    fetcher
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #00a86b, #007a4d)',
          color: 'white',
          padding: '32px 20px',
          textAlign: 'center',
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 800 }}>🛍️ Pasdisaku</h1>
        <p style={{ opacity: 0.9, marginTop: 6 }}>Belanja mudah, harga bersahabat</p>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 20 }}>
