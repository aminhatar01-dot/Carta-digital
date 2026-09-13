"use client";

import { useState } from "react";
import type { MenuCategory, MenuItem, MenuItemAddon } from "@/types/database";
import { formatCurrency } from "@/lib/format";
import {
  upsertCategory,
  toggleCategoryActive,
  deleteCategory,
  upsertMenuItem,
  toggleMenuItemAvailability,
  deleteMenuItem,
  upsertAddon,
  deleteAddon,
} from "@/app/(app)/carta/actions";

export default function CartaManager({
  categories,
  items,
  addons,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
  addons: MenuItemAddon[];
}) {
  const [openCategory, setOpenCategory] = useState<string | null>(categories[0]?.id ?? null);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [addonsOpenFor, setAddonsOpenFor] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 rounded-xl p-4">
        <h2 className="font-semibold text-neutral-800 mb-3">Nueva categoría</h2>
        <form
          action={async (fd) => {
            await upsertCategory(fd);
          }}
          className="flex gap-2"
        >
          <input
            name="name"
            required
            placeholder="Ej: Pizzas"
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input type="hidden" name="sort_order" value={categories.length} />
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 rounded-lg text-sm font-medium">
            Agregar
          </button>
        </form>
      </div>

      {categories.map((cat) => {
        const catItems = items.filter((i) => i.category_id === cat.id);
        const isOpen = openCategory === cat.id;
        return (
          <div key={cat.id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4">
              <button
                onClick={() => setOpenCategory(isOpen ? null : cat.id)}
                className="text-left font-semibold text-neutral-900 flex items-center gap-2"
              >
                <span>{isOpen ? "▾" : "▸"}</span>
                {cat.name}
                <span className="text-xs font-normal text-neutral-400">
                  ({catItems.length} productos)
                </span>
                {!cat.active && (
                  <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full">
                    inactiva
                  </span>
                )}
              </button>
              <div className="flex gap-2 text-xs">
                <button
                  onClick={() => toggleCategoryActive(cat.id, !cat.active)}
                  className="text-neutral-500 hover:underline"
                >
                  {cat.active ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => {
                    if (confirm(`¿Eliminar categoría "${cat.name}"? Se eliminarán sus productos.`))
                      deleteCategory(cat.id);
                  }}
                  className="text-red-500 hover:underline"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="border-t border-neutral-100 p-4 space-y-3">
                {catItems.map((item) => {
                  const itemAddons = addons.filter((a) => a.menu_item_id === item.id);
                  const isEditing = editingItem === item.id;
                  return (
                    <div key={item.id} className="border border-neutral-200 rounded-lg p-3">
                      {isEditing ? (
                        <form
                          action={async (fd) => {
                            await upsertMenuItem(fd);
                            setEditingItem(null);
                          }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-2"
                        >
                          <input type="hidden" name="id" value={item.id} />
                          <input type="hidden" name="category_id" value={cat.id} />
                          <input type="hidden" name="sort_order" value={item.sort_order} />
                          <input
                            name="name"
                            defaultValue={item.name}
                            required
                            placeholder="Nombre"
                            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                          />
                          <input
                            name="price"
                            type="number"
                            step="1"
                            defaultValue={item.price}
                            placeholder="Precio"
                            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                          />
                          <input
                            name="description"
                            defaultValue={item.description ?? ""}
                            placeholder="Descripción"
                            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm md:col-span-2"
                          />
                          <input
                            name="image_url"
                            defaultValue={item.image_url ?? ""}
                            placeholder="URL de imagen"
                            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm md:col-span-2"
                          />
                          <div className="flex gap-2 md:col-span-2">
                            <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-1.5 rounded-lg text-sm">
                              Guardar
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingItem(null)}
                              className="px-4 py-1.5 rounded-lg text-sm border border-neutral-300"
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-neutral-900">
                              {item.name}{" "}
                              {!item.available && (
                                <span className="text-xs bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full ml-1">
                                  sin stock
                                </span>
                              )}
                            </p>
                            {item.description && (
                              <p className="text-sm text-neutral-500">{item.description}</p>
                            )}
                            <p className="text-sm font-semibold text-neutral-700 mt-1">
                              {formatCurrency(item.price)}
                            </p>
                            {itemAddons.length > 0 && (
                              <p className="text-xs text-neutral-400 mt-1">
                                Adicionales: {itemAddons.map((a) => a.name).join(", ")}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 text-xs items-end shrink-0">
                            <button
                              onClick={() => toggleMenuItemAvailability(item.id, !item.available)}
                              className="text-neutral-500 hover:underline"
                            >
                              {item.available ? "Marcar sin stock" : "Marcar disponible"}
                            </button>
                            <button
                              onClick={() => setEditingItem(item.id)}
                              className="text-orange-600 hover:underline"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() =>
                                setAddonsOpenFor(addonsOpenFor === item.id ? null : item.id)
                              }
                              className="text-neutral-500 hover:underline"
                            >
                              Adicionales
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar "${item.name}"?`)) deleteMenuItem(item.id);
                              }}
                              className="text-red-500 hover:underline"
                            >
                              Eliminar
                            </button>
                          </div>
                        </div>
                      )}

                      {addonsOpenFor === item.id && (
                        <div className="mt-3 pt-3 border-t border-neutral-100 space-y-2">
                          {itemAddons.map((a) => (
                            <div key={a.id} className="flex items-center justify-between text-sm">
                              <span>
                                {a.name} — {formatCurrency(a.price)}
                              </span>
                              <button
                                onClick={() => deleteAddon(a.id)}
                                className="text-red-500 text-xs hover:underline"
                              >
                                Quitar
                              </button>
                            </div>
                          ))}
                          <form
                            action={async (fd) => {
                              await upsertAddon(fd);
                            }}
                            className="flex gap-2"
                          >
                            <input type="hidden" name="menu_item_id" value={item.id} />
                            <input
                              name="name"
                              required
                              placeholder="Ej: Extra queso"
                              className="flex-1 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                            />
                            <input
                              name="price"
                              type="number"
                              step="1"
                              placeholder="Precio"
                              className="w-28 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm"
                            />
                            <button className="text-sm bg-neutral-800 text-white px-3 rounded-lg">
                              +
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}

                <form
                  action={async (fd) => {
                    await upsertMenuItem(fd);
                  }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-2 pt-2"
                >
                  <input type="hidden" name="category_id" value={cat.id} />
                  <input type="hidden" name="sort_order" value={catItems.length} />
                  <input
                    name="name"
                    required
                    placeholder="Nuevo producto"
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm md:col-span-2"
                  />
                  <input
                    name="price"
                    type="number"
                    step="1"
                    placeholder="Precio"
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                  />
                  <button className="bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium">
                    Agregar producto
                  </button>
                </form>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
