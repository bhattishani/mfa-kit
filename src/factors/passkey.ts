import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from "@simplewebauthn/server";
import type { StorageAdapter } from "../storage";

export async function beginPasskeyRegistration(
  user: { id: string; email?: string },
  rp: { id: string; name: string },
  store: StorageAdapter
) {
  if (!user.id) throw new Error("User ID is required");
  if (!rp.id) throw new Error("Relying party ID is required");

  const options = await generateRegistrationOptions({
    rpID: rp.id,
    rpName: rp.name,
    userID: Buffer.from(user.id),
    userName: user.email ?? user.id,
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  await store.setSecret(`webauthn:reg:${user.id}`, options.challenge, 300);
  return options;
}

export async function finishPasskeyRegistration(
  userId: string,
  rp: { id: string; origin: string },
  response: RegistrationResponseJSON,
  store: StorageAdapter
) {
  const expectedChallenge = await store.getSecret(`webauthn:reg:${userId}`);
  if (!expectedChallenge) {
    throw new Error("Registration challenge not found");
  }

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: rp.origin,
    expectedRPID: rp.id,
  });

  if (verification.verified && verification.registrationInfo) {
    const { credential } = verification.registrationInfo;
    await store.saveWebAuthnCredential(userId, {
      id: Buffer.from(credential.id).toString("base64url"),
      publicKey: Buffer.from(credential.publicKey).toString("base64url"),
      counter: 0,
      transports: credential.transports || [],
    });
  }
  return verification.verified;
}

export async function beginPasskeyAuth(
  userId: string,
  rpId: string,
  store: StorageAdapter
) {
  const creds = await store.getWebAuthnCredentials(userId);
  const options = await generateAuthenticationOptions({
    rpID: rpId,
    userVerification: "preferred",
    allowCredentials: creds.map((c) => ({
      id: c.id,
      type: "public-key" as const,
    })),
  });
  await store.setSecret(`webauthn:auth:${userId}`, options.challenge, 300);
  return options;
}

export async function finishPasskeyAuth(
  userId: string,
  rp: { id: string; origin: string },
  response: AuthenticationResponseJSON,
  store: StorageAdapter
) {
  const expectedChallenge = await store.getSecret(`webauthn:auth:${userId}`);
  if (!expectedChallenge) {
    throw new Error("Authentication challenge not found");
  }

  const creds = await store.getWebAuthnCredentials(userId);
  const credential = creds.find(
    (c) => c.id === Buffer.from(response.id, "base64url").toString("base64url")
  );

  if (!credential) {
    throw new Error("Authenticator not found");
  }

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: rp.origin,
    expectedRPID: rp.id,
    requireUserVerification: false,
    credential: {
      publicKey: new Uint8Array(Buffer.from(credential.publicKey, "base64url")),
      id: credential.id,
      counter: credential.counter,
    },
  });

  if (verification.verified && verification.authenticationInfo) {
    const { newCounter } = verification.authenticationInfo;
    await store.updateWebAuthnCounter(credential.id, newCounter);
  }
  return verification.verified;
}
