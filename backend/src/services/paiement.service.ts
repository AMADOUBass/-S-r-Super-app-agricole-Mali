// Service de paiement via CinetPay
// Gère l'initiation du paiement escrow et la vérification des transactions
// CinetPay supporte Orange Money et Moov Money au Mali

import axios from 'axios';
import { CinetPayInitParams } from '../types';

const BASE_URL = process.env.CINETPAY_BASE_URL || 'https://api-checkout.cinetpay.com/v2';

// ─────────────────────────────────────────────────────────────
// Initier un paiement (retourne l'URL de paiement CinetPay)
// ─────────────────────────────────────────────────────────────
export const initierPaiement = async (params: CinetPayInitParams): Promise<{
  payment_url: string;
  transaction_id: string;
}> => {
  const response = await axios.post(`${BASE_URL}/payment`, {
    apikey: process.env.CINETPAY_API_KEY,
    site_id: process.env.CINETPAY_SITE_ID,
    transaction_id: params.transaction_id,
    amount: params.amount,
    currency: params.currency,
    alternative_currency: '',
    description: params.description,
    customer_name: params.customer_name,
    customer_phone_number: params.customer_phone_number,
    customer_email: '',                // pas d'email dans Sɔrɔ
    customer_address: '',
    customer_city: 'Bamako',
    customer_country: 'ML',
    customer_state: 'ML',
    customer_zip_code: '',
    return_url: params.return_url,
    notify_url: params.notify_url,
    channels: 'MOBILE_MONEY',          // Orange Money + Moov Money uniquement
    metadata: JSON.stringify({ source: 'soro' }),
    lang: 'fr',
  });

  const { data } = response.data;

  if (!data?.payment_url) {
    throw new Error(`CinetPay: ${response.data.message || 'Erreur inconnue'}`);
  }

  return {
    payment_url: data.payment_url,
    transaction_id: params.transaction_id,
  };
};

// ─────────────────────────────────────────────────────────────
// Vérifier le statut d'un paiement (anti-fraude webhook)
// À appeler TOUJOURS depuis le webhook avant de marquer comme payé
// ─────────────────────────────────────────────────────────────
export const verifierPaiement = async (transactionId: string): Promise<{
  status: string;
  amount: number;
  payment_method: string;
}> => {
  const response = await axios.post(`${BASE_URL}/payment/check`, {
    apikey: process.env.CINETPAY_API_KEY,
    site_id: process.env.CINETPAY_SITE_ID,
    transaction_id: transactionId,
  });

  const { data } = response.data;

  return {
    status: data?.status || 'REFUSED',
    amount: data?.amount || 0,
    payment_method: data?.payment_method || '',
  };
};
