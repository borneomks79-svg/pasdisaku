'use client';

import useSWR from 'swr';
import { api } from '../../../lib/api';

const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default function OrdersPage() {
  const { data, isLoading } = useSWR('/orders', fetcher);

  return (
    <div className="container">
      <h1 style={{ marginBottom: 20 }}>Pesanan</h1>
      <div className="card">
        {isLoading && <p>Memuat...</p>}
        {data && (
          <table>
            <thead>
              <tr>
                <th>No. Order</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th>Sumber</th>
              </tr>
            </thead>
            <tbody>
              {data.map((o: any) => (
                <tr key={o.id}>
                  <td>{o.orderNumber}</td>
                  <td>{o.customerName || '-'}</td>
                  <td>Rp {Number(o.totalAmount).toLocaleString('id-ID')}</td>
                  <td>{o.status}</td>
                  <td>{o.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
