import argon2 from "argon2";
import type { StorageAdapter } from "../storage";

export async function setPIN(
  userId: string,
  pin: string,
  store: StorageAdapter
) {
  if (!/^\d{6}$/.test(pin)) throw new Error("PIN must be 6 digits");
  const hash = await argon2.hash(pin, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 3,
  });
  await store.enableFactor(userId, "PIN", { hash });
  return true;
}

export async function verifyPIN(
  userId: string,
  pin: string,
  store: StorageAdapter
) {
  const data = await store.getFactor(userId, "PIN");
  return !!(data?.hash && (await argon2.verify(data.hash, pin)));
}
