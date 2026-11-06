import GoogleConnection from "../models/GoogleConnection.js";
import { createGoogleOAuthClient } from "../config/googleOAuth.js";
import { decryptToken } from "./googleTokenEncryption.js";

export const getCustomerGoogleOAuthClient = async (userId) => {
  const connection = await GoogleConnection.findOne({
    userId,
    status: "connected"
  }).select("+refreshTokenEncrypted");

  if (!connection) {
    throw new Error("Google account is not connected");
  }

  const refreshToken = decryptToken(
    connection.refreshTokenEncrypted
  );

  const oauthClient = createGoogleOAuthClient();

  oauthClient.setCredentials({
    refresh_token: refreshToken
  });

  return oauthClient;
};