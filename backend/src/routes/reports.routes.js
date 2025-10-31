import express from "express";
import { getReports, createReport, updateReport , getAllReports } from "../controller/reports.controller.js";

const router = express.Router();

router.get("/", getReports);
router.post("/", createReport);
router.get("/all", getAllReports);
router.put("/:id", updateReport);

export default router;
