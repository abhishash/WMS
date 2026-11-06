export function generateRecommendations(data) {
  const findings = [];
  const { profile = {}, reviews = {}, media = {} } = data;

  if (!profile.hasWebsite) {
    findings.push({
      category: "Profile",
      title: "Website is missing",
      description: "Add your official business website to your Google Business Profile.",
      severity: "warning",
    });
  }

  if (!profile.hasHours) {
    findings.push({
      category: "Profile",
      title: "Business hours are missing",
      description: "Add accurate opening and closing hours to your profile.",
      severity: "warning",
    });
  }

  if ((reviews.unansweredReviews ?? 0) > 0) {
    findings.push({
      category: "Reviews",
      title: "Unanswered customer reviews",
      description: `${reviews.unansweredReviews} reviews need a response.`,
      severity: "warning",
    });
  }

  if (media.photoCount != null && media.photoCount < 10) {
    findings.push({
      category: "Media",
      title: "Add more business photos",
      description: "Upload genuine, high-quality photos of your business.",
      severity: "warning",
    });
  }

  if (reviews.averageRating != null && reviews.averageRating < 3.5) {
    findings.push({
      category: "Reviews",
      title: "Customer feedback needs attention",
      description: "Review customer feedback and address recurring issues.",
      severity: "critical",
    });
  }

  if (findings.length === 0) {
    findings.push({
      category: "Profile",
      title: "Your profile is in good shape",
      description: "Keep business information current and continue engaging with customers.",
      severity: "good",
    });
  }

  return findings;
}
