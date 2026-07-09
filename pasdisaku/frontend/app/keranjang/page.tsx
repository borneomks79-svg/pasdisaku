'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '../../lib/useCart';
import { updateQty, removeFromCart, cartTotal } from '../../lib/cart';

export default function KeranjangPage() {
  const cart = useCart();
  const router = useRouter();
  const total = cartTotal(cart);

  return (
    <div style={{ minHeight: '100vh', background: '#f7fafc' }}>
      <div style={{ background: 'linear-gradient(135deg, #00a86b, #007a4d)', color: 'white', padding: '20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Link href="/toko" style={{ color: 'white', fontSize: 20, textDecoration: 'none' }}>←</Link>
        <span style={{ fontWeight: 700 }}>Keranjang Belanja</span>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: 20 }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 60 }}>
            <p style={{ color: '#718096', marginBottom: 16 }}>Keranjang kosong.</p>
            <Link href="/toko" style={{ color: '#00a86b', fontWeight: 700 }}>Mulai belanja →</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {cart.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: 12, background: 'white', borderRadius: 12, padding: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 10, background: '#edf2f7', backgroundImage: item.image ? `url(${item.image})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#007a4d', margin: '4px 0' }}>Rp{item.price.toLocaleString('id-ID')}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: 8 }}>
                        <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ padding: '4px 10px', background: 'white', border: 'none' }}>−</button>
                        <span style={{ padding: '0 10px', fontSize: 13, fontWeight: 600 }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ padding: '4px 10px', background: 'white', border: 'none' }}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} style={{ fontSize: 12, color: '#e53e3e', background: 'none', border: 'none' }}>Hapus</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 24, background: 'white', borderRadius: 12, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ color: '#718096' }}>Subtotal</span>
                <span style={{ fontWeight: 700 }}>Rp{total.toLocaleString('id-ID')}</span>
              </div>
              <button onClick={() => router.push('/checkout')} style={{ width: '100%', padding: '14px', borderRadius: 10, border: 'none', background: '#00a86b', color: 'white', fontWeight: 700, fontSize: 15 }}>
                Lanjut ke Checkout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
