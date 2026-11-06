import mongoose from "mongoose";

const businessAuditSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    locationId: {
      type: String,
      required: true,
    },
    googleLocationResourceName: String,

    overallScore: Number,

    coveragePercentage: Number,

    categories: [
      {
        category: String,
        name: String,
        score: Number,
        max: Number,
        available: Boolean,
      },
    ],

    metrics: mongoose.Schema.Types.Mixed,
    sourceErrors: [
      {
        source: String,
        message: String,
      },
    ],

    findings: [
      {
        category: String,
        title: String,
        description: String,
        severity: {
          type: String,
          enum: ["good", "warning", "critical"],
        },
      },
    ],

    auditedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

businessAuditSchema.index({
  userId: 1,
  locationId: 1,
  auditedAt: -1,
});

const BusinessAudit = mongoose.model("BusinessAudit", businessAuditSchema);
export default BusinessAudit;