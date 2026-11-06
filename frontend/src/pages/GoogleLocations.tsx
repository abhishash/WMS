"use client";

import { Button } from "@/components/ui/button";

import type { GoogleLocation } from "../features/googleAudit/googleAuditSlice";

interface GoogleLocationsProps {
  locations: GoogleLocation[];
  selectedLocationId: string | null;
  onSelectLocation: (location: GoogleLocation) => void;
}

export default function GoogleLocations({
  locations,
  selectedLocationId,
  onSelectLocation,
}: GoogleLocationsProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Business locations</h2>
      {locations.length === 0 ? (
        <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
          Choose a Google Business account to load its locations.
        </p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {locations.map((location) => (
            <li key={location._id}>
              <Button
                aria-pressed={selectedLocationId === location._id}
                className="h-auto w-full justify-start whitespace-normal p-4 text-left"
                onClick={() => onSelectLocation(location)}
                type="button"
                variant={selectedLocationId === location._id ? "secondary" : "outline"}
              >
                <span className="block min-w-0">
                  <span className="block font-medium">{location.title || "Untitled location"}</span>
                  {location.address ? (
                    <span className="mt-1 block text-sm font-normal text-muted-foreground">{location.address}</span>
                  ) : null}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
