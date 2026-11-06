function getSeriesTotal(result) {
  if (!result || result.unavailable) return null;

  const datedValues = result.timeSeries?.datedValues ?? [];
  return datedValues.reduce((total, item) => total + Number(item.value ?? 0), 0);
}

function getCombinedSeriesTotal(data, metrics) {
  const values = metrics.map((metric) => getSeriesTotal(data[metric]));
  const availableValues = values.filter((value) => value != null);

  return availableValues.length
    ? availableValues.reduce((total, value) => total + value, 0)
    : null;
}

export function normalizePerformance(data) {
  return {
    websiteClicks: getSeriesTotal(data.WEBSITE_CLICKS),
    phoneCalls: getSeriesTotal(data.CALL_CLICKS),
    directionRequests: getSeriesTotal(data.BUSINESS_DIRECTION_REQUESTS),
    searchImpressions: getCombinedSeriesTotal(data, [
      "BUSINESS_IMPRESSIONS_DESKTOP_SEARCH",
      "BUSINESS_IMPRESSIONS_MOBILE_SEARCH",
      "BUSINESS_IMPRESSIONS_DESKTOP_MAPS",
      "BUSINESS_IMPRESSIONS_MOBILE_MAPS",
    ]),
  };
}
