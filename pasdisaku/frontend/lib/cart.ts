export interface CartItem {
  id: string;
  slug: string;
  name: string;
  price: number;
  image?: string | null;
  qty: number;
}

const CART_KEY = 'pasdisaku_cart';

function readCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('cart-updated'));
}

export function getCart(): CartItem[] {
  return readCart();
}

export function addToCart(item: Omit<CartItem, 'qty'>, qty = 1) {
  const cart = readCart();
  const existing = cart.find((c) => c.id === item.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ ...item, qty });
  }
  writeCart(cart);
}

export function updateQty(id: string, qty: number) {
  let cart = readCart();
  if (qty <= 0) {
    cart = cart.filter((c) => c.id !== id);
  } else {
    cart = cart.map((c) => (c.id === id ? { ...c, qty } : c));
  }
  writeCart(cart);
}

export function removeFromCart(id: string) {
  const cart = readCart().filter((c) => c.id !== id);
  writeCart(cart);
}

export function clearCart() {
  writeCart([]);
}

export function cartTotal(cart: CartItem[]): number {
  return cart.reduce((sum, c) => sum + c.price * c.qty, 0);
}

export function cartCount(cart: CartItem[]): number {
  return cart.reduce((sum, c) => sum + c.qty, 0);
}
