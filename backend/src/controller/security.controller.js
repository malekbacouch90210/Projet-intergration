import { sql } from "../lib/db.js";

// 1. Save/update blocking rules
export const setBlockingRule = async (req, res) => {
  try {
    const { max_failed_attempts, block_duration, detection_pattern } = req.body;

    if (!max_failed_attempts || !block_duration) {
      return res.status(400).json({ message: "Missing parameters" });
    }

    await sql`
      INSERT INTO security_rules (max_failed_attempts, block_duration, detection_pattern, active)
      VALUES (${max_failed_attempts}, ${block_duration}, ${detection_pattern || "multiple_failed_logins"}, true)
      ON CONFLICT (rule_id) DO UPDATE
      SET max_failed_attempts = EXCLUDED.max_failed_attempts,
          block_duration = EXCLUDED.block_duration,
          detection_pattern = EXCLUDED.detection_pattern,
          active = true
    `;

    res.status(200).json({ message: "Blocking rule saved successfully" });
  } catch (error) {
    console.error("ERROR in setBlockingRule:", error);
    res.status(500).json({ message: "Internal server issue" });
  }
};

// 4. Get all login attempts
export const getLoginAttempts = async (req, res) => {
  try {
    const attempts = await sql`
      SELECT attempt_id, ip_address, username, success, attempt_time
      FROM login_attempts
      ORDER BY attempt_time ASC
    `;
    res.status(200).json(attempts);
  } catch (error) {
    console.error("ERROR in getLoginAttempts:", error);
    res.status(500).json({ message: "Internal server issue" });
  }
};


// 2. Log login attempts (simulate failed/successful logins)
export const recordLoginAttempt = async (req, res) => {
  try {
    const { ip_address, username, success } = req.body;
    if (!ip_address) return res.status(400).json({ message: "IP required" });

    await sql`
      INSERT INTO login_attempts (ip_address, username, success)
      VALUES (${ip_address}, ${username || null}, ${success})
    `;

    // Only check if failed
    if (!success) {
      await checkAutomaticBlocking(ip_address);
    }

    res.status(200).json({ message: "Attempt recorded" });
  } catch (error) {
    console.error("ERROR in recordLoginAttempt:", error);
    res.status(500).json({ message: "Internal server issue" });
  }
};

// 3. Automatic blocking logic
export const checkAutomaticBlocking = async (ip_address) => {
  try {
    const [rule] = await sql`
      SELECT * FROM security_rules WHERE active = true ORDER BY rule_id DESC LIMIT 1
    `;
    if (!rule) return;

    const { max_failed_attempts, block_duration } = rule;

    // Count failed attempts in last hour
    const [{ count }] = await sql`
      SELECT COUNT(*)::int AS count
      FROM login_attempts
      WHERE ip_address = ${ip_address}
      AND success = false
      AND attempt_time > NOW() - INTERVAL '1 hour'
    `;

    if (count >= max_failed_attempts) {
      await sql`
        INSERT INTO ips (ip_address, status, reason, date_added)
        VALUES (${ip_address}, false, 'auto_block', CURRENT_DATE)
        ON CONFLICT (ip_address) DO UPDATE
        SET status = false,
            reason = 'auto_block',
            date_added = CURRENT_DATE
      `;

      console.log(`IP ${ip_address} blocked automatically for ${block_duration}`);

      // Optionally schedule unblock
      setTimeout(async () => {
        await sql`
          UPDATE ips SET status = true, reason = NULL WHERE ip_address = ${ip_address}
        `;
        console.log(`IP ${ip_address} automatically unblocked after ${block_duration}`);
      }, parseDuration(block_duration));
    }
  } catch (error) {
    console.error("ERROR in checkAutomaticBlocking:", error);
  }
};

// Helper: convert interval string to milliseconds
function parseDuration(intervalStr) {
  const match = intervalStr.match(/(\d+)\s*(minute|hour|day)/i);
  if (!match) return 3600000; // default 1 hour
  const num = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  return unit === "minute"
    ? num * 60 * 1000
    : unit === "hour"
    ? num * 60 * 60 * 1000
    : num * 24 * 60 * 60 * 1000;
}

// Get security alerts (suspicious activities)
export const getSecurityAlerts = async (req, res) => {
  try {
    // Get IPs with multiple failed attempts in last hour
    const suspiciousIPs = await sql`
      SELECT 
        ip_address,
        COUNT(*) as failed_attempts,
        MAX(attempt_time) as last_attempt
      FROM login_attempts
      WHERE success = false
        AND attempt_time > NOW() - INTERVAL '1 hour'
      GROUP BY ip_address
      HAVING COUNT(*) >= 3
      ORDER BY failed_attempts DESC, last_attempt DESC
    `;

    // Get recently blocked IPs
    const recentBlocks = await sql`
      SELECT ip_address, reason, date_added
      FROM ips
      WHERE status = false
        AND date_added >= CURRENT_DATE - INTERVAL '7 days'
      ORDER BY date_added DESC
    `;

    // Get high priority reports
    const criticalReports = await sql`
      SELECT id, user_id, subject, criticity, status, date_created
      FROM reports
      WHERE criticity IN ('urgent', 'high')
        AND status != 'resolved'
      ORDER BY 
        CASE criticity 
          WHEN 'urgent' THEN 1 
          WHEN 'high' THEN 2 
        END,
        date_created DESC
    `;

    res.status(200).json({
      suspiciousIPs,
      recentBlocks,
      criticalReports,
      totalAlerts: suspiciousIPs.length + recentBlocks.length + criticalReports.length
    });
  } catch (error) {
    console.error("ERROR in getSecurityAlerts:", error);
    res.status(500).json({ message: "Internal server issue" });
  }
};