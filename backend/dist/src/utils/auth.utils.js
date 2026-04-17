"use strict";
/**
 * Utilitaires pour l'authentification
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.normaliserTelephone = void 0;
/**
 * Normalise un numéro de téléphone au format international (E.164).
 * Si le numéro commence par un chiffre (ex: 60000000), on ajoute +223 par défaut.
 * Si le numéro commence déjà par +, on s'assure qu'il est propre (pas d'espaces).
 */
const normaliserTelephone = (tel) => {
    if (!tel)
        return '';
    // Nettoyer les espaces, tirets et parenthèses
    let cleaned = tel.replace(/[\s\-()]/g, '');
    // Si ça commence par 00, remplacer par +
    if (cleaned.startsWith('00')) {
        cleaned = '+' + cleaned.substring(2);
    }
    // Si ça ne commence pas par +, on assume Mali (+223)
    if (!cleaned.startsWith('+')) {
        // Si c'est un numéro à 8 chiffres (standard Mali), on ajoute +223
        cleaned = '+223' + cleaned;
    }
    return cleaned;
};
exports.normaliserTelephone = normaliserTelephone;
//# sourceMappingURL=auth.utils.js.map