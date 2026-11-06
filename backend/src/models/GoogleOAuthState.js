import mongoose from "mongoose";

const oauthStateSchema = new mongoose.Schema({
  stateHash: {
    type: String,
    required: true,
    unique: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },

  expiresAt: {
    type: Date,
    required: true,
  },
});

// MongoDB automatically deletes expired state records.
oauthStateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("GoogleOAuthState", oauthStateSchema);
