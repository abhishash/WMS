import mongoose from "mongoose";

const googleBusinessLocationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    accountId: {
      type: String,
      required: true,
    },

    locationId: {
      type: String,
      required: true,
    },

    locationName: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      default: "",
    },

    isSelected: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

googleBusinessLocationSchema.index(
  { userId: 1, accountId: 1, locationId: 1 },
  { unique: true },
);

export default mongoose.model(
  "GoogleBusinessLocation",
  googleBusinessLocationSchema,
);
