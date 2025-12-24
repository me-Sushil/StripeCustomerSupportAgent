// src/store/store.js
// Redux store configuration using Redux Toolkit
// Central state management for the application

import { configureStore } from "@reduxjs/toolkit";
import documentReducer from "./slices/documentSlice";
import chunkReducer from "./slices/chunkSlice";
import searchReducer from "./slices/searchSlice";
import pipelineReducer from "./slices/pipelineSlice";

// Configure Redux store with all slices
const store = configureStore({
  reducer: {
    documents: documentReducer,
    chunks: chunkReducer,
    search: searchReducer,
    pipeline: pipelineReducer,
  },
  // Middleware configuration (default includes thunk)
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Disable serializable check for certain actions if needed
      serializableCheck: {
        ignoredActions: ["documents/scrapeUrl/fulfilled"],
      },
    }),
  // Enable Redux DevTools in development
  devTools: import.meta.env.DEV,
});

export default store;
