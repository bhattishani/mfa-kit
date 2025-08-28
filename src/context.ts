import type { RiskContext } from "./types";

/**
 * Creates a RiskContext object from HTTP headers
 * @param action - The action being performed
 * @param userFactors - User's authentication factors
 * @param deviceTrusted - Whether the current device is trusted
 * @param getHeader - Function to get header values (defaults to global headers if available)
 * @returns RiskContext object with parsed header values
 */
export function headerCtx(
  action: RiskContext["action"],
  userFactors: RiskContext["userFactors"],
  deviceTrusted: boolean,
  getHeader: (k: string) => string | null = (k) => {
    // In environments with global headers (like Next.js), they can be provided
    // Otherwise, this should be overridden by the adapter
    return null;
  }
): RiskContext {
  const h = (k: string): string => getHeader(k) ?? "";
  const maybe = (k: string): string | undefined => getHeader(k) ?? undefined;

  // Safely get first IP from x-forwarded-for
  const getFirstIp = (forwardedFor: string): string => {
    const ips = forwardedFor.split(",");
    return ips.length > 0 ? ips[0].trim() : "";
  };

  // Safely parse bot score
  const parseBotScore = (value: string | undefined): number | undefined => {
    if (!value) return undefined;
    const score = Number(value);
    return !isNaN(score) ? score : undefined;
  };

  return {
    ip:
      h("x-client-ip") ||
      h("cf-connecting-ip") ||
      getFirstIp(h("x-forwarded-for")) ||
      "",
    country: h("x-client-country") || h("cf-ipcountry") || "XX",
    ua: h("x-client-ua") || h("user-agent"),
    device: h("x-client-device") || h("sec-ch-ua"),
    platform: h("x-client-platform") || h("sec-ch-ua-platform"),
    mobile: h("x-client-mobile") || h("sec-ch-ua-mobile"),
    ray: h("x-client-ray") || h("cf-ray"),
    botScore: parseBotScore(
      maybe("x-client-bot-score") || maybe("cf-bot-score")
    ),
    deviceTrusted,
    action,
    userFactors,
  };
}
