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
    // ==================== TABLES POUR ÉPIC 11 ====================

    await sql`CREATE TABLE IF NOT EXISTS auth_methods (
      method_id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      method_name VARCHAR(50) NOT NULL CHECK (method_name IN ('password', 'totp', 'sms', 'email', 'biometric', 'hardware_key')),
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      last_used TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, method_name)
    )`;

    await sql`CREATE TABLE IF NOT EXISTS available_auth_methods (
      method_name VARCHAR(50) PRIMARY KEY,
      display_name VARCHAR(100) NOT NULL,
      description TEXT,
      enabled BOOLEAN DEFAULT TRUE,
      priority INT DEFAULT 100,
      config JSONB DEFAULT '{}'::jsonb,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`;

    await sql`INSERT INTO available_auth_methods (method_name, display_name, description, enabled, priority, config) VALUES
      ('password', 'Password', 'Traditional password authentication', true, 1, '{"min_length": 8, "require_uppercase": true, "require_special": true}'::jsonb),
      ('totp', 'TOTP (2FA)', 'Time-based One-Time Password', true, 2, '{"timeout_seconds": 30}'::jsonb),
      ('sms', 'SMS Code', 'SMS-based verification', true, 3, '{"provider": "twilio", "timeout_seconds": 300}'::jsonb),
      ('email', 'Email Code', 'Email-based verification', true, 4, '{"timeout_seconds": 600}'::jsonb),
      ('biometric', 'Biometric', 'Fingerprint or face recognition', false, 5, '{}'::jsonb),
      ('hardware_key', 'Hardware Key', 'Physical security key (e.g., YubiKey)', false, 6, '{}'::jsonb)
    ON CONFLICT (method_name) DO NOTHING`;

    await sql`CREATE TABLE IF NOT EXISTS migration_campaigns (
      campaign_id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      target_method VARCHAR(50) NOT NULL,
      notification_message TEXT,
      deadline TIMESTAMP,
      status VARCHAR(20) CHECK (status IN ('active', 'completed', 'cancelled')) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT NOW(),
      completed_at TIMESTAMP
    )`;

    await sql`CREATE TABLE IF NOT EXISTS campaign_users (
      campaign_id INT REFERENCES migration_campaigns(campaign_id) ON DELETE CASCADE,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      notified_at TIMESTAMP DEFAULT NOW(),
      adopted BOOLEAN DEFAULT FALSE,
      adopted_at TIMESTAMP,
      PRIMARY KEY (campaign_id, user_id)
    )`;

    await sql`CREATE TABLE IF NOT EXISTS auth_security_rules (
      rule_id SERIAL PRIMARY KEY,
      rule_name VARCHAR(255) NOT NULL,
      target_role VARCHAR(50),
      target_department VARCHAR(100),
      required_methods JSONB,
      min_methods_count INT DEFAULT 1,
      complexity_rules JSONB,
      enforcement_date TIMESTAMP,
      active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS auth_methods_audit_log (
      log_id SERIAL PRIMARY KEY,
      user_id INT REFERENCES users(id) ON DELETE CASCADE,
      method_name VARCHAR(50) NOT NULL,
      action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('added', 'removed', 'enabled', 'disabled', 'modified')),
      old_value JSONB,
      new_value JSONB,
      performed_by INT REFERENCES users(id) ON DELETE SET NULL,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )`;

    // Indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_auth_methods_user_id ON auth_methods(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_auth_methods_active ON auth_methods(is_active)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_campaign_users_campaign ON campaign_users(campaign_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_campaign_users_user ON campaign_users(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_user ON auth_methods_audit_log(user_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_audit_log_created ON auth_methods_audit_log(created_at DESC)`;

    // Vue
    await sql`CREATE OR REPLACE VIEW auth_methods_stats AS
      SELECT method_name,
             COUNT(*) as total_count,
             COUNT(*) FILTER (WHERE is_active = true) as active_count,
             COUNT(DISTINCT user_id) as unique_users,
             AVG(EXTRACT(EPOCHS FROM (NOW() - last_used))/86400) as avg_days_since_use
      FROM auth_methods
      GROUP BY method_name`;

    // Fonction corrigée
    await sql`CREATE OR REPLACE FUNCTION get_obsolete_methods(days_threshold INT DEFAULT 90)
      RETURNS TABLE (
        user_id INT,
        user_name VARCHAR,
        user_email VARCHAR,
        method_name VARCHAR,
        last_used TIMESTAMP,
        days_inactive NUMERIC
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT u.id,
               u.name,
               u.email,
               am.method_name,
               am.last_used,
               EXTRACT(EPOCH FROM (NOW() - am.last_used))/86400::NUMERIC as days_inactive
        FROM auth_methods am
        JOIN users u ON am.user_id = u.id
        WHERE am.last_used < NOW() - (days_threshold || ' days')::INTERVAL
          AND am.is_active = true
        ORDER BY am.last_used ASC;
      END;
      $$ LANGUAGE plpgsql`;

    // Trigger function
    await sql`CREATE OR REPLACE FUNCTION audit_auth_method_changes()
      RETURNS TRIGGER AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          INSERT INTO auth_methods_audit_log (user_id, method_name, action_type, new_value)
          VALUES (NEW.user_id, NEW.method_name, 'added', to_jsonb(NEW));
        ELSIF TG_OP = 'UPDATE' THEN
          IF OLD.is_active != NEW.is_active THEN
            INSERT INTO auth_methods_audit_log (user_id, method_name, action_type, old_value, new_value)
            VALUES (NEW.user_id, NEW.method_name,
                    CASE WHEN NEW.is_active THEN 'enabled' ELSE 'disabled' END,
                    to_jsonb(OLD), to_jsonb(NEW));
          ELSE
            INSERT INTO auth_methods_audit_log (user_id, method_name, action_type, old_value, new_value)
            VALUES (NEW.user_id, NEW.method_name, 'modified', to_jsonb(OLD), to_jsonb(NEW));
          END IF;
        ELSIF TG_OP = 'DELETE' THEN
          INSERT INTO auth_methods_audit_log (user_id, method_name, action_type, old_value)
          VALUES (OLD.user_id, OLD.method_name, 'removed', to_jsonb(OLD));
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql`;

    await sql`DROP TRIGGER IF EXISTS auth_method_changes_trigger ON auth_methods`;
    await sql`CREATE TRIGGER auth_method_changes_trigger
      AFTER INSERT OR UPDATE OR DELETE ON auth_methods
      FOR EACH ROW EXECUTE FUNCTION audit_auth_method_changes()`;

        // Données de test migration_campaigns → version 100% sûre pour Neon
    await sql`
      INSERT INTO migration_campaigns (name, target_method, notification_message, deadline, status)
      SELECT 'Upgrade to 2FA', 'totp', 'Please enable two-factor authentication for enhanced security', NOW() + INTERVAL '30 days', 'active'
      WHERE NOT EXISTS (SELECT 1 FROM migration_campaigns WHERE name = 'Upgrade to 2FA')
    `;

    await sql`
      INSERT INTO migration_campaigns (name, target_method, notification_message, deadline, status)
      SELECT 'Deprecate SMS Auth', 'totp', 'SMS authentication will be deprecated. Please switch to TOTP', NOW() + INTERVAL '60 days', 'active'
      WHERE NOT EXISTS (SELECT 1 FROM migration_campaigns WHERE name = 'Deprecate SMS Auth')
    `;

    // Données de test auth_security_rules → version 100% sûre
    await sql`
      INSERT INTO auth_security_rules (rule_name, target_role, required_methods, min_methods_count, enforcement_date, active)
      SELECT 'Admin 2FA Required', 'admin', '["password", "totp"]'::jsonb, 2, NOW(), true
      WHERE NOT EXISTS (SELECT 1 FROM auth_security_rules WHERE rule_name = 'Admin 2FA Required')
    `;

    await sql`
      INSERT INTO auth_security_rules (rule_name, target_role, required_methods, min_methods_count, enforcement_date, active)
      SELECT 'Standard User Security', NULL, '["password"]'::jsonb, 1, NOW(), true
      WHERE NOT EXISTS (SELECT 1 FROM auth_security_rules WHERE rule_name = 'Standard User Security')
    `;

    // ==================== FIN ÉPIC 11 ====================

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
