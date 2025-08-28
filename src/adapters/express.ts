import type { Request, Response, NextFunction } from "express";

export function cfHeaderNormalizer() {
  return (req: Request, _res: Response, next: NextFunction) => {
    const h = req.headers as Record<string, string | undefined>;
    const set = (k: string, v: string) => (req.headers[k] = v);
    const ip =
      h["cf-connecting-ip"] ||
      h["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      "";
    set("x-client-ip", ip);
    set("x-client-country", h["cf-ipcountry"] || "XX");
    set("x-client-ray", h["cf-ray"] || "");
    set("x-client-ua", h["user-agent"] || "");
    if (h["cf-bot-score"]) set("x-client-bot-score", h["cf-bot-score"]!);
    set("x-client-device", h["sec-ch-ua"] || "");
    set("x-client-platform", h["sec-ch-ua-platform"] || "");
    set("x-client-mobile", h["sec-ch-ua-mobile"] || "");
    next();
  };
}
