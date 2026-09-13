export function formatCurrency(value: number, currency = "ARS"): string {
  const formatted = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
  return currency === "ARS" ? `$${formatted}` : `${currency} ${formatted}`;
}

export function formatElapsed(fromIso: string): string {
  const diffMs = Date.now() - new Date(fromIso).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}min`;
}
