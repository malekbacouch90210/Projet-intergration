import express from "express";
import { recordLoginAttempt, setBlockingRule , getLoginAttempts , getSecurityAlerts} from "../controller/security.controller.js";

const router = express.Router();

router.post("/rules/blocking", setBlockingRule);
router.post("/login/attempt", recordLoginAttempt);
router.post("/rules", setBlockingRule);
router.get("/login/attempts", getLoginAttempts);
router.get("/alerts", getSecurityAlerts);
export default router;
