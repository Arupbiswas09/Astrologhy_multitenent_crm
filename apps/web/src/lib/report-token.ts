import "server-only";
import { SignJWT, jwtVerify } from "jose";

/**
 * Signed report tokens (docs/02 §4/§7): HMAC JWT, 30-day expiry, no
 * sequential IDs. Payload: subject = lead id, `tnt` = tenant slug.
 */

const EXPIRY = "30d";

function secretKey(): Uint8Array {
  const secret = process.env.REPORT_TOKEN_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("REPORT_TOKEN_SECRET missing or too short (16+ chars required)");
  }
  return new TextEncoder().encode(secret);
}

export async function signReportToken(leadId: string, tenantSlug: string): Promise<string> {
  return new SignJWT({ tnt: tenantSlug })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(leadId)
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .sign(secretKey());
}

export interface ReportTokenPayload {
  leadId: string;
  tenantSlug: string;
}

/** Returns null for anything invalid or expired — caller 404s. */
export async function verifyReportToken(token: string): Promise<ReportTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.tnt !== "string") return null;
    return { leadId: payload.sub, tenantSlug: payload.tnt };
  } catch {
    return null;
  }
}
