"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/services/googleAuditApi";

export default function GoogleAccountList() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const data = await api.get("/google/accounts");
        setAccounts(data.accounts || []);
      } catch (error) {
        setError(
          error.response?.data?.message || "Unable to load Google accounts",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, []);

  if (loading) return <p>Loading Google accounts...</p>;

  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Select Google Business Account</h2>

      {accounts.length === 0 && (
        <p>No accessible Google Business accounts found.</p>
      )}

      {accounts.map((account) => (
        <button
          key={account.name}
          onClick={() => {
            const accountId = account.name.split("/")[1];

            router.push(
              `/settings/google-business?accountId=${encodeURIComponent(accountId)}`,
            );
          }}
          className="w-full rounded-xl border bg-white p-5 text-left hover:border-blue-500"
        >
          <h3 className="font-semibold">
            {account.accountName || account.name}
          </h3>

          <p className="mt-1 text-sm text-gray-500">{account.type}</p>
        </button>
      ))}
    </div>
  );
}
