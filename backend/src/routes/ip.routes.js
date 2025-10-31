import express from "express";
import { addIpAdress, exportIPs, getIPsTable, importIPs, searchIP,updateIPStatus } from "../controller/ip.controller.js";
import multer from "multer";
const upload = multer({ dest: "tmp/" });
const router = express.Router();
router.get("/ipsTable", getIPsTable);
router.get("/export", exportIPs);
router.post("/import", upload.single("file"), importIPs);
router.post("/addIP", addIpAdress)
router.get("/searchIP", searchIP);
router.patch("/updateIP/:ip_address", updateIPStatus);

export default router;

