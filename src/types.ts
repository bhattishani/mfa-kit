export type Factor = "PASSKEY" | "TOTP" | "OTP" | "PIN";

export type RiskContext = {
  ip: string;
  country: string;
  ua: string;
  device: string;
  platform: string;
  mobile: string;
  ray: string;
  botScore?: number;
  deviceTrusted: boolean;
  action: "signin" | "payout" | "password_change" | "sensitive";
  userFactors: { passkey: boolean; totp: boolean; otp: boolean; pin: boolean };
};

export type Decision = {
  required: Factor[];
  allowFallbackOrder: Factor[];
  rememberDevice: boolean;
  requireTurnstile?: boolean;
};

export type FlowTicket = {
  id: string;
  userId: string;
  queue: Factor[];
  satisfied: Factor[];
  issuedAt: number;
  ip: string;
  ray: string;
  ttlSec: number;
};
