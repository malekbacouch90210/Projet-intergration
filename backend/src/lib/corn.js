import cron from "cron";
import { sql } from "./db.js"; // your Neon/Postgres connection

/**
 * This cron job will run every 14 minutes.
 * You can customize it to do periodic auth-related tasks,
 * like updating last_login, cleaning expired tokens, etc.
 */
const cronAuth = new cron.CronJob("*/14 * * * *", async function () {
  try {
    // Example: set a "heartbeat" timestamp for all users
    // (or perform maintenance tasks, like clearing expired tokens)
    await sql`
      UPDATE users
      SET updated_at = CURRENT_TIMESTAMP
      WHERE last_login IS NOT NULL
    `;

    console.log("CronAuth ran successfully at", new Date().toISOString());
  } catch (error) {
    console.error("CronAuth error:", error);
  }
});

export default cronAuth;
