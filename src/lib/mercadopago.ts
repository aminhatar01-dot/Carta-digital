const MP_API_BASE = "https://api.mercadopago.com";

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("Falta configurar MERCADOPAGO_ACCESS_TOKEN");
  return token;
}

export interface CreatePreapprovalInput {
  tenantId: string;
  tenantName: string;
  payerEmail: string;
  amount: number;
  backUrl: string;
}

export interface PreapprovalResult {
  id: string;
  init_point: string;
  status: string;
}

export async function createPreapproval(input: CreatePreapprovalInput): Promise<PreapprovalResult> {
  const response = await fetch(`${MP_API_BASE}/preapproval`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      reason: `Suscripción Comanda - ${input.tenantName}`,
      external_reference: input.tenantId,
      payer_email: input.payerEmail,
      back_url: input.backUrl,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: input.amount,
        currency_id: "ARS",
      },
      status: "pending",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Mercado Pago rechazó la solicitud: ${text}`);
  }

  return response.json();
}

export async function getPreapproval(id: string) {
  const response = await fetch(`${MP_API_BASE}/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  if (!response.ok) throw new Error("No se pudo obtener la suscripción de Mercado Pago");
  return response.json();
}

export async function getPayment(id: string) {
  const response = await fetch(`${MP_API_BASE}/v1/payments/${id}`, {
    headers: { Authorization: `Bearer ${getAccessToken()}` },
  });
  if (!response.ok) throw new Error("No se pudo obtener el pago de Mercado Pago");
  return response.json();
}

export function mapPreapprovalStatus(mpStatus: string): "active" | "past_due" | "suspended" | "canceled" {
  switch (mpStatus) {
    case "authorized":
      return "active";
    case "paused":
      return "suspended";
    case "cancelled":
      return "canceled";
    default:
      return "past_due";
  }
}
