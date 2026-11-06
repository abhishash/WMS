import { configureStore } from "@reduxjs/toolkit";

import googleAuditReducer from
  "../features/googleAudit/googleAuditSlice";

export const store = configureStore({
  reducer: {
    googleAudit: googleAuditReducer,
  },
});