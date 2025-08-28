import type { Decision, RiskContext } from "./types";

export function decide(ctx: RiskContext): Decision {
  const botty = typeof ctx.botScore === "number" && ctx.botScore < 30;
  const foreign = ctx.country !== "IN";
  const sensitive = ["password_change", "payout", "sensitive"].includes(
    ctx.action
  );
  const unfamiliar = !ctx.deviceTrusted || foreign || botty;

  if (ctx.userFactors.passkey && !unfamiliar && !sensitive) {
    return {
      required: ["PASSKEY"],
      allowFallbackOrder: ["TOTP", "OTP", "PIN"],
      rememberDevice: true,
    };
  }
  if (sensitive || unfamiliar) {
    if (ctx.userFactors.passkey && ctx.userFactors.totp) {
      return {
        required: ["PASSKEY", "TOTP"],
        allowFallbackOrder: ["OTP", "PIN"],
        rememberDevice: false,
        requireTurnstile: botty,
      };
    }
    if (ctx.userFactors.totp) {
      return {
        required: ["TOTP"],
        allowFallbackOrder: ["OTP", "PIN"],
        rememberDevice: false,
        requireTurnstile: botty,
      };
    }
    return {
      required: ["OTP"],
      allowFallbackOrder: ["PIN"],
      rememberDevice: false,
      requireTurnstile: botty,
    };
  }
  return {
    required: ["TOTP"],
    allowFallbackOrder: ["OTP", "PIN"],
    rememberDevice: true,
    requireTurnstile: botty,
  };
}

export type PolicyRule = (ctx: RiskContext, draft: Decision) => Decision;
export function makePolicy(rules: PolicyRule[]) {
  return (ctx: RiskContext) => {
    let d: Decision = {
      required: ["TOTP"],
      allowFallbackOrder: ["OTP", "PIN"],
      rememberDevice: true,
    };
    for (const r of rules) d = r(ctx, d);
    return d;
  };
}
