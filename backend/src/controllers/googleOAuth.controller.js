import crypto from "crypto";
import axios from "axios";
import { google } from "googleapis";
import OAuthState from "../models/GoogleOAuthState.js";
import GoogleAccount from "../models/GoogleAccount.js";

import {
  createGoogleOAuthClient,
  generateGoogleAuthUrl,
  GOOGLE_SCOPES,
} from "../config/googleOAuth.js";

import { decryptToken, encryptToken } from "../utils/encryption.js";

const CLIENT_URL =
  process.env.CLIENT_URL ||
  process.env.FRONTEND_URL ||
  "http://localhost:3000";

function getGoogleCallbackUrl(status) {
  const url = new URL("/dashboard/google-audit", CLIENT_URL);
  url.searchParams.set("google", status);
  return url.toString();
}

// Hash state before saving it in MongoDB
const hashState = (state) => {
  return crypto.createHash("sha256").update(state).digest("hex");
};

// 1. Initiate Google OAuth
export const connectGoogle = async (req, res) => {
  try {
    const userId = req.user.id;

    // Generate cryptographically secure random state
    const state = crypto.randomBytes(32).toString("hex");

    // Store only the hash of the state
    await OAuthState.create({
      stateHash: hashState(state),
      userId,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    });

    // Generate Google consent URL
    const authUrl = generateGoogleAuthUrl(state);

    return res.status(200).json({
      success: true,
      authUrl,
    });
  } catch (error) {
    console.error("Connect Google error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to initiate Google connection",
    });
  }
};

// 2. Handle Google OAuth callback
export const googleCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;
    
    if (!state || typeof state !== "string") {
      return res.status(400).send("Invalid OAuth state");
    }

    // Verify state and consume it exactly once
    const savedState = await OAuthState.findOneAndDelete({
      stateHash: hashState(state),
      expiresAt: { $gt: new Date() },
    });

    if (!savedState) {
      return res
        .status(400)
        .send("Invalid, expired or already-used OAuth state");
    }

    // Handle user denial
    if (error) {
      return res.redirect(getGoogleCallbackUrl("denied"));
    }

    if (!code || typeof code !== "string") {
      return res.redirect(getGoogleCallbackUrl("failed"));
    }

    const oauthClient = createGoogleOAuthClient();

    // Exchange authorization code for Google tokens
    const { tokens } = await oauthClient.getToken(code);

    if (!tokens.access_token) {
      throw new Error("Google did not return an access token");
    }

    oauthClient.setCredentials(tokens);

    // Fetch the Google account identity
    const oauth2 = google.oauth2({
      version: "v2",
      auth: oauthClient,
    });

    const { data: profile } = await oauth2.userinfo.get();

    if (!profile.email || !profile.id) {
      throw new Error("Unable to identify Google account");
    }

    // Retrieve previous connection
    const existing = await GoogleAccount.findOne({
      userId: savedState.userId,
    }).select("+refreshTokenEncrypted +accessTokenEncrypted");

    // Google may not return refresh_token on repeat authorization.
    // Preserve the existing refresh token if it is not returned.
    let encryptedRefreshToken = existing?.refreshTokenEncrypted;

    if (tokens.refresh_token) {
      encryptedRefreshToken = encryptToken(tokens.refresh_token);
    }

    if (!encryptedRefreshToken) {
      throw new Error("No refresh token received. Please authorize again.");
    }

    // Save connection against the correct Dhanda AI user
    await GoogleAccount.findOneAndUpdate(
      { userId: savedState.userId },
      {
        $set: {
          googleUserId: profile.id,
          email: profile.email,
          googleEmail: profile.email,
          accessTokenEncrypted: tokens.access_token
            ? encryptToken(tokens.access_token)
            : existing?.accessTokenEncrypted,
          refreshTokenEncrypted: encryptedRefreshToken,
          tokenExpiry: tokens.expiry_date
            ? new Date(tokens.expiry_date)
            : existing?.tokenExpiry,
          scope: tokens.scope ? tokens.scope.split(" ") : GOOGLE_SCOPES,
          connected: true,
          status: "connected",
          connectedAt: existing?.connectedAt || new Date(),
          lastConnectedAt: new Date(),
        },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      },
    );

    return res.redirect(getGoogleCallbackUrl("connected"));
  } catch (error) {
    console.error(
      "Google callback error:",
      error.response?.data || error.message,
    );

    return res.redirect(getGoogleCallbackUrl("failed"));
  }
};

// 3. Check Google connection status
export const getGoogleConnectionStatus = async (req, res) => {
  try {
    const connection = await GoogleAccount.findOne({
      userId: req.user.id,
      status: "connected",
    });

    return res.json({
      success: true,
      connected: !!connection,
      account: connection
        ? {
            email: connection.googleEmail,
            connectedAt: connection.connectedAt,
            lastConnectedAt: connection.lastConnectedAt,
          }
        : null,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 4. Disconnect Google
export const disconnectGoogle = async (req, res) => {
  try {
    const connection = await GoogleAccount.findOne({
      userId: req.user.id,
      status: "connected",
    }).select("+refreshTokenEncrypted");

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: "Google account is not connected",
      });
    }

    const refreshToken = decryptToken(connection.refreshTokenEncrypted);

    // Revoke Google authorization
    try {
      await axios.post(
        "https://oauth2.googleapis.com/revoke",
        new URLSearchParams({
          token: refreshToken,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );
    } catch (revokeError) {
      console.error("Google revoke error:", revokeError.message);
    }

    // Remove stored credentials
    await GoogleAccount.deleteOne({
      _id: connection._id,
      userId: req.user.id,
    });

    return res.json({
      success: true,
      message: "Google account disconnected",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to disconnect Google account",
    });
  }
};

// Helper: Google user profile
export const googleUserInfo = async (oauthClient) => {
  const { google } = await import("googleapis");

  const oauth2 = google.oauth2({
    version: "v2",
    auth: oauthClient
  });

  return oauth2.userinfo.get();
};
