import { TypeTransaction, StatutRetrait } from '@prisma/client';
export declare const portefeuilleService: {
    /**
     * Récupère ou crée le portefeuille d'un utilisateur
     */
    getOrCreatePortefeuille(utilisateurId: string): Promise<any>;
    /**
     * Crédite le solde d'un utilisateur suite à une vente ou location
     */
    ajouterFonds(utilisateurId: string, montant: number, type: TypeTransaction, referenceId?: string): Promise<any>;
    /**
     * Enregistre une demande de retrait (débit immédiat du solde "virtuel", en attente de virement réel)
     */
    initierRetrait(utilisateurId: string, montant: number, numeroPhone: string): Promise<any>;
    /**
     * Valide ou rejette une demande de retrait (Admin)
     */
    traiterRetrait(retraitId: string, nouveauStatut: StatutRetrait): Promise<any>;
};
//# sourceMappingURL=portefeuille.service.d.ts.map