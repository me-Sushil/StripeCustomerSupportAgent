// src/store/slices/searchSlice.js
// Redux slice for managing semantic search state
// Handles search queries, results, and history

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/endpoints";

// Initial state
const initialState = {
  results: [],
  currentQuery: "",
  loading: false,
  error: null,
  searchHistory: [],
  filters: {
    topK: 5,
    minScore: 0.7,
    sourceUrls: null,
    dateRange: null,
  },
  vectorStats: {
    totalVectors: 0,
    dimension: 0,
  },
};

// ============================================
// ASYNC THUNKS
// ============================================

// Perform semantic search
export const performSearch = createAsyncThunk(
  "search/perform",
  async ({ query, topK = 5, filter = null }, { rejectWithValue }) => {
    try {
      const response = await api.semanticSearch(query, topK, filter);
      return {
        ...response.data,
        query,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Advanced search with filters
export const performAdvancedSearch = createAsyncThunk(
  "search/advancedSearch",
  async ({ query, options }, { rejectWithValue }) => {
    try {
      const response = await api.advancedSearch(query, options);
      return {
        ...response.data,
        query,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get vector statistics
export const fetchVectorStats = createAsyncThunk(
  "search/fetchVectorStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getVectorStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Process vectors (embed and store)
export const processVectors = createAsyncThunk(
  "search/processVectors",
  async (limit = 100, { rejectWithValue }) => {
    try {
      const response = await api.processVectors(limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const searchSlice = createSlice({
  name: "search",
  initialState,
  reducers: {
    // Set current query
    setCurrentQuery: (state, action) => {
      state.currentQuery = action.payload;
    },

    // Clear search results
    clearResults: (state) => {
      state.results = [];
      state.currentQuery = "";
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Update filters
    updateFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },

    // Reset filters
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },

    // Add to search history
    addToHistory: (state, action) => {
      const newEntry = {
        query: action.payload.query,
        timestamp: new Date().toISOString(),
        resultCount: action.payload.resultCount,
      };

      // Add to beginning of array
      state.searchHistory.unshift(newEntry);

      // Keep only last 20 searches
      if (state.searchHistory.length > 20) {
        state.searchHistory = state.searchHistory.slice(0, 20);
      }
    },

    // Clear search history
    clearHistory: (state) => {
      state.searchHistory = [];
    },

    // Remove from history
    removeFromHistory: (state, action) => {
      state.searchHistory = state.searchHistory.filter(
        (item, index) => index !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    // Perform search
    builder
      .addCase(performSearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performSearch.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.results || [];
        state.currentQuery = action.payload.query;

        // Add to history
        state.searchHistory.unshift({
          query: action.payload.query,
          timestamp: action.payload.timestamp,
          resultCount: action.payload.resultCount,
        });

        // Keep only last 20
        if (state.searchHistory.length > 20) {
          state.searchHistory = state.searchHistory.slice(0, 20);
        }
      })
      .addCase(performSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Advanced search
    builder
      .addCase(performAdvancedSearch.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(performAdvancedSearch.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload.results || [];
        state.currentQuery = action.payload.query;
      })
      .addCase(performAdvancedSearch.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch vector stats
    builder
      .addCase(fetchVectorStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVectorStats.fulfilled, (state, action) => {
        state.loading = false;
        state.vectorStats = {
          totalVectors: action.payload.stats.totalRecordCount || 0,
          dimension: action.payload.stats.dimension || 0,
        };
      })
      .addCase(fetchVectorStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Process vectors
    builder
      .addCase(processVectors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processVectors.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(processVectors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  setCurrentQuery,
  clearResults,
  clearError,
  updateFilters,
  resetFilters,
  addToHistory,
  clearHistory,
  removeFromHistory,
} = searchSlice.actions;

// Export selectors
export const selectSearchResults = (state) => state.search.results;
export const selectCurrentQuery = (state) => state.search.currentQuery;
export const selectSearchLoading = (state) => state.search.loading;
export const selectSearchError = (state) => state.search.error;
export const selectSearchHistory = (state) => state.search.searchHistory;
export const selectSearchFilters = (state) => state.search.filters;
export const selectVectorStats = (state) => state.search.vectorStats;

// Export reducer
export default searchSlice.reducer;
