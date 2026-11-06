"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Building2,
  Link2,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Star,
  Unlink,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";

import { store } from "@/app/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import AuditCategory from "@/components/audit/AuditCategory";
import AuditFindings from "@/components/audit/AuditFindings";
import GoogleLocations from "@/pages/GoogleLocations";
import {
  clearGoogleAudit,
  connectGoogle,
  loadAuditHistory,
  loadGoogleAccounts,
  loadGoogleLocations,
  runGoogleAudit,
} from "@/features/googleAudit/googleAuditSlice";
import type { BusinessAudit, GoogleLocation } from "@/features/googleAudit/googleAuditSlice";
import api from "@/services/googleAuditApi";

function getErrorMessage(error: unknown, fallback: string) {
  if (typeof error === "string") return error;
  return error instanceof Error ? error.message : fallback;
}

function formatCount(value: number | null | undefined) {
  return value == null ? "Unavailable" : new Intl.NumberFormat().format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: typeof BarChart3;
}) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="font-normal text-sm">{title}</CardTitle>
        <Icon className="size-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight">{value}</div>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

export default function GoogleBusinessAnalytics() {
  const dispatch = useDispatch<typeof store.dispatch>();
  const { accounts, locations, audit, history, loading, error } = useSelector(
    (state: ReturnType<typeof store.getState>) => state.googleAudit,
  );
  const [connected, setConnected] = useState(false);
  const [connection, setConnection] = useState<{ email?: string } | null>(null);
  const [connectionLoading, setConnectionLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [notice, setNotice] = useState("");
  const [connectionError, setConnectionError] = useState("");
  const [selectedGoogleAccountId, setSelectedGoogleAccountId] = useState("");
  const [selectedBusinessAccountName, setSelectedBusinessAccountName] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const selectedAccountGroup = accounts.find(
    (group) => group.googleAccountId === selectedGoogleAccountId,
  );
  const businessAccounts = selectedAccountGroup?.accounts ?? [];
  const selectedLocation = useMemo(
    () => locations.find((location) => location._id === selectedLocationId) ?? null,
    [locations, selectedLocationId],
  );

  useEffect(() => {
    let active = true;

    async function loadConnection() {
      try {
        const params = new URLSearchParams(window.location.search);
        const googleStatus = params.get("google");
        if (googleStatus === "connected") {
          setNotice("Google Business Profile connected successfully.");
        } else if (googleStatus === "denied") {
          setNotice("Google authorization was denied.");
        } else if (googleStatus === "failed") {
          setNotice("Google connection failed. Please try again.");
        }
        if (googleStatus) {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const response = await api.get<never>("/google/status");
        if (!active) return;
        setConnected(response.connected === true);
        setConnection(response.account ?? null);
        if (response.connected) {
          await dispatch(loadGoogleAccounts()).unwrap();
        }
      } catch (loadError) {
        if (active) {
          setConnectionError(getErrorMessage(loadError, "Unable to check Google connection."));
        }
      } finally {
        if (active) setConnectionLoading(false);
      }
    }

    void loadConnection();
    return () => {
      active = false;
    };
  }, [dispatch]);

  useEffect(() => {
    if (!selectedGoogleAccountId && accounts.length > 0) {
      setSelectedGoogleAccountId(accounts[0].googleAccountId);
    }
  }, [accounts, selectedGoogleAccountId]);

  useEffect(() => {
    if (!selectedAccountGroup) return;
    const hasSelectedAccount = businessAccounts.some(
      (account) => account.name === selectedBusinessAccountName,
    );
    if (!hasSelectedAccount) {
      setSelectedBusinessAccountName(businessAccounts[0]?.name ?? "");
    }
  }, [selectedAccountGroup, businessAccounts, selectedBusinessAccountName]);

  useEffect(() => {
    if (
      !selectedAccountGroup ||
      !businessAccounts.some((account) => account.name === selectedBusinessAccountName)
    ) {
      return;
    }

    setSelectedLocationId(null);
    void dispatch(
      loadGoogleLocations({
        googleAccountId: selectedAccountGroup.googleAccountId,
        accountId: selectedBusinessAccountName,
      }),
    );
  }, [dispatch, selectedAccountGroup, selectedBusinessAccountName, businessAccounts]);

  async function handleConnect() {
    setConnecting(true);
    setConnectionError("");
    try {
      const authUrl = await dispatch(connectGoogle()).unwrap();
      window.location.assign(authUrl);
    } catch (connectError) {
      setConnectionError(getErrorMessage(connectError, "Unable to connect Google account."));
      setConnecting(false);
    }
  }

  async function handleDisconnect() {
    if (!window.confirm("Disconnect Google Business Profile from this account?")) return;
    setDisconnecting(true);
    setConnectionError("");
    try {
      await api.delete<never>("/google/disconnect");
      setConnected(false);
      setConnection(null);
      setSelectedGoogleAccountId("");
      setSelectedBusinessAccountName("");
      setSelectedLocationId(null);
      dispatch(clearGoogleAudit());
      setNotice("Google account disconnected.");
    } catch (disconnectError) {
      setConnectionError(getErrorMessage(disconnectError, "Unable to disconnect Google account."));
    } finally {
      setDisconnecting(false);
    }
  }

  function handleSelectLocation(location: GoogleLocation) {
    setSelectedLocationId(location._id);
    void dispatch(loadAuditHistory(location._id));
  }

  function handleRunAudit() {
    if (!selectedLocationId) return;
    void dispatch(runGoogleAudit(selectedLocationId)).then((result) => {
      if (runGoogleAudit.fulfilled.match(result)) {
        setNotice("Business Profile analytics refreshed.");
      }
    });
  }

  const currentMetrics = audit?.metrics;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl tracking-tight">Google Business Profile</h1>
          <p className="text-sm text-muted-foreground">
            Connect your profile to review visibility, customer actions, reviews, and profile health.
          </p>
        </div>
        {connected && (
          <Button
            disabled={disconnecting}
            onClick={handleDisconnect}
            type="button"
            variant="outline"
          >
            {disconnecting ? <Loader2 className="animate-spin" /> : <Unlink />}
            {disconnecting ? "Disconnecting..." : "Disconnect"}
          </Button>
        )}
      </header>

      {(notice || connectionError || error) && (
        <div
          className={`flex items-start gap-2 rounded-lg border p-3 text-sm ${
            connectionError || error
              ? "border-destructive/30 bg-destructive/5 text-destructive"
              : "border-border bg-muted/50"
          }`}
          role={connectionError || error ? "alert" : "status"}
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>{connectionError || error || notice}</span>
        </div>
      )}

      {connectionLoading ? (
        <div className="flex min-h-44 items-center justify-center gap-2 rounded-xl border text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Checking Google connection...
        </div>
      ) : !connected ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link2 className="size-5 text-primary" />
              Connect your Google account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Authorize access to the Business Profile you manage. Your Google password is never shared
              with this app.
            </p>
            <Button disabled={connecting} onClick={handleConnect} type="button">
              {connecting ? <Loader2 className="animate-spin" /> : <Link2 />}
              {connecting ? "Connecting..." : "Connect Google Business Profile"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-5 text-primary" />
                Connected profile
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium" htmlFor="google-account">
                  Google account
                </label>
                <select
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  id="google-account"
                  onChange={(event) => {
                    setSelectedGoogleAccountId(event.target.value);
                    setSelectedBusinessAccountName("");
                  }}
                  value={selectedGoogleAccountId}
                >
                  <option disabled value="">
                    Select Google account
                  </option>
                  {accounts.map((group) => (
                    <option key={group.googleAccountId} value={group.googleAccountId}>
                      {group.email ?? connection?.email ?? "Connected Google account"}
                    </option>
                  ))}
                </select>
                {accounts.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    {connection?.email ?? "Connected"} - no Business Profile accounts were returned.
                  </p>
                )}
              </div>

              {businessAccounts.length > 0 && (
                <div className="space-y-1">
                  <label className="text-sm font-medium" htmlFor="business-account">
                    Business Profile account
                  </label>
                  <select
                    className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                    id="business-account"
                    onChange={(event) => setSelectedBusinessAccountName(event.target.value)}
                    value={selectedBusinessAccountName}
                  >
                    <option disabled value="">
                      Select a Business Profile account
                    </option>
                    {businessAccounts.map((account) => (
                      <option key={account.name} value={account.name}>
                        {account.accountName ?? account.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </CardContent>
          </Card>

          {accounts.length === 0 ? (
            <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
              This Google account has no accessible Business Profile accounts. Confirm the account has
              manager or owner access, then refresh.
            </p>
          ) : (
            <GoogleLocations
              locations={locations}
              onSelectLocation={handleSelectLocation}
              selectedLocationId={selectedLocationId}
            />
          )}

          {selectedLocation && (
            <section className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedLocation.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {selectedLocation.address || selectedLocation.category || "Google Business Profile"}
                  </p>
                </div>
                <Button disabled={loading} onClick={handleRunAudit} type="button">
                  {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                  {loading ? "Refreshing analytics..." : "Refresh analytics"}
                </Button>
              </div>

              {audit ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <MetricCard
                      description="Profile health score"
                      icon={Building2}
                      title="Profile score"
                      value={audit.overallScore == null ? "Unavailable" : `${audit.overallScore}/100`}
                    />
                    <MetricCard
                      description="Google Search and Maps visibility"
                      icon={BarChart3}
                      title="Search & Maps impressions"
                      value={formatCount(currentMetrics?.performance?.searchImpressions)}
                    />
                    <MetricCard
                      description="Website visits from your profile"
                      icon={Link2}
                      title="Website clicks"
                      value={formatCount(currentMetrics?.performance?.websiteClicks)}
                    />
                    <MetricCard
                      description="Calls from your profile"
                      icon={Phone}
                      title="Phone calls"
                      value={formatCount(currentMetrics?.performance?.phoneCalls)}
                    />
                    <MetricCard
                      description="Requests for directions"
                      icon={MapPin}
                      title="Direction requests"
                      value={formatCount(currentMetrics?.performance?.directionRequests)}
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                      description="Average Google rating"
                      icon={Star}
                      title="Rating"
                      value={
                        currentMetrics?.reviews?.averageRating == null
                          ? "Unavailable"
                          : `${currentMetrics.reviews.averageRating.toFixed(1)} / 5`
                      }
                    />
                    <MetricCard
                      description="Reviews found for this location"
                      icon={Star}
                      title="Reviews"
                      value={formatCount(currentMetrics?.reviews?.totalReviews)}
                    />
                    <MetricCard
                      description="Share of reviews with a business reply"
                      icon={AlertCircle}
                      title="Review response rate"
                      value={
                        currentMetrics?.reviews?.responseRate == null
                          ? "Unavailable"
                          : `${currentMetrics.reviews.responseRate}%`
                      }
                    />
                    <MetricCard
                      description="Photos and videos on your profile"
                      icon={Building2}
                      title="Profile media"
                      value={formatCount(currentMetrics?.media?.totalMedia)}
                    />
                  </div>

                  <div className="grid gap-4 xl:grid-cols-2">
                    <AuditCategory items={audit.categories} />
                    <AuditFindings findings={audit.findings} />
                  </div>

                  {audit.sourceErrors.length > 0 && (
                    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
                      <h2 className="font-medium">Some analytics are unavailable</h2>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {audit.sourceErrors.map((sourceError) => (
                          <li key={`${sourceError.source}-${sourceError.message}`}>
                            <span className="font-medium capitalize">{sourceError.source}:</span>{" "}
                            {sourceError.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Card>
                    <CardHeader>
                      <CardTitle>Recent analytics refreshes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {history.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No previous refreshes.</p>
                      ) : (
                        <ul className="divide-y">
                          {history.map((item: BusinessAudit) => (
                            <li
                              className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"
                              key={item._id}
                            >
                              <span>{formatDate(item.auditedAt)}</span>
                              <span className="text-muted-foreground">
                                Score: {item.overallScore == null ? "Unavailable" : `${item.overallScore}/100`}
                                {" | "}
                                Data coverage: {item.coveragePercentage}%
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="mt-3 text-xs text-muted-foreground">
                        Last refreshed {formatDate(audit.auditedAt)}. Performance covers the latest 30
                        complete days available from Google.
                      </p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center">
                  <BarChart3 className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
                  <h3 className="mt-3 font-semibold">No analytics loaded yet</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Refresh analytics to load profile quality, performance, review, and media insights.
                  </p>
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}
