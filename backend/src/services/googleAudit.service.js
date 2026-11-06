import BusinessAudit from "../models/BusinessAudit.js";
import AppError from "../utils/appError.js";
import { calculateGoogleScore } from "../utils/scoreCalculator.js";
import { getGoogleAccessToken, getGoogleClient } from "./googleAccount.service.js";
import { generateRecommendations } from "./aiRecommendation.service.js";
import { calculateMediaMetrics, fetchAllMedia } from "./googleMedia.service.js";
import { fetchPerformance } from "./googlePerformance.service.js";
import { fetchProfile } from "./googleProfile.service.js";
import { fetchAllReviews, getReviewStatistics } from "./googleReview.service.js";
import { normalizePerformance } from "./performanceNormalizer.js";

function getErrorMessage(error) {
  return error.response?.data?.error?.message ?? error.message ?? "Google data could not be loaded";
}

function toProfileMetrics(profile) {
  const categories = profile.categories ?? {};

  return {
    hasName: Boolean(profile.title),
    hasCategory: Boolean(categories.primaryCategory?.displayName),
    hasPhone: Boolean(profile.phoneNumbers?.primaryPhone),
    hasAddress: Boolean(profile.storefrontAddress?.formattedAddress),
    hasWebsite: Boolean(profile.websiteUri),
    hasHours: Boolean(profile.regularHours?.periods?.length),
    hasDescription: Boolean(profile.profile?.description),
    hasSecondaryCategories: Boolean(categories.additionalCategories?.length),
    description: profile.profile?.description ?? "",
  };
}

export async function runGoogleAudit({ userId, location }) {
  const { account, oauth } = await getGoogleClient(userId, location.googleAccountId);
  await getGoogleAccessToken(account, oauth);
  const startDate = new Date();
  startDate.setUTCDate(startDate.getUTCDate() - 29);
  startDate.setUTCHours(0, 0, 0, 0);
  const endDate = new Date();
  endDate.setUTCDate(endDate.getUTCDate() - 1);
  endDate.setUTCHours(0, 0, 0, 0);

  const sourceResults = await Promise.allSettled([
    fetchProfile(account, oauth, location.locationResourceName),
    fetchAllReviews(account, oauth, location.accountResourceName, location.locationResourceName),
    fetchAllMedia(account, oauth, location.accountResourceName, location.locationResourceName),
    fetchPerformance(account, oauth, location.locationResourceName, startDate, endDate),
  ]);
  const [profileResult, reviewsResult, mediaResult, performanceResult] = sourceResults;
  const sourceErrors = sourceResults.flatMap((result, index) =>
    result.status === "rejected"
      ? [
          {
            source: ["profile", "reviews", "media", "performance"][index],
            message: getErrorMessage(result.reason),
          },
        ]
      : [],
  );
  if (performanceResult.status === "fulfilled") {
    for (const [source, result] of Object.entries(performanceResult.value)) {
      if (result.unavailable) sourceErrors.push({ source, message: result.message });
    }
  }

  const profile = profileResult.status === "fulfilled" ? toProfileMetrics(profileResult.value) : {};
  const reviews =
    reviewsResult.status === "fulfilled"
      ? getReviewStatistics(reviewsResult.value)
      : {
          totalReviews: null,
          averageRating: null,
          repliedReviews: null,
          unansweredReviews: null,
          responseRate: null,
        };
  const media =
    mediaResult.status === "fulfilled"
      ? calculateMediaMetrics(mediaResult.value)
      : { totalMedia: null, photoCount: null, videoCount: null };
  const performance =
    performanceResult.status === "fulfilled"
      ? normalizePerformance(performanceResult.value)
      : { websiteClicks: null, phoneCalls: null, directionRequests: null, searchImpressions: null };

  const sourceAvailable = {
    profile: profileResult.status === "fulfilled",
    reviews: reviewsResult.status === "fulfilled",
    media: mediaResult.status === "fulfilled",
    performance:
      performanceResult.status === "fulfilled" &&
      Object.values(performanceResult.value).some((metric) => !metric.unavailable),
  };
  const metrics = { profile, reviews, media, performance, sourceAvailable };
  const scores = calculateGoogleScore({ ...metrics, sourceAvailable });

  if (!scores.availablePoints) {
    throw new AppError("Google returned no audit data. Please try again later.", 502, "GOOGLE_AUDIT_EMPTY");
  }

  return BusinessAudit.create({
    userId,
    locationId: String(location._id),
    googleLocationResourceName: location.locationResourceName,
    overallScore: scores.overallScore,
    coveragePercentage: scores.coveragePercentage,
    categories: scores.checks,
    metrics,
    sourceErrors,
    findings: generateRecommendations(metrics),
    auditedAt: new Date(),
  });
}
