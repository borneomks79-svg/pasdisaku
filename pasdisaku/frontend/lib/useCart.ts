'use client';
import { useEffect, useState } from 'react';
import { getCart, CartItem } from './cart';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    setCart(getCart());
    const handler = () => setCart(getCart());
    window.addEventListener('cart-updated', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('cart-updated', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  return cart;
}
