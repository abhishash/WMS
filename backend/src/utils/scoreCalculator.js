const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function calculateGoogleScore(data) {
  const checks = [];
  const sourceAvailable = data.sourceAvailable ?? {};

  const add = (name, category, score, max, available = true) => {
    checks.push({
      name,
      category,
      score: available ? Number(clamp(score, 0, max).toFixed(2)) : null,
      max,
      available,
    });
  };

  const profileAvailable = sourceAvailable.profile !== false;
  const profile = data.profile ?? {};
  add("Business name", "Profile", profile.hasName ? 4 : 0, 4, profileAvailable);
  add("Primary category", "Profile", profile.hasCategory ? 5 : 0, 5, profileAvailable);
  add("Phone number", "Profile", profile.hasPhone ? 4 : 0, 4, profileAvailable);
  add("Business address", "Profile", profile.hasAddress ? 5 : 0, 5, profileAvailable);
  add("Website", "Profile", profile.hasWebsite ? 4 : 0, 4, profileAvailable);
  add("Opening hours", "Profile", profile.hasHours ? 4 : 0, 4, profileAvailable);
  add("Description", "Profile", profile.hasDescription ? 4 : 0, 4, profileAvailable);

  const reviewsAvailable = sourceAvailable.reviews !== false;
  const reviews = data.reviews ?? {};
  add("Average rating", "Reviews", ((reviews.averageRating ?? 0) / 5) * 10, 10, reviewsAvailable);
  add("Review count", "Reviews", ((reviews.totalReviews ?? 0) / 100) * 7, 7, reviewsAvailable);
  add("Response rate", "Reviews", ((reviews.responseRate ?? 0) / 100) * 8, 8, reviewsAvailable);

  const mediaAvailable = sourceAvailable.media !== false;
  const media = data.media ?? {};
  add("Photo count", "Media", ((media.photoCount ?? 0) / 20) * 10, 10, mediaAvailable);
  add("Video presence", "Media", media.videoCount > 0 ? 5 : 0, 5, mediaAvailable);

  const performance = data.performance ?? {};
  add(
    "Website clicks",
    "Performance",
    Math.min((performance.websiteClicks ?? 0) / 100, 1) * 6,
    6,
    sourceAvailable.performance !== false && performance.websiteClicks != null,
  );
  add(
    "Phone calls",
    "Performance",
    Math.min((performance.phoneCalls ?? 0) / 100, 1) * 6,
    6,
    sourceAvailable.performance !== false && performance.phoneCalls != null,
  );
  add(
    "Direction requests",
    "Performance",
    Math.min((performance.directionRequests ?? 0) / 100, 1) * 4,
    4,
    sourceAvailable.performance !== false && performance.directionRequests != null,
  );
  add(
    "Search impressions",
    "Performance",
    Math.min((performance.searchImpressions ?? 0) / 1000, 1) * 4,
    4,
    sourceAvailable.performance !== false && performance.searchImpressions != null,
  );

  add("Description relevance", "SEO", 0, 4, false);
  add("Secondary categories", "SEO", profile.hasSecondaryCategories ? 2 : 0, 2, profileAvailable);
  add("Keyword coverage", "SEO", 0, 4, false);

  const availableChecks = checks.filter((check) => check.available);
  const availablePoints = availableChecks.reduce((sum, check) => sum + check.max, 0);
  const earnedPoints = availableChecks.reduce((sum, check) => sum + check.score, 0);

  return {
    overallScore: availablePoints ? Math.round((earnedPoints / availablePoints) * 100) : null,
    earnedPoints: Number(earnedPoints.toFixed(2)),
    availablePoints,
    totalPossiblePoints: 100,
    coveragePercentage: Math.round((availablePoints / 100) * 100),
    checks,
  };
}
