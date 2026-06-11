import { NextResponse } from "next/server";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import * as jose from "jose";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function POST(req: Request) {
  const { email, password } = await req.json() as { email: string; password: string };

  const res = await pool.query(
    "SELECT id, email, password_hash FROM users WHERE email = $1",
    [email]
  );
  const user = res.rows[0];
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const secret = new TextEncoder().encode(process.env.JWT_SECRET);
  const token = await new jose.SignJWT({ userId: user.id })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(secret);

  return NextResponse.json({ token });
}

