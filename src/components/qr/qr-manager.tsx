"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import type { RestaurantTable } from "@/types/database";

export default function QrManager({
  tables,
  slug,
  baseUrl,
}: {
  tables: RestaurantTable[];
  slug: string;
  baseUrl: string;
}) {
  const [dataUrls, setDataUrls] = useState<Record<string, string>>({});
  const [zipping, setZipping] = useState(false);

  useEffect(() => {
    (async () => {
      const entries = await Promise.all(
        tables.map(async (t) => {
          const url = `${baseUrl}/carta/${slug}/mesa/${t.qr_token}`;
          const dataUrl = await QRCode.toDataURL(url, { width: 512, margin: 2 });
          return [t.id, dataUrl] as const;
        })
      );
      setDataUrls(Object.fromEntries(entries));
    })();
  }, [tables, slug, baseUrl]);

  async function downloadAll() {
    setZipping(true);
    try {
      const zip = new JSZip();
      for (const t of tables) {
        const dataUrl = dataUrls[t.id];
        if (!dataUrl) continue;
        const base64 = dataUrl.split(",")[1];
        zip.file(`mesa-${t.number}.png`, base64, { base64: true });
      }
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `qr-mesas-${slug}.zip`);
    } finally {
      setZipping(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-neutral-900">QR de mesas</h1>
        <button
          onClick={downloadAll}
          disabled={zipping || tables.length === 0}
          className="bg-neutral-900 hover:bg-neutral-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg"
        >
          {zipping ? "Generando..." : "Descargar todos (.zip)"}
        </button>
      </div>
      <p className="text-neutral-500 mb-6 text-sm">
        Generá y descargá los códigos QR de cada mesa, listos para imprimir.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((t) => (
          <div key={t.id} className="bg-white border border-neutral-200 rounded-xl p-4 text-center">
            <p className="font-semibold text-neutral-900 mb-2">Mesa {t.number}</p>
            {dataUrls[t.id] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrls[t.id]} alt={`QR mesa ${t.number}`} className="w-full aspect-square" />
            ) : (
              <div className="w-full aspect-square bg-neutral-100 animate-pulse rounded-lg" />
            )}
            <a
              href={dataUrls[t.id]}
              download={`mesa-${t.number}.png`}
              className="mt-3 block text-sm text-orange-600 font-medium hover:underline"
            >
              Descargar PNG
            </a>
          </div>
        ))}
        {tables.length === 0 && (
          <p className="text-sm text-neutral-400 col-span-full">
            Todavía no hay mesas cargadas. Agregalas en Configuración &gt; Mesas y zonas.
          </p>
        )}
      </div>
    </div>
  );
}
