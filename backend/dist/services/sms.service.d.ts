import { SmsSendParams } from '../types';
export declare const envoyerSms: ({ to, message }: SmsSendParams) => Promise<void>;
export declare const envoyerSMSPrixMatin: (telephones: string[], region: string, prixResume: string) => Promise<void>;
export declare const lancerAppelVocal: (telephone: string, messageUrl: string) => Promise<void>;
//# sourceMappingURL=sms.service.d.ts.map