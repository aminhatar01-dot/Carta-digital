"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency } from "@/lib/format";
import type { PublicMenuItem, PublicMenuResponse } from "@/types/public-menu";

interface CartLine {
  item: PublicMenuItem;
  quantity: number;
  notes: string;
  addonIds: string[];
}

export default function CartaPublica({ menu }: { menu: PublicMenuResponse }) {
  const { tenant, table, categories } = menu;
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "");
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [selecting, setSelecting] = useState<PublicMenuItem | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentOrderId, setSentOrderId] = useState<string | null>(null);
  const [callingWaiter, setCallingWaiter] = useState(false);
  const [waiterCalled, setWaiterCalled] = useState(false);

  const primaryColor = tenant.primary_color || "#EA580C";

  function addToCart(item: PublicMenuItem, addonIds: string[]) {
    setCart((prev) => {
      const key = JSON.stringify(addonIds.slice().sort());
      const existing = prev.find(
        (c) => c.item.id === item.id && JSON.stringify(c.addonIds.slice().sort()) === key
      );
      if (existing) {
        return prev.map((c) => (c === existing ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [...prev, { item, quantity: 1, notes: "", addonIds }];
    });
  }

  function handleProductClick(item: PublicMenuItem) {
    if (!item.available) return;
    if (item.addons.length > 0) {
      setSelecting(item);
    } else {
      addToCart(item, []);
    }
  }

  function lineTotal(line: CartLine): number {
    const addonsTotal = line.item.addons
      .filter((a) => line.addonIds.includes(a.id))
      .reduce((s, a) => s + a.price, 0);
    return (line.item.price + addonsTotal) * line.quantity;
  }

  const cartTotal = useMemo(() => cart.reduce((sum, l) => sum + lineTotal(l), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, l) => sum + l.quantity, 0), [cart]);

  function updateQuantity(index: number, delta: number) {
    setCart((prev) =>
      prev.map((c, i) => (i === index ? { ...c, quantity: c.quantity + delta } : c)).filter((c) => c.quantity > 0)
    );
  }

  async function submitOrder() {
    setError(null);
    setSending(true);
    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("submit_public_order", {
        p_qr_token: table.qr_token,
        p_customer_name: customerName || null,
        p_notes: notes || null,
        p_items: cart.map((c) => ({
          menu_item_id: c.item.id,
          quantity: c.quantity,
          notes: c.notes || null,
          addon_ids: c.addonIds,
        })),
      });
      if (rpcError) throw new Error(rpcError.message);
      setSentOrderId(data as string);
      setCart([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo enviar el pedido");
    } finally {
      setSending(false);
    }
  }

  async function callWaiter() {
    setCallingWaiter(true);
    try {
      const supabase = createClient();
      await supabase.rpc("call_waiter", { p_qr_token: table.qr_token });
      setWaiterCalled(true);
      setTimeout(() => setWaiterCalled(false), 8000);
    } finally {
      setCallingWaiter(false);
    }
  }

  if (sentOrderId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-neutral-50">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl text-white"
            style={{ backgroundColor: primaryColor }}
          >
            ✓
          </div>
          <h1 className="text-xl font-bold text-neutral-900 mb-2">¡Pedido enviado!</h1>
          <p className="text-sm text-neutral-600 mb-6">
            Tu pedido ya está en la cocina. El pago se realiza en la mesa como de costumbre.
          </p>
          <button
            onClick={() => setSentOrderId(null)}
            className="text-white font-medium rounded-lg py-2 px-6 text-sm"
            style={{ backgroundColor: primaryColor }}
          >
            Pedir algo más
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-24">
      <div
        className="h-32 w-full bg-cover bg-center"
        style={{
          backgroundColor: primaryColor,
          backgroundImage: tenant.cover_url ? `url(${tenant.cover_url})` : undefined,
        }}
      />
      <div className="px-4 -mt-8 mb-2">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-4 flex items-center gap-3">
          {tenant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenant.logo_url} alt={tenant.name} className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: primaryColor }}
            >
              {tenant.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="font-bold text-neutral-900">{tenant.name}</h1>
            <p className="text-xs text-neutral-500">Mesa {table.number}</p>
          </div>
        </div>
      </div>

      {tenant.waiter_call_enabled && (
        <div className="px-4 mb-2">
          <button
            onClick={callWaiter}
            disabled={callingWaiter}
            className="w-full text-sm font-medium border border-neutral-300 rounded-lg py-2 bg-white"
          >
            {waiterCalled ? "¡Mozo avisado!" : "Llamar al mozo"}
          </button>
        </div>
      )}

      <div className="sticky top-0 z-10 bg-neutral-50 px-4 py-2 overflow-x-auto whitespace-nowrap border-b border-neutral-200">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`inline-block mr-2 px-3 py-1.5 rounded-full text-sm font-medium ${
              activeCategory === cat.id ? "text-white" : "bg-white text-neutral-600 border border-neutral-200"
            }`}
            style={activeCategory === cat.id ? { backgroundColor: primaryColor } : undefined}
          >
            {cat.name}
          </button>
        ))}
      </div>

      <div className="px-4 py-3 space-y-3">
        {categories
          .find((c) => c.id === activeCategory)
          ?.items.map((item) => (
            <button
              key={item.id}
              onClick={() => handleProductClick(item)}
              disabled={!item.available}
              className={`w-full text-left bg-white rounded-xl border border-neutral-200 p-3 flex gap-3 ${
                !item.available ? "opacity-50" : ""
              }`}
            >
              {item.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.image_url}
                  alt={item.name}
                  loading="lazy"
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-neutral-900">{item.name}</p>
                {item.description && (
                  <p className="text-xs text-neutral-500 line-clamp-2">{item.description}</p>
                )}
                <p className="text-sm font-semibold mt-1" style={{ color: primaryColor }}>
                  {formatCurrency(item.price, tenant.currency)}
                </p>
                {!item.available && <p className="text-xs text-red-500">No disponible</p>}
              </div>
            </button>
          ))}
      </div>

      {cartCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="fixed bottom-4 left-4 right-4 rounded-xl py-3 text-white font-semibold flex items-center justify-between px-5 shadow-lg"
          style={{ backgroundColor: primaryColor }}
        >
          <span>{cartCount} producto{cartCount > 1 ? "s" : ""}</span>
          <span>{formatCurrency(cartTotal, tenant.currency)}</span>
        </button>
      )}

      {cartOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[85vh] overflow-y-auto p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-neutral-900">Tu pedido</h2>
              <button onClick={() => setCartOpen(false)} className="text-neutral-500">
                ✕
              </button>
            </div>
            <div className="space-y-3 mb-4">
              {cart.map((line, i) => (
                <div key={i} className="border border-neutral-100 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{line.item.name}</p>
                      {line.addonIds.length > 0 && (
                        <p className="text-xs text-neutral-400">
                          +{" "}
                          {line.item.addons
                            .filter((a) => line.addonIds.includes(a.id))
                            .map((a) => a.name)
                            .join(", ")}
                        </p>
                      )}
                      <p className="text-xs text-neutral-500">
                        {formatCurrency(lineTotal(line), tenant.currency)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(i, -1)}
                        className="w-6 h-6 rounded bg-neutral-100 text-sm"
                      >
                        −
                      </button>
                      <span className="text-sm w-4 text-center">{line.quantity}</span>
                      <button
                        onClick={() => updateQuantity(i, 1)}
                        className="w-6 h-6 rounded bg-neutral-100 text-sm"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && <p className="text-sm text-neutral-400">Tu carrito está vacío.</p>}
            </div>

            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Tu nombre (opcional)"
              className="w-full mb-2 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observaciones para la cocina"
              className="w-full mb-3 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              rows={2}
            />

            <div className="flex items-center justify-between font-semibold text-neutral-900 mb-3">
              <span>Total</span>
              <span>{formatCurrency(cartTotal, tenant.currency)}</span>
            </div>

            {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

            <button
              onClick={submitOrder}
              disabled={sending || cart.length === 0}
              className="w-full text-white font-medium rounded-lg py-3 text-sm disabled:opacity-50"
              style={{ backgroundColor: primaryColor }}
            >
              {sending ? "Enviando..." : "Enviar pedido a la cocina"}
            </button>
            <p className="text-xs text-neutral-400 text-center mt-2">
              El pago se realiza en la mesa, como siempre.
            </p>
          </div>
        </div>
      )}

      {selecting && (
        <ProductAddonSheet
          item={selecting}
          currency={tenant.currency}
          primaryColor={primaryColor}
          onClose={() => setSelecting(null)}
          onConfirm={(addonIds) => {
            addToCart(selecting, addonIds);
            setSelecting(null);
          }}
        />
      )}
    </div>
  );
}

function ProductAddonSheet({
  item,
  currency,
  primaryColor,
  onClose,
  onConfirm,
}: {
  item: PublicMenuItem;
  currency: string;
  primaryColor: string;
  onClose: () => void;
  onConfirm: (addonIds: string[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full p-4">
        <h3 className="font-bold text-neutral-900 mb-1">{item.name}</h3>
        {item.description && <p className="text-sm text-neutral-500 mb-3">{item.description}</p>}
        <div className="space-y-2 mb-4">
          {item.addons.map((a) => (
            <label key={a.id} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selected.has(a.id)}
                  onChange={(e) => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (e.target.checked) next.add(a.id);
                      else next.delete(a.id);
                      return next;
                    });
                  }}
                />
                {a.name}
              </span>
              <span className="text-neutral-500">+{formatCurrency(a.price, currency)}</span>
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 border border-neutral-300 rounded-lg py-2.5 text-sm">
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(Array.from(selected))}
            className="flex-1 text-white rounded-lg py-2.5 text-sm font-medium"
            style={{ backgroundColor: primaryColor }}
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
