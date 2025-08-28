import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function nextMiddleware(opts?: { verifyCloudflare?: boolean }) {
  return (req: NextRequest) => {
    const h = req.headers;
    if (opts?.verifyCloudflare) {
      // Optional: if you lock origin to CF IP ranges, this is redundant.
      if (!h.get("cf-connecting-ip"))
        return new NextResponse("Forbidden", { status: 403 });
    }
    const ip =
      h.get("cf-connecting-ip") ??
      h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "";
    const requestHeaders = new Headers(h);
    requestHeaders.set("x-client-ip", ip);
    requestHeaders.set("x-client-country", h.get("cf-ipcountry") ?? "XX");
    requestHeaders.set("x-client-ray", h.get("cf-ray") ?? "");
    requestHeaders.set("x-client-ua", h.get("user-agent") ?? "");
    const botScore = h.get("cf-bot-score");
    if (botScore) requestHeaders.set("x-client-bot-score", botScore);
    requestHeaders.set("x-client-device", h.get("sec-ch-ua") ?? "");
    requestHeaders.set("x-client-platform", h.get("sec-ch-ua-platform") ?? "");
    requestHeaders.set("x-client-mobile", h.get("sec-ch-ua-mobile") ?? "");
    return NextResponse.next({ request: { headers: requestHeaders } });
  };
}
