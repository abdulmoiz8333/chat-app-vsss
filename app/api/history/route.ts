import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getUserIdFromToken } from "@/lib/auth";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export async function GET(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const token = auth.split(" ")[1];
  const userId = await getUserIdFromToken(token);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await pool.connect();
  try {
    const convRes = await client.query(
      "SELECT id FROM conversations WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1",
      [userId]
    );
    const conversationId = convRes.rows[0]?.id;

    if (!conversationId) {
      return NextResponse.json({ messages: [] });
    }

    const msgs = await client.query(
      "SELECT role, content FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
      [conversationId]
    );

    return NextResponse.json({
      messages: msgs.rows.map((r) => ({ role: r.role, content: r.content })),
    });
  } finally {
    client.release();
  }
}