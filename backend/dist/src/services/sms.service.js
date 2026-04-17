"use strict";
// Service SMS via AfricasTalking
// Envoie des SMS, gère les appels vocaux automatiques et le fallback USSD
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.lancerAppelVocal = exports.envoyerSMSPrixMatin = exports.envoyerSms = void 0;
const africastalking_1 = __importDefault(require("africastalking"));
// Initialiser le client AfricasTalking
const at = (0, africastalking_1.default)({
    apiKey: process.env.AT_API_KEY,
    username: process.env.AT_USERNAME,
});
const sms = at.SMS;
// ─────────────────────────────────────────────────────────────
// Envoyer un SMS simple
// ─────────────────────────────────────────────────────────────
const envoyerSms = async ({ to, message }) => {
    try {
        const destinataires = Array.isArray(to) ? to : [to];
        await sms.send({
            to: destinataires,
            message,
            from: process.env.AT_SENDER_ID || 'SORO',
        });
        console.log(`[SMS] Envoyé à ${destinataires.join(', ')}`);
    }
    catch (err) {
        // Ne pas bloquer l'application si le SMS échoue
        console.error('[SMS] Erreur envoi:', err);
    }
};
exports.envoyerSms = envoyerSms;
// ─────────────────────────────────────────────────────────────
// Envoyer les prix du matin à un groupe d'agriculteurs
// Appelé par le cron job chaque matin à 7h
// ─────────────────────────────────────────────────────────────
const envoyerSMSPrixMatin = async (telephones, region, prixResume) => {
    if (telephones.length === 0)
        return;
    const message = `Sɔrɔ — Prix ${region} aujourd'hui:\n${prixResume}\nwww.soro.ml`;
    // Envoyer par lot de 100 max (limite AfricasTalking)
    const lots = [];
    for (let i = 0; i < telephones.length; i += 100) {
        lots.push(telephones.slice(i, i + 100));
    }
    for (const lot of lots) {
        await (0, exports.envoyerSms)({ to: lot, message });
        // Petite pause entre les lots pour éviter le rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
    }
};
exports.envoyerSMSPrixMatin = envoyerSMSPrixMatin;
// ─────────────────────────────────────────────────────────────
// Appel vocal automatique (pour les non-lecteurs SMS)
// ─────────────────────────────────────────────────────────────
const lancerAppelVocal = async (telephone, messageUrl) => {
    try {
        const voice = at.VOICE;
        // L'URL pointe vers un fichier audio MP3 en bambara hébergé sur Cloudinary
        await voice.call({
            callFrom: process.env.AT_SENDER_ID || 'SORO',
            callTo: [telephone],
        });
        console.log(`[VOICE] Appel lancé vers ${telephone}`);
    }
    catch (err) {
        console.error('[VOICE] Erreur appel:', err);
    }
};
exports.lancerAppelVocal = lancerAppelVocal;
//# sourceMappingURL=sms.service.js.map