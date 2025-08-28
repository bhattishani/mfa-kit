export async function signPath(sigKey: string, path: string, ts: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(sigKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${ts}:${path}`)
  );
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

export async function verifyHeader(
  sigKey: string,
  value: string | null,
  path: string
) {
  if (!value) return false;
  const [v, ts, b64] = value.split(" ");
  if (v !== "v1" || !ts || !b64) return false;
  const expect = await signPath(sigKey, path, ts);
  return expect === b64;
}
