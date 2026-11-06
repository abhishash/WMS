import axios from "axios";

// import oauth2Client from "../config/google.js";
import GoogleAccount from "../models/GoogleAccount.js";
import { decrypt } from "../utils/encrypt.js";
import oauth2Client from "../config/googleOAuth.js";

const ACCOUNT_API =
  "https://mybusinessaccountmanagement.googleapis.com/v1";

const BUSINESS_API =
  "https://mybusinessbusinessinformation.googleapis.com/v1";

const PERFORMANCE_API =
  "https://businessprofileperformance.googleapis.com/v1";

// Get authenticated Google client for an application user
export const getGoogleClient = async (userId) => {
  const account = await GoogleAccount.findOne({
    userId,
    connected: true
  }).select("+refreshTokenEncrypted");

  if (!account) {
    throw new Error("Google account is not connected");
  }

  const refreshToken = decrypt(
    account.refreshTokenEncrypted
  );

  const client = new (oauth2Client.constructor)(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  client.setCredentials({
    refresh_token: refreshToken
  });

  const { token } = await client.getAccessToken();

  if (!token) {
    throw new Error("Unable to generate Google access token");
  }

  return {
    client,
    accessToken: token
  };
};

// Fetch all Google accounts
export const getGoogleAccounts = async (userId) => {
  const { accessToken } = await getGoogleClient(userId);

  const response = await axios.get(
    `${ACCOUNT_API}/accounts`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  return response.data.accounts || [];
};

// Fetch business locations accessible to user
export const getBusinessLocations = async (userId) => {
  const { accessToken } = await getGoogleClient(userId);

  const response = await axios.get(
    `${BUSINESS_API}/accounts/-/locations`,
    {
      params: {
        readMask: [
          "name",
          "title",
          "storefrontAddress",
          "phoneNumbers",
          "websiteUri",
          "categories",
          "metadata"
        ].join(","),
        pageSize: 100
      },
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  return response.data.locations || [];
};

// Fetch daily performance analytics
export const getDailyPerformance = async (
  userId,
  locationId,
  startDate,
  endDate
) => {
  const { accessToken } = await getGoogleClient(userId);

  const params = new URLSearchParams();

  const metrics = [
    "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
    "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
    "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
    "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    "WEBSITE_CLICKS",
    "CALL_CLICKS",
    "BUSINESS_DIRECTION_REQUESTS"
  ];

  metrics.forEach((metric) => {
    params.append("dailyMetrics", metric);
  });

  const addDate = (prefix, date) => {
    const d = new Date(`${date}T00:00:00Z`);

    params.append(`${prefix}.year`, String(d.getUTCFullYear()));
    params.append(`${prefix}.month`, String(d.getUTCMonth() + 1));
    params.append(`${prefix}.day`, String(d.getUTCDate()));
  };

  addDate("dailyRange.start_date", startDate);
  addDate("dailyRange.end_date", endDate);

  const response = await axios.get(
    `${PERFORMANCE_API}/${locationId}:fetchMultiDailyMetricsTimeSeries?${params.toString()}`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  );

  return response.data;
};