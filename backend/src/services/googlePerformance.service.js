import axios from "axios";

import { getGoogleAccessToken } from "./googleAccount.service.js";
import { sendGoogleRequest } from "../utils/googleApi.js";

const API_URL = "https://businessprofileperformance.googleapis.com/v1";
const metrics = [
  "WEBSITE_CLICKS",
  "CALL_CLICKS",
  "BUSINESS_DIRECTION_REQUESTS",
  "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
  "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
  "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
  "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
];

function dateParts(date) {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

async function fetchMetric(token, locationResourceName, dailyMetric, startDate, endDate) {
  const response = await sendGoogleRequest(axios.post(
    `${API_URL}/${locationResourceName}:getDailyMetricsTimeSeries`,
    {
      dailyMetric,
      dailyRange: { startDate: dateParts(startDate), endDate: dateParts(endDate) },
    },
    { headers: { Authorization: `Bearer ${token}` } },
  ));

  return response.data;
}

export async function fetchPerformance(googleAccount, oauth, locationResourceName, startDate, endDate) {
  const token = await getGoogleAccessToken(googleAccount, oauth);
  const results = await Promise.all(
    metrics.map(async (metric) => {
      try {
        return [metric, await fetchMetric(token, locationResourceName, metric, startDate, endDate)];
      } catch (error) {
        const message = error.response?.data?.error?.message ?? error.message;
        return [metric, { unavailable: true, message }];
      }
    }),
  );

  return Object.fromEntries(results);
}
