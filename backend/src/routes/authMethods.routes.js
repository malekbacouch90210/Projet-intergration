import express from "express";
import {
  // USADMIN-AUTH-001
  getUsersAuthMethods,
  getAuthMethodsStatistics,
  
  // USADMIN-AUTH-002
  createMigrationCampaign,
  getMigrationCampaigns,
  markUserAsAdopted,
  
  // USADMIN-AUTH-003
  getAvailableMethods,
  toggleAuthMethod,
  
  // USADMIN-AUTH-004
  createSecurityRule,
  getSecurityRules,
  updateSecurityRule,
  
  // USADMIN-AUTH-005
  getAuthMethodsAuditLog,
  getSuspiciousChanges
} from "../controller/authMethods.controller.js";

const router = express.Router();

// ==================== USADMIN-AUTH-001 ====================
// Consulter méthodes d'authentification
router.get("/users", getUsersAuthMethods);
router.get("/statistics", getAuthMethodsStatistics);

// ==================== USADMIN-AUTH-002 ====================
// Migration forcée
router.post("/migration-campaign", createMigrationCampaign);
router.get("/migration-campaigns", getMigrationCampaigns);
router.patch("/migration-campaigns/:id/mark-adopted", markUserAsAdopted);

// ==================== USADMIN-AUTH-003 ====================
// Configuration méthodes disponibles
router.get("/available", getAvailableMethods);
router.patch("/available/:method_name", toggleAuthMethod);

// ==================== USADMIN-AUTH-004 ====================
// Règles de sécurité
router.post("/security-rules", createSecurityRule);
router.get("/security-rules", getSecurityRules);
router.patch("/security-rules/:id", updateSecurityRule);

// ==================== USADMIN-AUTH-005 ====================
// Audit
router.get("/audit-log", getAuthMethodsAuditLog);
router.get("/suspicious-changes", getSuspiciousChanges);

export default router;