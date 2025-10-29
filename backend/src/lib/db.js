import { neon } from "@neondatabase/serverless";
import "dotenv/config";

export const sql = neon(process.env.DATABASE_URL);

export const initDB = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        status BOOLEAN DEFAULT TRUE,
        password TEXT NOT NULL,
        last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reset_password_token TEXT,
        reset_password_expires_at TIMESTAMP,
        verification_token TEXT,
        verification_token_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    

    console.log("✅ Users table initialized!");
  } catch (error) {
    console.log("ERROR initializing DB", error);
    process.exit(1);
  }
};
