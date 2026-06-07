"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { formatPrice } from "@/lib/format";
import { buildMetaProductPayload, trackMetaEvent } from "@/lib/meta-pixel";
import type { CartLine } from "@/lib/types";

type CartItemInput = Omit<CartLine, "quantity">;
type AddItemResult = "added" | "limited" | "out-of-stock";

type CartContextValue = {
  items: CartLine[];
  itemCount: number;
  total: number;
  isOpen: boolean;
  hasHydrated: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItemInput, quantity: number) => AddItemResult;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  checkoutUrl: string;
  getItemQuantity: (id: string) => number;
};

const CartContext = createContext<CartContextValue | null>(null);
const storageKey = "nineilhas-cart";

function readStoredCart(): CartLine[] {
  if (typeof window === "undefined") {
    return [];
  }

  const storedValue = window.localStorage.getItem(storageKey);

  if (!storedValue) {
    return [];
  }

  try {
    const parsed = JSON.parse(storedValue) as Partial<CartLine>[];

    return parsed
      .filter((item): item is Partial<CartLine> & Pick<CartLine, "id" | "name" | "brand" | "priceInCents" | "imageUrl" | "quantity"> =>
        Boolean(
          item &&
            item.id &&
            item.name &&
            item.brand &&
            typeof item.priceInCents === "number" &&
            item.imageUrl &&
            typeof item.quantity === "number",
        ),
      )
      .map((item) => ({
        id: item.id,
        productId: item.productId ?? item.id,
        name: item.name,
        brand: item.brand,
        sizeLabel: item.sizeLabel ?? "100 ml",
        priceInCents: item.priceInCents,
        originalPriceInCents: item.originalPriceInCents ?? item.priceInCents,
        imageUrl: item.imageUrl,
        stock: typeof item.stock === "number" ? item.stock : 99,
        quantity: Math.max(1, item.quantity),
      }));
  } catch {
    return [];
  }
}

function subscribeHydration() {
  return () => undefined;
}

export function CartProvider({
  children,
  whatsappNumber,
}: {
  children: ReactNode;
  whatsappNumber: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [items, setItems] = useState<CartLine[]>(readStoredCart);
  const hasHydrated = useSyncExternalStore(subscribeHydration, () => true, () => false);

  useEffect(() => {
    const onStorage = () => {
      setItems(readStoredCart());
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    window.localStorage.setItem(storageKey, JSON.stringify(items));
  }, [hasHydrated, items]);

  const itemCount = useMemo(
    () => items.reduce((total, item) => total + item.quantity, 0),
    [items],
  );

  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.priceInCents * item.quantity, 0),
    [items],
  );

  const checkoutUrl = useMemo(() => {
    const lines = items
      .map(
        (item) =>
          `- ${item.name} ${item.sizeLabel} (${item.brand}) x${item.quantity} | ${formatPrice(item.priceInCents * item.quantity)}`,
      )
      .join("\n");

    const text = `Olá, quero encomendar estes produtos da 9 Ilhas Perfumaria\n\n${lines}\n\nTotal: ${formatPrice(total)}`;

    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
  }, [items, total, whatsappNumber]);

  const value: CartContextValue = {
    items,
    itemCount,
    total,
    isOpen,
    hasHydrated,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem: (item, quantity) => {
      if (item.stock < 1) {
        return "out-of-stock";
      }
      let result: AddItemResult | null = null;
      let trackedQuantity = 0;

      setItems((current) => {
        const existingItem = current.find((entry) => entry.id === item.id);
        const existingQuantity = existingItem?.quantity ?? 0;
        const availableQuantity = Math.max(item.stock - existingQuantity, 0);

        if (availableQuantity < 1) {
          result = "out-of-stock";
          return current;
        }

        const safeQuantity = Math.max(1, Math.min(quantity, availableQuantity));
        result = safeQuantity < quantity ? "limited" : "added";
        trackedQuantity = safeQuantity;

        if (existingItem) {
          return current.map((entry) =>
            entry.id === item.id
              ? { ...entry, quantity: Math.min(entry.quantity + safeQuantity, entry.stock) }
              : entry,
          );
        }

        return [...current, { ...item, quantity: safeQuantity }];
      });

      if (result === "added" || result === "limited") {
        trackMetaEvent(
          "AddToCart",
          buildMetaProductPayload({
            name: item.name,
            brand: item.brand,
            category: item.sizeLabel,
            value: item.priceInCents / 100,
            quantity: trackedQuantity,
          }),
        );
      }

      return result ?? "added";
    },
    updateQuantity: (id, quantity) => {
      setItems((current) =>
        current
          .map((item) =>
            item.id === id
              ? { ...item, quantity: Math.min(Math.max(quantity, 0), item.stock) }
              : item,
          )
          .filter((item) => item.quantity > 0),
      );
    },
    removeItem: (id) => {
      setItems((current) => current.filter((item) => item.id !== id));
    },
    clearCart: () => {
      setItems([]);
    },
    checkoutUrl,
    getItemQuantity: (id) => items.find((item) => item.id === id)?.quantity ?? 0,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}
