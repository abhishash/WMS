import axios from "axios";

import AppError from "../utils/appError.js";
import { sendGoogleRequest } from "../utils/googleApi.js";
import { getGoogleAccessToken } from "./googleAccount.service.js";

const API_URL = "https://mybusiness.googleapis.com/v4";

export async function fetchAllReviews(googleAccount, oauth, accountResourceName, locationResourceName) {
  const accountId = accountResourceName.split("/").at(-1);
  const locationId = locationResourceName.split("/").at(-1);

  if (!accountId || !locationId) {
    throw new AppError("Invalid Google Business resource name", 400, "INVALID_GOOGLE_LOCATION");
  }

  const token = await getGoogleAccessToken(googleAccount, oauth);
  const reviews = [];
  let pageToken;
  const seenPageTokens = new Set();

  do {
    const response = await sendGoogleRequest(axios.get(
      `${API_URL}/accounts/${accountId}/locations/${locationId}/reviews`,
      {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        pageSize: 50,
        orderBy: "updateTime desc",
        ...(pageToken ? { pageToken } : {}),
      },
      },
    ));

    reviews.push(...(response.data.reviews ?? []));
    pageToken = response.data.nextPageToken ?? null;

    if (pageToken && seenPageTokens.has(pageToken)) {
      throw new AppError("Google returned a repeated reviews page token", 502, "GOOGLE_PAGINATION_ERROR");
    }

    if (pageToken) seenPageTokens.add(pageToken);
  } while (pageToken);

  return reviews;
}

export function getReviewStatistics(reviews) {
  const ratingMap = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };
  const validReviews = reviews.filter((review) => ratingMap[review.starRating]);
  const totalReviews = validReviews.length;
  const repliedReviews = validReviews.filter((review) => review.reviewReply?.comment?.trim()).length;
  const ratingTotal = validReviews.reduce((sum, review) => sum + ratingMap[review.starRating], 0);

  return {
    totalReviews,
    averageRating: totalReviews ? Number((ratingTotal / totalReviews).toFixed(2)) : 0,
    repliedReviews,
    unansweredReviews: totalReviews - repliedReviews,
    responseRate: totalReviews ? Number(((repliedReviews / totalReviews) * 100).toFixed(2)) : 0,
  };
}
