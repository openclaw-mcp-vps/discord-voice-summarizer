import { createHmac } from "node:crypto";

const ACCESS_COOKIE_NAME = "dvs_paid_access";
const ACCESS_COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30;

interface AccessPayload {
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

function getAccessSecret(): string {
  return (
    process.env.ACCESS_COOKIE_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    "local-dev-access-secret"
  );
}

function sign(input: string): string {
  return createHmac("sha256", getAccessSecret())
    .update(input)
    .digest("base64url");
}

export function buildAccessToken(userId: string, email: string): {
  token: string;
  expiresAt: Date;
} {
  const nowSeconds = Math.floor(Date.now() / 1000);

  const payload: AccessPayload = {
    sub: userId,
    email: email.trim().toLowerCase(),
    iat: nowSeconds,
    exp: nowSeconds + ACCESS_COOKIE_TTL_SECONDS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(encodedPayload);

  return {
    token: `${encodedPayload}.${signature}`,
    expiresAt: new Date(payload.exp * 1000),
  };
}

export function verifyAccessToken(
  token: string | undefined,
  expectedEmail?: string,
): boolean {
  if (!token) {
    return false;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return false;
  }

  const expectedSignature = sign(encodedPayload);
  if (expectedSignature !== signature) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as AccessPayload;

    if (payload.exp * 1000 <= Date.now()) {
      return false;
    }

    if (
      expectedEmail &&
      payload.email !== expectedEmail.trim().toLowerCase()
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export { ACCESS_COOKIE_NAME, ACCESS_COOKIE_TTL_SECONDS };
