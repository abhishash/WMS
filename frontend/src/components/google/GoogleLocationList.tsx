"use client";

import api from "@/services/googleAuditApi";
import { useEffect, useState } from "react";

// import api from "@/lib/api";

export default function GoogleLocationList({ accountId }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!accountId) {
      setLoading(false);
      return;
    }

    const fetchLocations = async () => {
      try {
        const data = await api.get(
          `/google/accounts/${encodeURIComponent(accountId)}/locations`,
        );

        setLocations(data.locations || []);
      } catch (error) {
        setMessage(
          error.response?.data?.message || "Unable to fetch locations",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, [accountId]);

  const handleSelect = async (location) => {
    try {
      setSaving(location.name);
      setMessage("");

      await api.post("/google/locations/select", {
        accountId,
        locationName: location.name,
      });

      setMessage("Business location selected successfully.");
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to select location");
    } finally {
      setSaving("");
    }
  };

  if (loading) return <p>Loading business locations...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">Select Business Location</h2>

      {message && <p className="text-sm text-blue-600">{message}</p>}

      {locations.length === 0 && <p>No business locations found.</p>}

      {locations.map((location) => (
        <div key={location.name} className="rounded-xl border bg-white p-5">
          <h3 className="font-semibold">{location.title}</h3>

          <p className="mt-2 text-sm text-gray-500">
            {location.storefrontAddress?.addressLines?.join(", ")}
          </p>

          <button
            onClick={() => handleSelect(location)}
            disabled={Boolean(saving)}
            className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving === location.name ? "Saving..." : "Select Business"}
          </button>
        </div>
      ))}
    </div>
  );
}
