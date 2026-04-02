// Service SMS via AfricasTalking
// Envoie des SMS, gère les appels vocaux automatiques et le fallback USSD

import AfricasTalking from 'africastalking';
import { SmsSendParams } from '../types';

// Initialiser le client AfricasTalking
const at = AfricasTalking({
  apiKey: process.env.AT_API_KEY as string,
  username: process.env.AT_USERNAME as string,
});

const sms = at.SMS;

// ─────────────────────────────────────────────────────────────
// Envoyer un SMS simple
// ─────────────────────────────────────────────────────────────
export const envoyerSms = async ({ to, message }: SmsSendParams): Promise<void> => {
  try {
    const destinataires = Array.isArray(to) ? to : [to];

    await sms.send({
      to: destinataires,
      message,
      from: process.env.AT_SENDER_ID || 'SORO',
    });

    console.log(`[SMS] Envoyé à ${destinataires.join(', ')}`);
  } catch (err) {
    // Ne pas bloquer l'application si le SMS échoue
    console.error('[SMS] Erreur envoi:', err);
  }
};

// ─────────────────────────────────────────────────────────────
// Envoyer les prix du matin à un groupe d'agriculteurs
// Appelé par le cron job chaque matin à 7h
// ─────────────────────────────────────────────────────────────
export const envoyerSMSPrixMatin = async (
  telephones: string[],
  region: string,
  prixResume: string
): Promise<void> => {
  if (telephones.length === 0) return;

  const message = `Sɔrɔ — Prix ${region} aujourd'hui:\n${prixResume}\nwww.soro.ml`;

  // Envoyer par lot de 100 max (limite AfricasTalking)
  const lots = [];
  for (let i = 0; i < telephones.length; i += 100) {
    lots.push(telephones.slice(i, i + 100));
  }

  for (const lot of lots) {
    await envoyerSms({ to: lot, message });
    // Petite pause entre les lots pour éviter le rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
};

// ─────────────────────────────────────────────────────────────
// Appel vocal automatique (pour les non-lecteurs SMS)
// ─────────────────────────────────────────────────────────────
export const lancerAppelVocal = async (telephone: string, messageUrl: string): Promise<void> => {
  try {
    const voice = at.VOICE;
    // L'URL pointe vers un fichier audio MP3 en bambara hébergé sur Cloudinary
    await voice.call({
      callFrom: process.env.AT_SENDER_ID || 'SORO',
      callTo: [telephone],
    });
    console.log(`[VOICE] Appel lancé vers ${telephone}`);
  } catch (err) {
    console.error('[VOICE] Erreur appel:', err);
  }
};
