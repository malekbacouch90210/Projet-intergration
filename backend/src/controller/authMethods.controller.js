import { sql } from "../lib/db.js";

// ==================== USADMIN-AUTH-001 ====================
// Consulter les méthodes d'authentification par utilisateur

/**
 * GET /api/auth-methods/users
 * Récupère les méthodes d'auth de tous les utilisateurs avec statistiques
 */
export const getUsersAuthMethods = async (req, res) => {
  try {
    const { page = 1, limit = 10, method_name, is_active } = req.query;
    const offset = (page - 1) * limit;

    // Build dynamic WHERE clause
    let whereConditions = [];
    if (method_name) whereConditions.push(sql`am.method_name = ${method_name}`);
    if (is_active !== undefined) whereConditions.push(sql`am.is_active = ${is_active === 'true'}`);
    
    const whereClause = whereConditions.length > 0 
      ? sql`WHERE ${sql.join(whereConditions, sql` AND `)}`
      : sql``;

    // Get users with their auth methods
    const usersWithMethods = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.status,
        json_agg(
          json_build_object(
            'method_id', am.method_id,
            'method_name', am.method_name,
            'is_active', am.is_active,
            'created_at', am.created_at,
            'last_used', am.last_used
          ) ORDER BY am.created_at DESC
        ) FILTER (WHERE am.method_id IS NOT NULL) as auth_methods
      FROM users u
      LEFT JOIN auth_methods am ON u.id = am.user_id
      ${whereClause}
      GROUP BY u.id, u.name, u.email, u.status
      ORDER BY u.id ASC
      LIMIT ${limit} OFFSET ${offset}
    `;

    // Count total users
    const totalResult = await sql`
      SELECT COUNT(DISTINCT u.id) as count
      FROM users u
      LEFT JOIN auth_methods am ON u.id = am.user_id
      ${whereClause}
    `;
    const total = parseInt(totalResult[0].count);

    res.status(200).json({
      users: usersWithMethods,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("ERROR in getUsersAuthMethods:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/auth-methods/statistics
 * Statistiques globales sur l'utilisation des méthodes d'auth
 */
export const getAuthMethodsStatistics = async (req, res) => {
  try {
    // Stats par méthode
    const methodStats = await sql`
      SELECT 
        method_name,
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE is_active = true) as active_users,
        COUNT(*) FILTER (WHERE is_active = false) as inactive_users,
        ROUND(AVG(EXTRACT(EPOCH FROM (NOW() - last_used))/86400)::numeric, 2) as avg_days_since_last_use
      FROM auth_methods
      GROUP BY method_name
      ORDER BY total_users DESC
    `;

    // Comptes avec méthodes obsolètes (pas utilisées depuis 90 jours)
    const obsoleteMethods = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        am.method_name,
        am.last_used,
        EXTRACT(EPOCH FROM (NOW() - am.last_used))/86400 as days_since_last_use
      FROM auth_methods am
      JOIN users u ON am.user_id = u.id
      WHERE am.last_used < NOW() - INTERVAL '90 days'
        AND am.is_active = true
      ORDER BY am.last_used ASC
      LIMIT 50
    `;

    // Utilisateurs sans méthodes actives
    const usersWithoutActiveMethods = await sql`
      SELECT 
        u.id,
        u.name,
        u.email,
        COUNT(am.method_id) FILTER (WHERE am.is_active = true) as active_methods_count
      FROM users u
      LEFT JOIN auth_methods am ON u.id = am.user_id
      GROUP BY u.id, u.name, u.email
      HAVING COUNT(am.method_id) FILTER (WHERE am.is_active = true) = 0
    `;

    res.status(200).json({
      methodStats,
      obsoleteMethods,
      usersWithoutActiveMethods,
      summary: {
        total_methods: methodStats.reduce((sum, m) => sum + parseInt(m.total_users), 0),
        total_active: methodStats.reduce((sum, m) => sum + parseInt(m.active_users), 0),
        users_without_active_methods: usersWithoutActiveMethods.length
      }
    });
  } catch (error) {
    console.error("ERROR in getAuthMethodsStatistics:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ==================== USADMIN-AUTH-002 ====================
// Forcer migration vers méthodes plus sécurisées

/**
 * POST /api/auth-methods/migration-campaign
 * Créer une campagne de migration ciblée
 */
export const createMigrationCampaign = async (req, res) => {
  try {
    const { 
      name, 
      target_method, 
      target_users, // array of user IDs or "all"
      notification_message,
      deadline 
    } = req.body;

    if (!name || !target_method) {
      return res.status(400).json({ message: "Name and target_method required!" });
    }

    // Create migration campaign
    const campaign = await sql`
      INSERT INTO migration_campaigns (
        name, 
        target_method, 
        notification_message, 
        deadline,
        created_at,
        status
      )
      VALUES (
        ${name}, 
        ${target_method}, 
        ${notification_message || 'Please upgrade your authentication method'}, 
        ${deadline || null},
        NOW(),
        'active'
      )
      RETURNING *
    `;

    // Get target users
    let targetUsersList;
    if (target_users === "all") {
      targetUsersList = await sql`
        SELECT id FROM users WHERE status = true
      `;
    } else if (Array.isArray(target_users)) {
      targetUsersList = await sql`
        SELECT id FROM users WHERE id = ANY(${target_users})
      `;
    } else {
      return res.status(400).json({ message: "Invalid target_users format" });
    }

    // Link users to campaign
    for (const user of targetUsersList) {
      await sql`
        INSERT INTO campaign_users (campaign_id, user_id, notified_at, adopted)
        VALUES (${campaign[0].campaign_id}, ${user.id}, NOW(), false)
      `;
    }

    res.status(201).json({
      message: "Migration campaign created successfully!",
      campaign: campaign[0],
      target_users_count: targetUsersList.length
    });
  } catch (error) {
    console.error("ERROR in createMigrationCampaign:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/auth-methods/migration-campaigns
 * Liste des campagnes de migration
 */
export const getMigrationCampaigns = async (req, res) => {
  try {
    const campaigns = await sql`
      SELECT 
        mc.*,
        COUNT(cu.user_id) as total_users,
        COUNT(cu.user_id) FILTER (WHERE cu.adopted = true) as adopted_users,
        ROUND(
          (COUNT(cu.user_id) FILTER (WHERE cu.adopted = true)::float / 
           NULLIF(COUNT(cu.user_id), 0) * 100)::numeric, 
          2
        ) as adoption_rate
      FROM migration_campaigns mc
      LEFT JOIN campaign_users cu ON mc.campaign_id = cu.campaign_id
      GROUP BY mc.campaign_id
      ORDER BY mc.created_at DESC
    `;

    res.status(200).json({ campaigns });
  } catch (error) {
    console.error("ERROR in getMigrationCampaigns:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PATCH /api/auth-methods/migration-campaigns/:id/mark-adopted
 * Marquer un utilisateur comme ayant adopté la nouvelle méthode
 */
export const markUserAsAdopted = async (req, res) => {
  try {
    const { id: campaignId } = req.params;
    const { user_id } = req.body;

    await sql`
      UPDATE campaign_users
      SET adopted = true, adopted_at = NOW()
      WHERE campaign_id = ${campaignId} AND user_id = ${user_id}
    `;

    res.status(200).json({ message: "User marked as adopted successfully!" });
  } catch (error) {
    console.error("ERROR in markUserAsAdopted:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ==================== USADMIN-AUTH-003 ====================
// Configurer les méthodes d'authentification disponibles

/**
 * GET /api/auth-methods/available
 * Liste des méthodes d'auth disponibles dans le système
 */
export const getAvailableMethods = async (req, res) => {
  try {
    const methods = await sql`
      SELECT * FROM available_auth_methods
      ORDER BY priority ASC
    `;

    res.status(200).json({ methods });
  } catch (error) {
    console.error("ERROR in getAvailableMethods:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PATCH /api/auth-methods/available/:method_name
 * Activer/désactiver une méthode d'auth
 */
export const toggleAuthMethod = async (req, res) => {
  try {
    const { method_name } = req.params;
    const { enabled, config } = req.body;

    if (typeof enabled !== "boolean") {
      return res.status(400).json({ message: "enabled must be a boolean" });
    }

    const result = await sql`
      UPDATE available_auth_methods
      SET 
        enabled = ${enabled},
        config = COALESCE(${config ? JSON.stringify(config) : null}::jsonb, config),
        updated_at = NOW()
      WHERE method_name = ${method_name}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Method not found" });
    }

    res.status(200).json({
      message: `Method ${enabled ? 'enabled' : 'disabled'} successfully!`,
      method: result[0]
    });
  } catch (error) {
    console.error("ERROR in toggleAuthMethod:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ==================== USADMIN-AUTH-004 ====================
// Définir règles de sécurité pour méthodes d'auth

/**
 * POST /api/auth-methods/security-rules
 * Créer une règle de sécurité
 */
export const createSecurityRule = async (req, res) => {
  try {
    const {
      rule_name,
      target_role,
      target_department,
      required_methods,
      min_methods_count,
      complexity_rules,
      enforcement_date
    } = req.body;

    if (!rule_name) {
      return res.status(400).json({ message: "rule_name required!" });
    }

    const rule = await sql`
      INSERT INTO auth_security_rules (
        rule_name,
        target_role,
        target_department,
        required_methods,
        min_methods_count,
        complexity_rules,
        enforcement_date,
        active,
        created_at
      )
      VALUES (
        ${rule_name},
        ${target_role || null},
        ${target_department || null},
        ${required_methods ? JSON.stringify(required_methods) : null}::jsonb,
        ${min_methods_count || 1},
        ${complexity_rules ? JSON.stringify(complexity_rules) : null}::jsonb,
        ${enforcement_date || null},
        true,
        NOW()
      )
      RETURNING *
    `;

    res.status(201).json({
      message: "Security rule created successfully!",
      rule: rule[0]
    });
  } catch (error) {
    console.error("ERROR in createSecurityRule:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/auth-methods/security-rules
 * Liste des règles de sécurité
 */
export const getSecurityRules = async (req, res) => {
  try {
    const rules = await sql`
      SELECT * FROM auth_security_rules
      ORDER BY created_at DESC
    `;

    res.status(200).json({ rules });
  } catch (error) {
    console.error("ERROR in getSecurityRules:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * PATCH /api/auth-methods/security-rules/:id
 * Mettre à jour une règle de sécurité
 */
export const updateSecurityRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { active, complexity_rules, enforcement_date } = req.body;

    const result = await sql`
      UPDATE auth_security_rules
      SET 
        active = COALESCE(${active !== undefined ? active : null}, active),
        complexity_rules = COALESCE(${complexity_rules ? JSON.stringify(complexity_rules) : null}::jsonb, complexity_rules),
        enforcement_date = COALESCE(${enforcement_date || null}, enforcement_date),
        updated_at = NOW()
      WHERE rule_id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Rule not found" });
    }

    res.status(200).json({
      message: "Security rule updated successfully!",
      rule: result[0]
    });
  } catch (error) {
    console.error("ERROR in updateSecurityRule:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ==================== USADMIN-AUTH-005 ====================
// Auditer les changements de méthodes d'auth

/**
 * GET /api/auth-methods/audit-log
 * Journal des modifications des méthodes d'auth
 */
export const getAuthMethodsAuditLog = async (req, res) => {
  try {
    const { page = 1, limit = 50, user_id, action_type, from_date, to_date } = req.query;
    const offset = (page - 1) * limit;

    let whereConditions = [];
    if (user_id) whereConditions.push(sql`user_id = ${user_id}`);
    if (action_type) whereConditions.push(sql`action_type = ${action_type}`);
    if (from_date) whereConditions.push(sql`created_at >= ${from_date}`);
    if (to_date) whereConditions.push(sql`created_at <= ${to_date}`);

    const whereClause = whereConditions.length > 0
      ? sql`WHERE ${sql.join(whereConditions, sql` AND `)}`
      : sql``;

    const logs = await sql`
      SELECT 
        amal.*,
        u.name as user_name,
        u.email as user_email
      FROM auth_methods_audit_log amal
      LEFT JOIN users u ON amal.user_id = u.id
      ${whereClause}
      ORDER BY amal.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const totalResult = await sql`
      SELECT COUNT(*) as count
      FROM auth_methods_audit_log
      ${whereClause}
    `;
    const total = parseInt(totalResult[0].count);

    res.status(200).json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("ERROR in getAuthMethodsAuditLog:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * GET /api/auth-methods/suspicious-changes
 * Détection des changements suspects
 */
export const getSuspiciousChanges = async (req, res) => {
  try {
    // Changements multiples en peu de temps
    const rapidChanges = await sql`
      SELECT 
        user_id,
        u.name,
        u.email,
        COUNT(*) as change_count,
        MIN(created_at) as first_change,
        MAX(created_at) as last_change
      FROM auth_methods_audit_log amal
      JOIN users u ON amal.user_id = u.id
      WHERE created_at > NOW() - INTERVAL '24 hours'
      GROUP BY user_id, u.name, u.email
      HAVING COUNT(*) >= 3
      ORDER BY change_count DESC
    `;

    // Désactivations non autorisées (sans admin)
    const unauthorizedDisables = await sql`
      SELECT 
        amal.*,
        u.name,
        u.email
      FROM auth_methods_audit_log amal
      JOIN users u ON amal.user_id = u.id
      WHERE action_type = 'disabled'
        AND performed_by IS NULL
        AND created_at > NOW() - INTERVAL '7 days'
      ORDER BY created_at DESC
    `;

    res.status(200).json({
      rapidChanges,
      unauthorizedDisables,
      alertCount: rapidChanges.length + unauthorizedDisables.length
    });
  } catch (error) {
    console.error("ERROR in getSuspiciousChanges:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};