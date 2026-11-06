import type { Metadata } from "next";

import GoogleBusinessAnalytics from "@/pages/GoogleAudit";

export const metadata: Metadata = {
  title: "Business Profile Analytics",
  description: "Review Google Business Profile performance and profile health insights.",
};

export default function GoogleBusinessAuditPage() {
  return <GoogleBusinessAnalytics />;
}
