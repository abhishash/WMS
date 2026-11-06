import axios from "axios";

import AppError from "../utils/appError.js";
import { sendGoogleRequest } from "../utils/googleApi.js";
import { getGoogleAccessToken } from "./googleAccount.service.js";

const API_URL = "https://mybusinessbusinessinformation.googleapis.com/v1";

export async function fetchProfile(googleAccount, oauth, locationResourceName) {
  if (!/^accounts\/[^/]+\/locations\/[^/]+$/.test(locationResourceName)) {
    throw new AppError("Invalid Google Business location", 400, "INVALID_GOOGLE_LOCATION");
  }

  const token = await getGoogleAccessToken(googleAccount, oauth);
  const response = await sendGoogleRequest(axios.get(`${API_URL}/${locationResourceName}`, {
    headers: { Authorization: `Bearer ${token}` },
    params: {
      readMask: [
        "name",
        "title",
        "categories",
        "phoneNumbers",
        "websiteUri",
        "storefrontAddress",
        "regularHours",
        "profile",
      ].join(","),
    },
  }));

  return response.data;
}
