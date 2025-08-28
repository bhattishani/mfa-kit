import { authenticator } from "otplib";
import QRCode from "qrcode";
import type { StorageAdapter } from "../storage";

export async function enrollTOTP(
  userId: string,
  projectName: string,
  userLabel: string,
  store: StorageAdapter
) {
  const secret = authenticator.generateSecret();
  await store.enableFactor(userId, "TOTP", { secret, verified: false });
  const uri = authenticator.keyuri(userLabel, projectName, secret);
  const qr = await QRCode.toDataURL(uri);
  return { qr, uri };
}

export async function verifyTOTP(
  userId: string,
  code: string,
  store: StorageAdapter
) {
  const data = await store.getFactor(userId, "TOTP");
  const ok = !!(data?.secret && authenticator.check(code, data.secret));
  if (ok && !data?.verified)
    await store.enableFactor(userId, "TOTP", { ...data, verified: true });
  return ok;
}

export async function checkTOTP(
  userId: string,
  code: string,
  store: StorageAdapter
) {
  const data = await store.getFactor(userId, "TOTP");
  return !!(data?.secret && authenticator.check(code, data.secret));
}
