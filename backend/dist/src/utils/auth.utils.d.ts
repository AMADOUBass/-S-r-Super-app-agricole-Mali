/**
 * Utilitaires pour l'authentification
 */
/**
 * Normalise un numéro de téléphone au format international (E.164).
 * Si le numéro commence par un chiffre (ex: 60000000), on ajoute +223 par défaut.
 * Si le numéro commence déjà par +, on s'assure qu'il est propre (pas d'espaces).
 */
export declare const normaliserTelephone: (tel: string) => string;
//# sourceMappingURL=auth.utils.d.ts.map