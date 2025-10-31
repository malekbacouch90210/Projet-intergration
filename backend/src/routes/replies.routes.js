import express from "express";
import { addReply, getReplies } from "../controller/replies.controller.js";

const router = express.Router();

router.post("/reply", addReply);
router.get("/:report_id/replies", getReplies);

export default router;
