import { NextResponse } from "next/server";
import { Pool } from "pg";
import { getUserIdFromToken } from "../../../lib/auth";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(req: Request) {
  try {
    // 🔐 AUTH CHECK
    const auth = req.headers.get("Authorization");

    if (!auth || !auth.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = auth.split(" ")[1];
    const userId = await getUserIdFromToken(token);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 📩 READ REQUEST
    const body = await req.json();
    const { query } = body;

    if (!query?.trim()) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // 🤖 GROQ AI CALL (NO SDK — SAFE FOR CLOUDFLARE)
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content:
                "You are a helpful AI support assistant. Provide clear and concise answers.",
            },
            {
              role: "user",
              content: query,
            },
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      }
    );

    const data = await groqResponse.json();

    const response =
      data?.choices?.[0]?.message?.content || "No response generated";

    // 💾 SAVE TO DATABASE
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      let convRes = await client.query(
        `
        SELECT id
        FROM conversations
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 1
        `,
        [userId]
      );

      let conversationId = convRes.rows[0]?.id;

      if (!conversationId) {
        const newConv = await client.query(
          `
          INSERT INTO conversations (user_id)
          VALUES ($1)
          RETURNING id
          `,
          [userId]
        );

        conversationId = newConv.rows[0].id;
      }

      // 👤 Save user message
      await client.query(
        `
        INSERT INTO messages (conversation_id, role, content)
        VALUES ($1, 'user', $2)
        `,
        [conversationId, query]
      );

      // 🤖 Save AI response
      await client.query(
        `
        INSERT INTO messages (conversation_id, role, content)
        VALUES ($1, 'assistant', $2)
        `,
        [conversationId, response]
      );

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }

    // ✅ RETURN RESPONSE
    return NextResponse.json({ response });
  } catch (error: any) {
    console.error("Chat API Error:", error);

    return NextResponse.json(
      { error: error?.message || "Failed to generate response" },
      { status: 500 }
    );
  }
}