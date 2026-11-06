"use client";

import { Button } from "@/components/ui/button";

interface GoogleConnectProps {
  loading: boolean;
  onConnect: () => void;
}

export default function GoogleConnect({ loading, onConnect }: GoogleConnectProps) {
  return (
    <section className="space-y-3 rounded-xl border bg-card p-5">
      <div>
        <h2 className="text-lg font-semibold">Connect Google Business Profile</h2>
        <p className="text-sm text-muted-foreground">
          Authorize access to your business accounts and locations to run an audit.
        </p>
      </div>
      <Button disabled={loading} onClick={onConnect} type="button">
        {loading ? "Connecting..." : "Connect Google Account"}
      </Button>
    </section>
  );
}