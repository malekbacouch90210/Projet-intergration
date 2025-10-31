import { neon } from "@neondatabase/serverless";
import "dotenv/config";

export const sql = neon(process.env.DATABASE_URL);

export const initDB = async () => {
  try {
    // --- USERS TABLE ---
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

    // --- IPS TABLE ---
    await sql`
      CREATE TABLE IF NOT EXISTS ips (
        ip_id SERIAL PRIMARY KEY,
        ip_address VARCHAR(255) NOT NULL UNIQUE,
        status BOOLEAN DEFAULT TRUE,
        reason TEXT,
        date_added DATE DEFAULT CURRENT_DATE,
        CONSTRAINT ips_reason_check CHECK (
          (status = TRUE AND reason IS NULL)
          OR
          (status = FALSE AND reason IN ('spam','hack','risk'))
        )
      )
    `;

    // --- INSERT SAMPLE DATA ---
    await sql`
      INSERT INTO ips (ip_address, status, reason)
      VALUES
        ('192.168.1.1', TRUE, NULL),
        ('192.168.1.2', TRUE, NULL),
        ('192.168.1.3', TRUE, NULL),
        ('192.168.1.4', TRUE, NULL),
        ('192.168.1.5', TRUE, NULL),
        ('192.168.1.6', TRUE, NULL),
        ('192.168.1.7', TRUE, NULL),
        ('192.168.1.8', TRUE, NULL),
        ('192.168.1.9', TRUE, NULL),
        ('192.168.1.10', TRUE, NULL),
        ('192.168.1.11', TRUE, NULL),
        ('192.168.1.12', TRUE, NULL),
        ('192.168.1.13', TRUE, NULL),
        ('192.168.1.14', TRUE, NULL),
        ('192.168.1.15', TRUE, NULL),
        ('192.168.1.16', TRUE, NULL),
        ('192.168.1.17', TRUE, NULL),
        ('192.168.1.18', TRUE, NULL),
        ('192.168.1.19', TRUE, NULL),
        ('192.168.1.20', TRUE, NULL)
      ON CONFLICT (ip_address) DO NOTHING
    `;
    // ---security rules table ---
    await sql`
      CREATE TABLE IF NOT EXISTS security_rules (
        rule_id SERIAL PRIMARY KEY,
        max_failed_attempts INT NOT NULL DEFAULT 5,
        block_duration INTERVAL NOT NULL DEFAULT '1 hour',
        detection_pattern TEXT DEFAULT 'multiple_failed_logins',
        active BOOLEAN DEFAULT true
      )`;
    
    // --- failed login table ---
    await sql`
      CREATE TABLE IF NOT EXISTS login_attempts (
        attempt_id SERIAL PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        username TEXT,
        success BOOLEAN NOT NULL,
        attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`;

    // --- Reports ---
    await sql`
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        user_id INT REFERENCES users(id) ON DELETE SET NULL,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        criticity TEXT CHECK (criticity IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'low',
        status TEXT CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')) DEFAULT 'pending',
        assigned_to INT REFERENCES users(id) ON DELETE SET NULL,
        metadata JSONB DEFAULT '{}'::jsonb,
        date_created TIMESTAMP DEFAULT NOW(),
        date_updated TIMESTAMP DEFAULT NOW()
      )`;

    // --- Replies ---
    await sql`
      CREATE TABLE IF NOT EXISTS report_replies (
        id SERIAL PRIMARY KEY,
        report_id INT REFERENCES reports(id) ON DELETE CASCADE,
        sender_id INT REFERENCES users(id) ON DELETE SET NULL,
        sender_type TEXT CHECK (sender_type IN ('admin', 'user')) NOT NULL,
        message TEXT NOT NULL,
        date_created TIMESTAMP DEFAULT NOW()
     )`;

    // await sql `
    //    ALTER TABLE users
    //   ADD COLUMN suspended_until TIMESTAMP NULL;
    // `;
    
  //  await sql `
  //     ALTER TABLE users
  //     ADD COLUMN suspension_reason VARCHAR(50) CHECK (suspension_reason IN ('Suspicious activity', 'Violation of rules', 'Security breach risk'));
  //  `;


    //insert data in reports:
//     await sql`
//   INSERT INTO reports (user_id, subject, description, criticity, status, assigned_to)
//   VALUES
//     (1, 'Spam complaint', 'User #4 keeps posting spam links in chat', 'high', 'pending', 2),
//     (2, 'Bug report', 'Error when uploading profile picture', 'medium', 'in_progress', 3),
//     (3, 'Harassment', 'User #7 sent inappropriate messages', 'urgent', 'resolved', 1),
//     (4, 'Feature request', 'Please add dark mode to the dashboard', 'low', 'pending', NULL),
//     (5, 'Payment issue', 'Transaction failed but funds were deducted', 'high', 'in_progress', 2)
//   RETURNING *;
// `;


//insert data in replies:
// await sql`
//   INSERT INTO report_replies (report_id, sender_id, sender_type, message)
//   VALUES
//     (1, 2, 'admin', 'We are reviewing your spam report.'),
//     (1, 1, 'user', 'Thanks, waiting for an update.'),
//     (2, 3, 'admin', 'Could you retry and send us the screenshot?'),
//     (3, 1, 'admin', 'The user has been warned. Case closed.'),
//     (3, 3, 'user', 'Thanks for the quick action.'),
//     (5, 2, 'admin', 'We’re escalating this to the billing team.')
//   RETURNING *;
// `;


    console.log("✅ Database initialized (users + ips tables ready)");
  }catch (error) {
    console.error("❌ ERROR initializing DB:", error);
    process.exit(1);
  }
};
