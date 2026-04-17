export declare const initierPaiement: (params: {
    transaction_id: string;
    amount: number;
    currency: string;
    customer_name: string;
    customer_phone_number: string;
    network?: string;
    description: string;
    return_url: string;
}) => Promise<{
    payment_url: string;
    transaction_id: string;
    charge_id: string;
}>;
export declare const verifierPaiement: (chargeId: string) => Promise<{
    status: string;
    amount: number;
    tx_ref: string;
}>;
//# sourceMappingURL=flutterwave.service.d.ts.map