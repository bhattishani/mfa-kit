import { randomInt } from "crypto";
import type { StorageAdapter, OtpDelivery } from "../storage";

export async function requestOTP(
  address: string,
  channel: "SMS" | "EMAIL",
  store: StorageAdapter,
  delivery: OtpDelivery
) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await store.setSecret(`otp:${address}`, code, 300);
  if (channel === "SMS") await delivery.sendSms(address, `Your code: ${code}`);
  else await delivery.sendEmail(address, `Your code: ${code}`);
  return true;
}

export async function verifyOTP(
  address: string,
  code: string,
  store: StorageAdapter
) {
  const expected = await store.getSecret(`otp:${address}`);
  const ok = expected === code;
  if (ok) await store.delSecret(`otp:${address}`);
  return ok;
}
