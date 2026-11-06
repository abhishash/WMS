"use client";

import type { ReactNode } from "react";
import { Provider } from "react-redux";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PREFERENCE_DEFAULTS } from "@/lib/preferences/preferences-config";
import { PreferencesStoreProvider } from "@/stores/preferences/preferences-provider";

import { store } from "./store";

export function AppProviders({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <Provider store={store}>
      <TooltipProvider>
        <PreferencesStoreProvider initialValues={PREFERENCE_DEFAULTS}>
          {children}
          <Toaster />
        </PreferencesStoreProvider>
      </TooltipProvider>
    </Provider>
  );
}
