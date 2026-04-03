// Service de paiement via Flutterwave (nouvelle API OAuth 2025)
// Flow : OAuth token → Customer → PaymentMethod → Charge → redirect URL
// Sandbox : developersandbox-api.flutterwave.com

import axios from 'axios';

const IS_SANDBOX = process.env.NODE_ENV !== 'production';
const API_BASE = IS_SANDBOX
  ? 'https://developersandbox-api.flutterwave.com'
  : 'https://api.flutterwave.com';

const TOKEN_URL =
  'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token';

// ─────────────────────────────────────────────────────────────
// 0. OAuth token (valide 10 min — générer à chaque appel)
// ─────────────────────────────────────────────────────────────
const getAccessToken = async (): Promise<string> => {
  const params = new URLSearchParams({
    client_id: process.env.FLUTTERWAVE_CLIENT_ID!,
    client_secret: process.env.FLUTTERWAVE_CLIENT_SECRET!,
    grant_type: 'client_credentials',
  });

  const res = await axios.post(TOKEN_URL, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  const token = res.data?.access_token;
  if (!token) throw new Error('Flutterwave: access token introuvable');
  return token;
};

// En-têtes communs
const headers = (token: string, traceId: string, idempotencyKey?: string) => ({
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
  'X-Trace-Id': traceId,
  ...(idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {}),
});

// ─────────────────────────────────────────────────────────────
// 1. Créer un customer Flutterwave
// ─────────────────────────────────────────────────────────────
const creerCustomer = async (
  token: string,
  traceId: string,
  params: { nom: string; telephone: string }
): Promise<string> => {
  const [prenom, ...reste] = params.nom.trim().split(' ');
  const telephone = params.telephone.replace(/^\+/, '');

  const res = await axios.post(
    `${API_BASE}/customers`,
    {
      name: { first: prenom || 'Client', last: reste.join(' ') || 'Soro' },
      phone: { country_code: '223', number: telephone.replace(/^223/, '') },
      email: `client-${traceId}@soro.ml`,
    },
    { headers: headers(token, traceId, traceId) }
  );

  const id = res.data?.data?.id;
  if (!id) throw new Error(`Flutterwave: customer non créé — ${JSON.stringify(res.data)}`);
  return id;
};

// ─────────────────────────────────────────────────────────────
// 2. Créer un payment method Mobile Money
// En sandbox : Ghana (233/MTN) car Mali n'est pas supporté en test
// En production : Mali (223/orange ou moov)
// ─────────────────────────────────────────────────────────────
const creerPaymentMethod = async (
  token: string,
  traceId: string,
  telephone: string,
  network: string = 'orange'
): Promise<string> => {
  // Valeurs sandbox forcées (le sandbox ne supporte que certains pays test)
  const countryCode = IS_SANDBOX ? '233' : '223';
  const networkSandbox = IS_SANDBOX ? 'MTN' : network;
  const numero = IS_SANDBOX ? '9012345678' : telephone.replace(/^\+?223/, '');

  const res = await axios.post(
    `${API_BASE}/payment-methods`,
    {
      type: 'mobile_money',
      mobile_money: {
        country_code: countryCode,
        network: networkSandbox,
        phone_number: numero,
      },
    },
    { headers: headers(token, traceId, `pm-${traceId}`) }
  );

  if (!res.data?.data?.id) {
    throw new Error(`Flutterwave payment-method: ${JSON.stringify(res.data?.error || res.data)}`);
  }
  return res.data.data.id;
};

// ─────────────────────────────────────────────────────────────
// PRINCIPALE : Initier un paiement Mobile Money
// Retourne le lien de redirection vers la page Flutterwave
// ─────────────────────────────────────────────────────────────
export const initierPaiement = async (params: {
  transaction_id: string;
  amount: number;
  currency: string;
  customer_name: string;
  customer_phone_number: string;
  network?: string;          // 'orange' (défaut) | 'moov'
  description: string;
  return_url: string;
}): Promise<{ payment_url: string; transaction_id: string }> => {
  const token = await getAccessToken();
  const traceId = params.transaction_id.slice(-12);

  // Étape 1 : customer
  const customerId = await creerCustomer(token, traceId, {
    nom: params.customer_name,
    telephone: params.customer_phone_number,
  });

  // Étape 2 : payment method Mobile Money
  const paymentMethodId = await creerPaymentMethod(
    token,
    traceId,
    params.customer_phone_number,
    params.network ?? 'orange'
  );

  // Étape 3 : charge avec redirect (X-Scenario-Key pour le sandbox)
  const chargeHeaders: Record<string, string> = {
    ...headers(token, traceId, `chg-${traceId}`),
    ...(IS_SANDBOX ? { 'X-Scenario-Key': 'scenario:auth_redirect' } : {}),
  };

  const res = await axios.post(
    `${API_BASE}/charges`,
    {
      reference: params.transaction_id,
      currency: IS_SANDBOX ? 'GHS' : (params.currency || 'XOF'),
      customer_id: customerId,
      payment_method_id: paymentMethodId,
      amount: params.amount,
      redirect_url: params.return_url,
      meta: { source: 'soro', description: params.description },
    },
    { headers: chargeHeaders }
  );

  const data = res.data?.data;
  const paymentUrl =
    data?.next_action?.redirect_url?.url ||
    data?.redirect_url;

  if (!paymentUrl) {
    throw new Error(
      `Flutterwave: URL de redirection introuvable — ${JSON.stringify(res.data)}`
    );
  }

  return { payment_url: paymentUrl, transaction_id: params.transaction_id };
};

// ─────────────────────────────────────────────────────────────
// Vérifier un paiement depuis le webhook (GET /charges/{id})
// chargeId = data.id du webhook (ex: "chg_xdSlPfGXSp")
// ─────────────────────────────────────────────────────────────
export const verifierPaiement = async (chargeId: string): Promise<{
  status: string;      // 'succeeded' | 'failed' | 'pending'
  amount: number;
  tx_ref: string;      // = notre commande.id (champ "reference")
}> => {
  const token = await getAccessToken();

  const res = await axios.get(`${API_BASE}/charges/${chargeId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Trace-Id': chargeId,
    },
  });

  const data = res.data?.data;
  if (!data) throw new Error('Flutterwave verify: réponse vide');

  return {
    status: data.status,       // 'succeeded' | 'failed' | 'pending'
    amount: data.amount,
    tx_ref: data.reference,    // = notre commande.id
  };
};
