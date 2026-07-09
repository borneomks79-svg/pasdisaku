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
    <div style={{ minHeight: '100vh', background: '#fafafa', paddingBottom: cart.length > 0 ? 110 : 20 }}>
      <div
        style={{
          background: 'linear-gradient(135deg, #059669, #047857)',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <Link href="/toko" style={{ color: 'white', fontSize: 20, textDecoration: 'none', lineHeight: 1 }}>←</Link>
        <span style={{ fontWeight: 700, color: 'white', fontSize: 15 }}>Keranjang Belanja</span>
      </div>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: 16 }}>
        {cart.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 80 }}>
            <div style={{ fontSize: 48, opacity: 0.3, marginBottom: 12 }}>🛒</div>
            <p style={{ color: '#9ca3af', marginBottom: 16, fontSize: 14 }}>Keranjang kosong.</p>
            <Link href="/toko" style={{ color: '#059669', fontWeight: 700, fontSize: 14 }}>Mulai belanja →</Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {cart.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    gap: 12,
                    background: 'white',
                    borderRadius: 14,
                    padding: 12,
                    boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                  }}
                >
                  <div
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
                      backgroundImage: item.image ? `url(${item.image})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      opacity: item.image ? 1 : 0.4,
                    }}
                  >
                    {!item.image && '📦'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13.5, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#047857', margin: '4px 0 8px' }}>
                      Rp{item.price.toLocaleString('id-ID')}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', border: '1.5px solid #e5e7eb', borderRadius: 8 }}>
                        <button onClick={() => updateQty(item.id, item.qty - 1)} style={{ padding: '4px 10px', background: 'white', border: 'none', color: '#374151' }}>−</button>
                        <span style={{ padding: '0 10px', fontSize: 13, fontWeight: 700 }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.id, item.qty + 1)} style={{ padding: '4px 10px', background: 'white', border: 'none', color: '#374151' }}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.id)} style={{ fontSize: 12, color: '#dc2626', background: 'none', border: 'none', fontWeight: 600 }}>
                        Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {cart.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'white',
            boxShadow: '0 -2px 12px rgba(0,0,0,0.08)',
            padding: '14px 16px',
            maxWidth: 560,
            margin: '0 auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: '#6b7280', fontSize: 13.5 }}>Subtotal</span>
            <span style={{ fontWeight: 800, fontSize: 15 }}>Rp{total.toLocaleString('id-ID')}</span>
          </div>
          <button
            onClick={() => router.push('/checkout')}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: '#059669', color: 'white', fontWeight: 700, fontSize: 15 }}
          >
            Lanjut ke Checkout
          </button>
        </div>
      )}
    </div>
  );
}
