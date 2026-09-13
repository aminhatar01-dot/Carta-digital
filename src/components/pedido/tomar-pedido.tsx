"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  MenuCategory,
  MenuItem,
  MenuItemAddon,
  OrderType,
  RestaurantTable,
} from "@/types/database";
import { formatCurrency } from "@/lib/format";
import { createOrder, type CartAddon, type CartItem } from "@/app/(app)/pedido/actions";

const ORDER_TYPES: { value: OrderType; label: string }[] = [
  { value: "salon", label: "Salón" },
  { value: "mostrador", label: "Mostrador" },
  { value: "delivery", label: "Delivery" },
  { value: "retiro", label: "Retiro" },
];

export default function TomarPedido({
  categories,
  items,
  addons,
  tables,
  currency,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
  addons: MenuItemAddon[];
  tables: RestaurantTable[];
  currency: string;
}) {
  const router = useRouter();
  const [orderType, setOrderType] = useState<OrderType>("salon");
  const [tableId, setTableId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [generalNotes, setGeneralNotes] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectingItem, setSelectingItem] = useState<MenuItem | null>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (activeCategory && item.category_id !== activeCategory) return false;
      if (search && !item.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [items, activeCategory, search]);

  const total = cart.reduce((sum, item) => {
    const addonsTotal = item.addons.reduce((s, a) => s + a.price, 0);
    return sum + (item.unit_price + addonsTotal) * item.quantity;
  }, 0);

  function addToCart(item: MenuItem, selectedAddons: CartAddon[]) {
    setCart((prev) => {
      const key = JSON.stringify(selectedAddons.map((a) => a.id).sort());
      const existing = prev.find(
        (c) => c.menu_item_id === item.id && JSON.stringify(c.addons.map((a) => a.id).sort()) === key
      );
      if (existing) {
        return prev.map((c) => (c === existing ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [
        ...prev,
        {
          menu_item_id: item.id,
          name: item.name,
          unit_price: item.price,
          quantity: 1,
          notes: "",
          addons: selectedAddons,
        },
      ];
    });
  }

  function handleProductClick(item: MenuItem) {
    const itemAddons = addons.filter((a) => a.menu_item_id === item.id);
    if (itemAddons.length > 0) {
      setSelectingItem(item);
    } else {
      addToCart(item, []);
    }
  }

  function updateQuantity(index: number, delta: number) {
    setCart((prev) =>
      prev
        .map((c, i) => (i === index ? { ...c, quantity: c.quantity + delta } : c))
        .filter((c) => c.quantity > 0)
    );
  }

  function removeItem(index: number) {
    setCart((prev) => prev.filter((_, i) => i !== index));
  }

  function updateNotes(index: number, notes: string) {
    setCart((prev) => prev.map((c, i) => (i === index ? { ...c, notes } : c)));
  }

  function submitOrder() {
    setError(null);
    startTransition(async () => {
      try {
        await createOrder({
          order_type: orderType,
          table_id: orderType === "salon" ? tableId : null,
          customer_name: customerName || null,
          notes: generalNotes || null,
          items: cart,
        });
        setCart([]);
        setGeneralNotes("");
        setCustomerName("");
        setTableId(null);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo enviar el pedido");
      }
    });
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <h1 className="text-xl font-bold text-neutral-900 mb-4">Tomar pedido</h1>

        <div className="flex flex-wrap gap-2 mb-4">
          {ORDER_TYPES.map((t) => (
            <button
              key={t.value}
              onClick={() => {
                setOrderType(t.value);
                setTableId(null);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium border ${
                orderType === t.value
                  ? "bg-orange-600 border-orange-600 text-white"
                  : "bg-white border-neutral-300 text-neutral-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {orderType === "salon" && (
          <div className="mb-5">
            <p className="text-sm font-medium text-neutral-700 mb-2">Elegí una mesa</p>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {tables.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTableId(t.id)}
                  className={`rounded-lg border py-2 text-sm font-medium ${
                    tableId === t.id
                      ? "bg-orange-600 border-orange-600 text-white"
                      : t.status === "libre"
                      ? "bg-white border-neutral-300 text-neutral-700"
                      : "bg-amber-50 border-amber-300 text-amber-700"
                  }`}
                >
                  {t.number}
                </button>
              ))}
            </div>
          </div>
        )}

        {(orderType === "delivery" || orderType === "retiro") && (
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="Nombre del cliente"
            className="w-full mb-4 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto..."
            className="flex-1 min-w-[200px] rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <select
            value={activeCategory ?? ""}
            onChange={(e) => setActiveCategory(e.target.value || null)}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              disabled={!item.available}
              onClick={() => handleProductClick(item)}
              className={`text-left rounded-xl border p-3 transition ${
                item.available
                  ? "bg-white border-neutral-200 hover:border-orange-400"
                  : "bg-neutral-50 border-neutral-200 opacity-50 cursor-not-allowed"
              }`}
            >
              <p className="font-medium text-sm text-neutral-900">{item.name}</p>
              <p className="text-sm text-neutral-500 mt-1">{formatCurrency(item.price, currency)}</p>
              {!item.available && <p className="text-xs text-red-500 mt-1">Sin stock</p>}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-96 shrink-0 border-t lg:border-t-0 lg:border-l border-neutral-200 bg-white flex flex-col">
        <div className="p-4 border-b border-neutral-200">
          <h2 className="font-semibold text-neutral-900">Comanda</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 && <p className="text-sm text-neutral-400">Sin productos aún.</p>}
          {cart.map((item, i) => (
            <div key={i} className="border border-neutral-100 rounded-lg p-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  {item.addons.length > 0 && (
                    <p className="text-xs text-neutral-400">
                      + {item.addons.map((a) => a.name).join(", ")}
                    </p>
                  )}
                  <p className="text-xs text-neutral-500">
                    {formatCurrency(
                      (item.unit_price + item.addons.reduce((s, a) => s + a.price, 0)) *
                        item.quantity,
                      currency
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQuantity(i, -1)}
                    className="w-6 h-6 rounded bg-neutral-100 text-sm"
                  >
                    −
                  </button>
                  <span className="text-sm w-4 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(i, 1)}
                    className="w-6 h-6 rounded bg-neutral-100 text-sm"
                  >
                    +
                  </button>
                  <button onClick={() => removeItem(i)} className="text-red-500 text-xs ml-2">
                    ✕
                  </button>
                </div>
              </div>
              <input
                value={item.notes}
                onChange={(e) => updateNotes(i, e.target.value)}
                placeholder="Notas (ej: sin cebolla)"
                className="w-full mt-2 rounded border border-neutral-200 px-2 py-1 text-xs"
              />
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-neutral-200 space-y-3">
          <textarea
            value={generalNotes}
            onChange={(e) => setGeneralNotes(e.target.value)}
            placeholder="Observaciones generales"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            rows={2}
          />
          <div className="flex items-center justify-between font-semibold text-neutral-900">
            <span>Total</span>
            <span>{formatCurrency(total, currency)}</span>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            onClick={submitOrder}
            disabled={pending || cart.length === 0}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-medium rounded-lg py-2.5 text-sm"
          >
            {pending ? "Enviando..." : "Mandar a la cocina"}
          </button>
        </div>
      </div>

      {selectingItem && (
        <AddonPicker
          item={selectingItem}
          addons={addons.filter((a) => a.menu_item_id === selectingItem.id)}
          currency={currency}
          onClose={() => setSelectingItem(null)}
          onConfirm={(selected) => {
            addToCart(selectingItem, selected);
            setSelectingItem(null);
          }}
        />
      )}
    </div>
  );
}

function AddonPicker({
  item,
  addons,
  currency,
  onClose,
  onConfirm,
}: {
  item: MenuItem;
  addons: MenuItemAddon[];
  currency: string;
  onClose: () => void;
  onConfirm: (selected: CartAddon[]) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-sm w-full p-5">
        <h3 className="font-semibold text-neutral-900 mb-1">{item.name}</h3>
        <p className="text-sm text-neutral-500 mb-3">Elegí los adicionales</p>
        <div className="space-y-2 mb-4">
          {addons.map((a) => (
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
          <button
            onClick={onClose}
            className="flex-1 border border-neutral-300 rounded-lg py-2 text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={() =>
              onConfirm(addons.filter((a) => selected.has(a.id)).map((a) => ({ id: a.id, name: a.name, price: a.price })))
            }
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white rounded-lg py-2 text-sm"
          >
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
