import express from "express";
import {
  createReport,
  getReports,
  verifyReport
} from "../controllers/reportController.js";

const router = express.Router();

router.post("/", createReport);
router.get("/", getReports);
router.put("/:id/verify", verifyReport);

export default router;
