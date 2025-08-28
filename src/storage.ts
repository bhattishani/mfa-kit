import type { Factor, FlowTicket } from "./types";

export interface StorageAdapter {
  // User + factors
  getUserByIdentifier(
    identifier: string
  ): Promise<{ id: string; email?: string; phone?: string } | null>;
  getUserFactors(
    userId: string
  ): Promise<{ passkey: boolean; totp: boolean; otp: boolean; pin: boolean }>;
  enableFactor(
    userId: string,
    factor: Factor,
    data?: Record<string, any>
  ): Promise<void>;
  getFactor(
    userId: string,
    factor: Factor
  ): Promise<Record<string, any> | null>;

  // WebAuthn
  saveWebAuthnCredential(
    userId: string,
    cred: {
      id: string;
      publicKey: string;
      counter: number;
      transports?: string[];
    }
  ): Promise<void>;
  getWebAuthnCredentials(
    userId: string
  ): Promise<Array<{ id: string; publicKey: string; counter: number }>>;
  updateWebAuthnCounter(credentialId: string, counter: number): Promise<void>;

  // Flow tickets
  saveFlowTicket(ticket: FlowTicket): Promise<void>;
  getFlowTicket(id: string): Promise<FlowTicket | null>;
  deleteFlowTicket(id: string): Promise<void>;

  // Device trust
  trustDevice(userId: string, deviceId: string, until: number): Promise<void>;
  isDeviceTrusted(userId: string, deviceId: string): Promise<boolean>;

  // Secrets
  setSecret(key: string, value: string, ttlSec?: number): Promise<void>;
  getSecret(key: string): Promise<string | null>;
  delSecret(key: string): Promise<void>;
}

export interface OtpDelivery {
  sendSms(to: string, code: string): Promise<void>;
  sendEmail(to: string, code: string): Promise<void>;
}

export interface RateLimiter {
  take(
    key: string,
    limit: number,
    windowSec: number
  ): Promise<{ allowed: boolean; remaining: number }>;
}

export function memoryRateLimiter(): RateLimiter {
  const bucket = new Map<string, { reset: number; count: number }>();
  return {
    async take(key, limit, windowSec) {
      const now = Date.now();
      const b = bucket.get(key);
      if (!b || now > b.reset) {
        bucket.set(key, { reset: now + windowSec * 1000, count: 1 });
        return { allowed: true, remaining: limit - 1 };
      }
      if (b.count >= limit) return { allowed: false, remaining: 0 };
      b.count++;
      return { allowed: true, remaining: limit - b.count };
    },
  };
}
