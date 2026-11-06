import mongoose from "mongoose";

import BusinessAudit from "../models/BusinessAudit.js";
import GoogleLocation from "../models/GoogleLocation.js";
import AppError from "../utils/appError.js";
import { runGoogleAudit } from "../services/googleAudit.service.js";

export async function runAudit(req, res) {
  const { locationId } = req.body ?? {};

  if (typeof locationId !== "string" || !mongoose.isValidObjectId(locationId)) {
    throw new AppError("A valid Google location is required", 400, "INVALID_GOOGLE_LOCATION");
  }

  const location = await GoogleLocation.findOne({ _id: locationId, userId: req.user.id });
  if (!location) {
    throw new AppError("Google location not found", 404, "GOOGLE_LOCATION_NOT_FOUND");
  }

  const audit = await runGoogleAudit({ userId: req.user.id, location });
  res.status(201).json({ success: true, message: "Google audit completed", data: audit });
}

export async function getAuditHistory(req, res) {
  const { locationId } = req.params;

  if (!mongoose.isValidObjectId(locationId)) {
    throw new AppError("Invalid Google location", 400, "INVALID_GOOGLE_LOCATION");
  }

  const location = await GoogleLocation.findOne({ _id: locationId, userId: req.user.id }).select("_id");
  if (!location) {
    throw new AppError("Google location not found", 404, "GOOGLE_LOCATION_NOT_FOUND");
  }

  const audits = await BusinessAudit.find({ userId: req.user.id, locationId })
    .sort({ auditedAt: -1 })
    .limit(20)
    .lean();

  res.json({ success: true, data: audits });
}
