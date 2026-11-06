"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios from "axios";

export default function CreateGoogleBusinessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const accountId = searchParams.get("accountId");

  const [form, setForm] = useState({
    businessName: "",
    categoryId: "",
    phone: "",
    website: "",
    regionCode: "IN",
    postalCode: "",
    administrativeArea: "",
    locality: "",
    addressLine: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!accountId) {
      setMessage("Please select a Google account first.");
      return;
    }

    try {
      setLoading(true);
      setMessage("");

      const token = localStorage.getItem("token");

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/google/locations/create`,
        {
          accountId,
          businessName: form.businessName,
          categoryId: form.categoryId,
          phone: form.phone,
          website: form.website,
          address: {
            regionCode: form.regionCode,
            postalCode: form.postalCode,
            administrativeArea: form.administrativeArea,
            locality: form.locality,
            addressLines: [form.addressLine],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setMessage("Business location created successfully!");

      const locationId = response.data.data.name;

      router.push(
        `/dashboard/google-business/verify?location=${encodeURIComponent(locationId)}`,
      );
    } catch (error) {
      setMessage(
        error.response?.data?.message || "Unable to create business location.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6">
      <h1 className="mb-2 text-2xl font-bold">
        Create Google Business Profile
      </h1>

      <p className="mb-6 text-sm text-gray-500">
        Enter your genuine business details to create a Google listing.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          name="businessName"
          placeholder="Business name"
          value={form.businessName}
          onChange={handleChange}
          required
          className="w-full rounded border p-3"
        />

        <input
          name="categoryId"
          placeholder="Google category resource name"
          value={form.categoryId}
          onChange={handleChange}
          required
          className="w-full rounded border p-3"
        />

        <input
          name="phone"
          placeholder="Business phone number"
          value={form.phone}
          onChange={handleChange}
          className="w-full rounded border p-3"
        />

        <input
          name="website"
          placeholder="Business website URL"
          value={form.website}
          onChange={handleChange}
          className="w-full rounded border p-3"
        />

        <input
          name="addressLine"
          placeholder="Street address"
          value={form.addressLine}
          onChange={handleChange}
          required
          className="w-full rounded border p-3"
        />

        <input
          name="locality"
          placeholder="City / Town"
          value={form.locality}
          onChange={handleChange}
          required
          className="w-full rounded border p-3"
        />

        <input
          name="administrativeArea"
          placeholder="State"
          value={form.administrativeArea}
          onChange={handleChange}
          className="w-full rounded border p-3"
        />

        <input
          name="postalCode"
          placeholder="PIN code"
          value={form.postalCode}
          onChange={handleChange}
          required
          className="w-full rounded border p-3"
        />

        <input
          name="regionCode"
          value={form.regionCode}
          onChange={handleChange}
          required
          className="w-full rounded border p-3"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-green-600 p-3 font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Business Profile"}
        </button>
      </form>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}
