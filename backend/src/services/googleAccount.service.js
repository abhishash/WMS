import axios from "axios";
import GoogleAccount from "../models/GoogleAccount.js";
import AppError from "../utils/appError.js";
import { sendGoogleRequest } from "../utils/googleApi.js";
import { decryptToken, encryptToken } from "../utils/encryption.js";
import { createGoogleOAuthClient } from "../config/googleOAuth.js";

export async function getGoogleClient(userId, googleAccountId) {
  const account = await GoogleAccount.findOne({
    _id: googleAccountId,
    userId,
    connected: true,
  }).select("+accessTokenEncrypted +refreshTokenEncrypted");

  if (!account) {
    throw new AppError(
      "Google account is not connected",
      404,
      "GOOGLE_ACCOUNT_NOT_FOUND",
    );
  }

  if (!account.refreshTokenEncrypted) {
    throw new AppError(
      "Reconnect this Google account to grant offline access",
      409,
      "GOOGLE_REAUTH_REQUIRED",
    );
  }

  const oauth = createGoogleOAuthClient();
  oauth.setCredentials({
    access_token: account.accessTokenEncrypted
      ? decryptToken(account.accessTokenEncrypted)
      : undefined,
    refresh_token: decryptToken(account.refreshTokenEncrypted),
    expiry_date: account.tokenExpiry?.getTime(),
  });

  return { account, oauth };
}

export async function getGoogleAccessToken(account, oauth) {
  const credentials = oauth.credentials;

  if (
    credentials.access_token &&
    credentials.expiry_date > Date.now() + 60_000
  ) {
    return credentials.access_token;
  }

  const { token } = await oauth.getAccessToken();

  if (!token) {
    throw new AppError(
      "Google did not provide an access token",
      502,
      "GOOGLE_TOKEN_UNAVAILABLE",
    );
  }

  const refreshedCredentials = oauth.credentials;
  const updates = {
    accessTokenEncrypted: encryptToken(token),
  };

  if (refreshedCredentials.expiry_date) {
    updates.tokenExpiry = new Date(refreshedCredentials.expiry_date);
  }

  if (refreshedCredentials.refresh_token) {
    updates.refreshTokenEncrypted = encryptToken(refreshedCredentials.refresh_token);
  }

  await GoogleAccount.updateOne(
    { _id: account._id, userId: account.userId },
    { $set: updates },
  );

  return token;
}

export async function fetchGoogleAccounts(account, oauth) {
  const token = await getGoogleAccessToken(account, oauth);
  const accounts = [];
  let pageToken;
  const seenPageTokens = new Set();

  do {
    const response = await sendGoogleRequest(
      axios.get(
        "https://mybusinessaccountmanagement.googleapis.com/v1/accounts",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: pageToken ? { pageToken } : {},
        },
      ),
    );

    accounts.push(...(response.data.accounts ?? []));
    pageToken = response.data.nextPageToken ?? null;

    if (pageToken && seenPageTokens.has(pageToken)) {
      throw new AppError(
        "Google returned a repeated accounts page token",
        502,
        "GOOGLE_PAGINATION_ERROR",
      );
    }

    if (pageToken) seenPageTokens.add(pageToken);
  } while (pageToken);

  return accounts;
}

export async function getConnectedGoogleAccounts(userId) {
  return GoogleAccount.find({ userId, connected: true })
    .select("_id email googleUserId")
    .lean();
}
