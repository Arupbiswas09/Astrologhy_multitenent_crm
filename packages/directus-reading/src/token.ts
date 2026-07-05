import { SignJWT, jwtVerify } from "jose";

/** Signed report tokens — HMAC JWT, 30-day expiry (docs/02 §4). */

const EXPIRY = "30d";

function key(secret: string): Uint8Array {
  if (!secret || secret.length < 16) {
    throw new Error("REPORT_TOKEN_SECRET missing or too short");
  }
  return new TextEncoder().encode(secret);
}

export async function signReportToken(
  leadId: string,
  tenantSlug: string,
  secret: string,
): Promise<string> {
  return new SignJWT({ tnt: tenantSlug })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(leadId)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(key(secret));
}

export async function verifyReportToken(
  token: string,
  secret: string,
): Promise<{ leadId: string; tenantSlug: string } | null> {
  try {
    const { payload } = await jwtVerify(token, key(secret), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.tnt !== "string") return null;
    return { leadId: payload.sub, tenantSlug: payload.tnt };
  } catch {
    return null;
  }
}
