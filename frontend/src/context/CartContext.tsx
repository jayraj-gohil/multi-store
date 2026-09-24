/* eslint-disable react-refresh/only-export-components -- hook colocated with its provider for simplicity */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AvailableProduct } from '../types/domain';

export interface CartLine {
  product: AvailableProduct;
  quantity: number;
}

interface CartContextValue {
  lines: CartLine[];
  addItem: (product: AvailableProduct, quantity: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = 'cart_lines';

function readStoredCart(): CartLine[] {
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CartLine[]) : [];
  } catch {
    return [];
  }
}

function persistCart(lines: CartLine[]) {
  try {
    if (lines.length > 0) localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines));
    else localStorage.removeItem(CART_STORAGE_KEY);
  } catch {
    // ignore — falls back to in-memory only for this session
  }
}

/**
 * Client-side cart, persisted to localStorage so it survives a page reload — the backend
 * still revalidates prices, stock and discounts at checkout, so this is UX-only storage.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => readStoredCart());

  useEffect(() => {
    persistCart(lines);
  }, [lines]);

  const addItem = (product: AvailableProduct, quantity: number) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.product.id === product.id);
      if (existing) {
        return prev.map((l) =>
          l.product.id === product.id ? { ...l, quantity: l.quantity + quantity } : l,
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const removeItem = (productId: string) => {
    setLines((prev) => prev.filter((l) => l.product.id !== productId));
  };

  const setQuantity = (productId: string, quantity: number) => {
    setLines((prev) => prev.map((l) => (l.product.id === productId ? { ...l, quantity } : l)));
  };

  const clear = () => setLines([]);

  return (
    <CartContext value={{ lines, addItem, removeItem, setQuantity, clear }}>{children}</CartContext>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
