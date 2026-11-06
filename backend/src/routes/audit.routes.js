import { Router } from "express";
import { getAuditHistory, runAudit } from "../controllers/audit.controller.js";
import asyncHandler from "../middleware/asyncHandler.js";
import { protect } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/run", protect, asyncHandler(runAudit));
router.get("/history/:locationId", protect, asyncHandler(getAuditHistory));

export default router;
