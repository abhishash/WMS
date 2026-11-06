import axios from "axios";

import GoogleLocation from "../models/GoogleLocation.js";
import AppError from "../utils/appError.js";
import { sendGoogleRequest } from "../utils/googleApi.js";
import { getGoogleAccessToken } from "./googleAccount.service.js";

const API_URL = "https://mybusinessbusinessinformation.googleapis.com/v1";
const readMask = [
  "name",
  "title",
  "storeCode",
  "phoneNumbers",
  "websiteUri",
  "categories",
  "storefrontAddress",
  "regularHours",
  "profile",
].join(",");

export async function fetchLocations(googleAccount, oauth, accountResourceName) {
  if (!/^accounts\/[^/]+$/.test(accountResourceName)) {
    throw new AppError("Invalid Google Business account", 400, "INVALID_GOOGLE_ACCOUNT");
  }

  const token = await getGoogleAccessToken(googleAccount, oauth);
  const locations = [];
  let pageToken;
  const seenPageTokens = new Set();

  do {
    const response = await sendGoogleRequest(axios.get(`${API_URL}/${accountResourceName}/locations`, {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        readMask,
        pageSize: 100,
        ...(pageToken ? { pageToken } : {}),
      },
    }));

    locations.push(...(response.data.locations ?? []));
    pageToken = response.data.nextPageToken ?? null;

    if (pageToken && seenPageTokens.has(pageToken)) {
      throw new AppError("Google returned a repeated locations page token", 502, "GOOGLE_PAGINATION_ERROR");
    }

    if (pageToken) seenPageTokens.add(pageToken);
  } while (pageToken);

  const records = locations.map((location) => ({
    userId: googleAccount.userId,
    googleAccountId: googleAccount._id,
    accountResourceName,
    locationResourceName: location.name,
    title: location.title ?? "",
    category: location.categories?.primaryCategory?.displayName ?? "",
    address: location.storefrontAddress?.formattedAddress ?? "",
    phone: location.phoneNumbers?.primaryPhone ?? "",
    website: location.websiteUri ?? "",
  }));

  if (records.length) {
    await GoogleLocation.bulkWrite(
      records.map((record) => ({
        updateOne: {
          filter: { userId: record.userId, locationResourceName: record.locationResourceName },
          update: { $set: record },
          upsert: true,
        },
      })),
    );
  }

  return GoogleLocation.find({
    userId: googleAccount.userId,
    googleAccountId: googleAccount._id,
    accountResourceName,
  }).sort({ title: 1 });
}
