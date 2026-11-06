"use client";

import { useSearchParams } from "next/navigation";

import GoogleAccountList from
  "@/components/google/GoogleAccountList";

import GoogleLocationList from
  "@/components/google/GoogleLocationList";

export default function GoogleBusinessPage() {
  const searchParams = useSearchParams();

  const accountId = searchParams.get("accountId");

  return (
    <main className="min-h-screen bg-gray-50 p-6 md:p-10">

      <div className="mx-auto max-w-4xl">

        <h1 className="mb-3 text-3xl font-bold">
          Google Business Setup
        </h1>

        <p className="mb-8 text-gray-500">
          Choose the Google Business account and location
          you want to connect.
        </p>

        {!accountId ? (
          <GoogleAccountList />
        ) : (
          <GoogleLocationList accountId={accountId} />
        )}

      </div>

    </main>
  );
}