import { CinetPayInitParams } from '../types';
export declare const initierPaiement: (params: CinetPayInitParams) => Promise<{
    payment_url: string;
    transaction_id: string;
}>;
export declare const verifierPaiement: (transactionId: string) => Promise<{
    status: string;
    amount: number;
    payment_method: string;
}>;
//# sourceMappingURL=paiement.service.d.ts.map