"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CreditCard, Lock, MapPinned, Minus, Plus, Truck, Trash2, X } from "lucide-react";
import { useCart } from "@/components/providers/cart-provider";
import { formatPrice } from "@/lib/format";

const trustPoints = [
  {
    icon: MapPinned,
    label: "Entrega Local Ilha Terceira",
  },
  {
    icon: Truck,
    label: "Envio CTT",
  },
  {
    icon: CreditCard,
    label: "Pagamento por MBWay ou Transferência",
  },
  {
    icon: Lock,
    label: "Perfumes Originais",
  },
];

export function CartDrawer() {
  const { items, total, isOpen, closeCart, updateQuantity, removeItem, clearCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [isOpen]);

  async function handleCheckout() {
    if (!items.length || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            brand: item.brand,
            priceInCents: item.priceInCents,
            quantity: item.quantity,
          })),
        }),
      });

      const data = (await response.json()) as { whatsappUrl?: string };

      if (!response.ok || !data.whatsappUrl) {
        return;
      }

      clearCart();
      closeCart();
      window.open(data.whatsappUrl, "_blank", "noopener,noreferrer");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      {isOpen ? (
        <button
          aria-label="Fechar carrinho"
          className="fixed inset-0 z-40 bg-slate-950/50"
          onClick={closeCart}
        />
      ) : null}
      <aside
        className={`cart-drawer fixed right-0 top-0 z-50 flex h-[100dvh] w-full max-w-md flex-col overflow-hidden border-l border-[color:var(--line)] bg-[color:var(--sand-soft)] shadow-2xl backdrop-blur transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="border-b border-[color:var(--line)] bg-gradient-to-b from-white via-white to-[color:var(--sand-soft)]/70 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <Image
                src="/logo-9-ilhas.svg"
                alt="9 Ilhas Perfumaria"
                width={176}
                height={46}
                className="h-auto w-36"
                priority
              />
              <p className="text-[11px] uppercase tracking-[0.4em] text-[color:var(--atlantic)]">
                Carrinho
              </p>
              <h2 className="font-serif text-3xl text-[color:var(--ink)]">A sua seleção</h2>
              <p className="mt-1 text-sm text-slate-500">
                Revise os perfumes antes de finalizar a encomenda.
              </p>
            </div>
            <button
              className="rounded-full border border-[color:var(--line)] bg-white p-2 text-[color:var(--ink)] transition hover:border-[color:var(--gold)] hover:text-[color:var(--gold)]"
              onClick={closeCart}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="cart-content min-h-0 flex-1 overflow-y-auto px-6 py-6 overscroll-contain">
          {items.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-[color:var(--line)] bg-white px-6 py-10 text-center text-sm leading-7 text-slate-600 shadow-[0_16px_40px_rgba(113,80,41,0.06)]">
              O carrinho está vazio. Adicione perfumes para preparar a sua encomenda.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-[78px_1fr] gap-4 rounded-[1.5rem] border border-[color:var(--line)] bg-white p-3 shadow-[0_12px_35px_rgba(113,80,41,0.08)] transition hover:shadow-[0_16px_40px_rgba(113,80,41,0.12)]"
                >
                  <div className="relative aspect-square overflow-hidden rounded-[1.2rem] bg-[color:var(--sand-soft)]">
                    {item.imageUrl ? (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/65 p-3">
                        <Image
                          src="/logo-9-ilhas.svg"
                          alt="9 Ilhas Perfumaria"
                          width={120}
                          height={34}
                          className="h-auto w-20 opacity-75"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1">
                        <p className="text-[11px] uppercase tracking-[0.25em] text-[color:var(--atlantic)]">
                          {item.brand}
                        </p>
                        <h3 className="truncate pr-2 font-medium text-[color:var(--ink)]">
                          {item.name}
                        </h3>
                      </div>
                      <div className="text-right">
                        {item.originalPriceInCents &&
                        item.originalPriceInCents > item.priceInCents ? (
                          <p className="text-[11px] text-slate-400 line-through">
                            {formatPrice(item.originalPriceInCents)}
                          </p>
                        ) : null}
                        <p className="text-sm font-semibold text-[color:var(--ink)]">
                          {formatPrice(item.priceInCents)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--sand-soft)]/45 px-2 py-1">
                        <button
                          className="rounded-full p-1 text-[color:var(--ink)] transition hover:bg-[color:var(--sand-soft)]"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-6 text-center text-sm font-semibold">
                          {item.quantity}
                        </span>
                        <button
                          className="rounded-full p-1 text-[color:var(--ink)] transition hover:bg-[color:var(--sand-soft)] disabled:opacity-40"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <button
                        className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-500"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="cart-footer sticky bottom-0 border-t border-[color:var(--line)] bg-[color:var(--sand-soft)] px-6 py-5 shadow-[0_-14px_35px_rgba(113,80,41,0.08)]">
          <div className="mb-4 rounded-[1.75rem] border border-[color:var(--line)] bg-white p-4 shadow-[0_14px_35px_rgba(113,80,41,0.08)]">
            <div className="mb-4 flex items-center justify-between text-[color:var(--ink)]">
              <span className="text-sm uppercase tracking-[0.25em]">Total</span>
              <strong className="font-serif text-[2rem]">{formatPrice(total)}</strong>
            </div>

            <div className="grid gap-2.5 text-sm text-slate-600">
              {trustPoints.map((point) => {
                const Icon = point.icon;

                return (
                  <div key={point.label} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--sand-soft)] text-[color:var(--gold)]">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span>{point.label}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={!items.length || isSubmitting}
            className="h-[54px] w-full rounded-full bg-[color:var(--atlantic)] px-5 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(30,82,116,0.25)] transition hover:bg-[color:var(--atlantic-deep)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "A guardar pedido..." : "Finalizar encomenda no WhatsApp"}
          </button>
        </div>
      </aside>
    </>
  );
}
