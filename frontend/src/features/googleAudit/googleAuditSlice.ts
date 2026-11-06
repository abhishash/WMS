import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import api, { type ApiResponse } from "../../services/googleAuditApi";

export interface GoogleBusinessAccount {
  name: string;
  accountName?: string;
  type?: string;
  role?: string;
}

export interface GoogleAccountGroup {
  googleAccountId: string;
  email?: string;
  accounts: GoogleBusinessAccount[];
}

export interface GoogleLocation {
  _id: string;
  title: string;
  address?: string;
  category?: string;
  phone?: string;
  website?: string;
}

export interface PerformanceMetrics {
  websiteClicks: number | null;
  phoneCalls: number | null;
  directionRequests: number | null;
  searchImpressions: number | null;
}

export interface AuditMetrics {
  profile?: {
    hasName?: boolean;
    hasCategory?: boolean;
    hasPhone?: boolean;
    hasAddress?: boolean;
    hasWebsite?: boolean;
    hasHours?: boolean;
    hasDescription?: boolean;
    hasSecondaryCategories?: boolean;
  };
  reviews?: {
    totalReviews: number | null;
    averageRating: number | null;
    repliedReviews: number | null;
    unansweredReviews: number | null;
    responseRate: number | null;
  };
  media?: {
    totalMedia: number | null;
    photoCount: number | null;
    videoCount: number | null;
  };
  performance?: PerformanceMetrics;
  sourceAvailable?: {
    profile?: boolean;
    reviews?: boolean;
    media?: boolean;
    performance?: boolean;
  };
}

export interface AuditCategory {
  category: string;
  name: string;
  score: number | null;
  max: number;
  available: boolean;
}

export interface AuditFinding {
  category: string;
  title: string;
  description: string;
  severity: "good" | "warning" | "critical";
}

export interface AuditSourceError {
  source: string;
  message: string;
}

export interface BusinessAudit {
  _id: string;
  locationId: string;
  overallScore: number | null;
  coveragePercentage: number;
  categories: AuditCategory[];
  findings: AuditFinding[];
  sourceErrors: AuditSourceError[];
  metrics?: AuditMetrics;
  auditedAt: string;
}

interface GoogleAuditState {
  accounts: GoogleAccountGroup[];
  locations: GoogleLocation[];
  audit: BusinessAudit | null;
  history: BusinessAudit[];
  loading: boolean;
  error: string | null;
}

const initialState: GoogleAuditState = {
  accounts: [],
  locations: [],
  audit: null,
  history: [],
  loading: false,
  error: null,
};

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "The request failed";
}

function requireResponseData<T>(response: ApiResponse<T>, message: string) {
  if (response.data === undefined) throw new Error(message);
  return response.data;
}

export const connectGoogle = createAsyncThunk<string, void, { rejectValue: string }>(
  "googleAudit/connect",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<never>("/google/connect");
      if (!response.authUrl) throw new Error("Google did not return an authorization URL");
      return response.authUrl;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const loadGoogleAccounts = createAsyncThunk<GoogleAccountGroup[], void, { rejectValue: string }>(
  "googleAudit/loadAccounts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get<GoogleAccountGroup[]>("/google/accounts");
      return requireResponseData(response, "Google returned no Business Profile accounts");
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const loadGoogleLocations = createAsyncThunk<
  GoogleLocation[],
  { googleAccountId: string; accountId: string },
  { rejectValue: string }
>("googleAudit/loadLocations", async ({ googleAccountId, accountId }, { rejectWithValue }) => {
  try {
    const query = new URLSearchParams({ googleAccountId, accountId });
    const response = await api.get<GoogleLocation[]>(`/google/locations?${query}`);
    return requireResponseData(response, "Google returned no Business Profile locations");
  } catch (error) {
    return rejectWithValue(getErrorMessage(error));
  }
});

export const runGoogleAudit = createAsyncThunk<BusinessAudit, string, { rejectValue: string }>(
  "googleAudit/run",
  async (locationId, { rejectWithValue }) => {
    try {
      const response = await api.post<BusinessAudit>("/audit/run", { locationId });
      return requireResponseData(response, "The analytics refresh returned no audit data");
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

export const loadAuditHistory = createAsyncThunk<BusinessAudit[], string, { rejectValue: string }>(
  "googleAudit/loadHistory",
  async (locationId, { rejectWithValue }) => {
    try {
      const response = await api.get<BusinessAudit[]>(
        `/audit/history/${encodeURIComponent(locationId)}`,
      );
      return requireResponseData(response, "The analytics history response was empty");
    } catch (error) {
      return rejectWithValue(getErrorMessage(error));
    }
  },
);

const googleAuditSlice = createSlice({
  name: "googleAudit",
  initialState,
  reducers: {
    clearAudit(state) {
      state.audit = null;
      state.history = [];
      state.error = null;
    },
    clearGoogleAudit() {
      return initialState;
    },
    clearGoogleError(state) {
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(connectGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(connectGoogle.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(connectGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error.message ?? "Unable to connect Google";
      })
      .addCase(loadGoogleAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadGoogleAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload;
      })
      .addCase(loadGoogleAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error.message ?? "Unable to load Google accounts";
      })
      .addCase(loadGoogleLocations.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.locations = [];
        state.audit = null;
        state.history = [];
      })
      .addCase(loadGoogleLocations.fulfilled, (state, action) => {
        state.loading = false;
        state.locations = action.payload;
      })
      .addCase(loadGoogleLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error.message ?? "Unable to load Google locations";
      })
      .addCase(runGoogleAudit.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(runGoogleAudit.fulfilled, (state, action) => {
        state.loading = false;
        state.audit = action.payload;
        state.history = [action.payload, ...state.history.filter((item) => item._id !== action.payload._id)];
      })
      .addCase(runGoogleAudit.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error.message ?? "Audit failed";
      })
      .addCase(loadAuditHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.audit = null;
        state.history = [];
      })
      .addCase(loadAuditHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
        state.audit = action.payload[0] ?? null;
      })
      .addCase(loadAuditHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? action.error.message ?? "Unable to load audit history";
      });
  },
});

export const { clearAudit, clearGoogleAudit, clearGoogleError } = googleAuditSlice.actions;
export default googleAuditSlice.reducer;
