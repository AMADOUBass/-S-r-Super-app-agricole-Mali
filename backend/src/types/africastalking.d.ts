declare module 'africastalking' {
  interface ATOptions {
    apiKey: string;
    username: string;
  }

  interface SMSService {
    send(params: {
      to: string[];
      message: string;
      from?: string;
    }): Promise<{ SMSMessageData: { Recipients: Array<{ status: string; number: string }> } }>;
  }

  interface VoiceService {
    call(params: { callFrom: string; callTo: string[] }): Promise<unknown>;
  }

  interface ATClient {
    SMS: SMSService;
    VOICE: VoiceService;
  }

  function AfricasTalking(options: ATOptions): ATClient;
  export = AfricasTalking;
}
