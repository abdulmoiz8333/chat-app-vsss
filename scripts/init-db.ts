import { Pool } from "pg";
import bcrypt from "bcrypt";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const client = await pool.connect();

  try {
    console.log("Creating tables...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id),
        role TEXT NOT NULL CHECK (role IN ('user','assistant')),
        content TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const exists = await client.query(
      "SELECT id FROM users WHERE email = $1",
      ["admin@example.com"]
    );

    if (exists.rows.length === 0) {
      const hash = await bcrypt.hash("admin123", 10);

      await client.query(
        "INSERT INTO users (email, password_hash) VALUES ($1, $2)",
        ["admin@example.com", hash]
      );

      console.log("Demo user created");
    } else {
      console.log("Demo user already exists");
    }

    console.log("Database initialization complete");
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);