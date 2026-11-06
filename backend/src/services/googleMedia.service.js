import axios from "axios";

import AppError from "../utils/appError.js";
import { sendGoogleRequest } from "../utils/googleApi.js";
import { getGoogleAccessToken } from "./googleAccount.service.js";

const API_URL = "https://mybusiness.googleapis.com/v4";

export async function fetchAllMedia(googleAccount, oauth, accountResourceName, locationResourceName) {
  const accountId = accountResourceName.split("/").at(-1);
  const locationId = locationResourceName.split("/").at(-1);

  if (!accountId || !locationId) {
    throw new AppError("Invalid Google Business resource name", 400, "INVALID_GOOGLE_LOCATION");
  }

  const token = await getGoogleAccessToken(googleAccount, oauth);
  const media = [];
  let pageToken;
  const seenPageTokens = new Set();

  do {
    const response = await sendGoogleRequest(axios.get(
      `${API_URL}/accounts/${accountId}/locations/${locationId}/media`,
      {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        pageSize: 100,
        ...(pageToken ? { pageToken } : {}),
      },
      },
    ));

    media.push(...(response.data.mediaItems ?? []));
    pageToken = response.data.nextPageToken ?? null;

    if (pageToken && seenPageTokens.has(pageToken)) {
      throw new AppError("Google returned a repeated media page token", 502, "GOOGLE_PAGINATION_ERROR");
    }

    if (pageToken) seenPageTokens.add(pageToken);
  } while (pageToken);

  return media;
}

export function calculateMediaMetrics(media) {
  return {
    totalMedia: media.length,
    videoCount: media.filter((item) => item.mediaFormat === "VIDEO").length,
    photoCount: media.filter((item) => item.mediaFormat === "PHOTO").length,
  };
}
