import mongoose from "mongoose";

const googleAccountSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    googleUserId: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    googleEmail: {
      type: String,
      default: null,
    },

    status: {
      type: String,
      enum: ["connected", "disconnected"],
      default: "connected",
    },

    refreshTokenEncrypted: {
      type: String,
      required: true,
      select: false,
    },

    accessTokenEncrypted: {
      type: String,
      select: false,
    },

    tokenExpiry: Date,

    scope: {
      type: [String],
      default: [],
    },

    connected: {
      type: Boolean,
      default: true,
    },

    connectedAt: {
      type: Date,
      default: Date.now,
    },
    lastConnectedAt: Date,
  },
  { timestamps: true },
);

export default mongoose.model("GoogleAccount", googleAccountSchema);
