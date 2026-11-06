import mongoose from "mongoose";

const googleLocationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    googleAccountId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "GoogleAccount",
      required: true,
    },

    accountResourceName: String,

    locationResourceName: {
      type: String,
      required: true,
    },

    title: String,

    category: String,

    address: String,

    phone: String,

    website: String,

    isSelected: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

googleLocationSchema.index(
  { userId: 1, locationResourceName: 1 },
  { unique: true }
);

const GoogleLocation = mongoose.model("GoogleLocation", googleLocationSchema);
export default GoogleLocation;