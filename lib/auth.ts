import * as jose from "jose";

export async function getUserIdFromToken(token: string): Promise<number | null> {
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload.userId as number;
  } catch {
    return null;
  }
}