// src/store/slices/documentSlice.js
// Redux slice for managing scraped documents state
// Handles scraping, fetching, and document management

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/endpoints";

// Initial state
const initialState = {
  documents: [],
  currentDocument: null,
  loading: false,
  error: null,
  scraping: false,
  scrapeProgress: {
    total: 0,
    completed: 0,
    failed: 0,
  },
};

// ============================================
// ASYNC THUNKS (API CALLS)
// ============================================

// Fetch all documents
export const fetchDocuments = createAsyncThunk(
  "documents/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getDocuments();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Scrape a single URL
export const scrapeUrl = createAsyncThunk(
  "documents/scrapeUrl",
  async ({ url, usePuppeteer = false }, { rejectWithValue }) => {
    try {
      const response = await api.scrapeUrl(url, usePuppeteer);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Scrape multiple URLs
export const scrapeBatch = createAsyncThunk(
  "documents/scrapeBatch",
  async ({ urls, usePuppeteer = false }, { rejectWithValue }) => {
    try {
      const response = await api.scrapeBatch(urls, usePuppeteer);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Fetch single document by ID
export const fetchDocumentById = createAsyncThunk(
  "documents/fetchById",
  async (documentId, { rejectWithValue }) => {
    try {
      const response = await api.getDocumentById(documentId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const documentSlice = createSlice({
  name: "documents",
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Clear current document
    clearCurrentDocument: (state) => {
      state.currentDocument = null;
    },

    // Reset scrape progress
    resetScrapeProgress: (state) => {
      state.scrapeProgress = {
        total: 0,
        completed: 0,
        failed: 0,
      };
    },

    // Update scrape progress manually
    updateScrapeProgress: (state, action) => {
      state.scrapeProgress = {
        ...state.scrapeProgress,
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch all documents
    builder
      .addCase(fetchDocuments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocuments.fulfilled, (state, action) => {
        state.loading = false;
        state.documents = action.payload.documents || [];
      })
      .addCase(fetchDocuments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Scrape single URL
    builder
      .addCase(scrapeUrl.pending, (state) => {
        state.scraping = true;
        state.error = null;
      })
      .addCase(scrapeUrl.fulfilled, (state, action) => {
        state.scraping = false;
        // Add new document to the list if it exists
        if (action.payload.data) {
          state.documents.unshift(action.payload.data);
        }
      })
      .addCase(scrapeUrl.rejected, (state, action) => {
        state.scraping = false;
        state.error = action.payload;
      });

    // Scrape batch URLs
    builder
      .addCase(scrapeBatch.pending, (state) => {
        state.scraping = true;
        state.error = null;
      })
      .addCase(scrapeBatch.fulfilled, (state, action) => {
        state.scraping = false;
        const summary = action.payload.summary;
        state.scrapeProgress = {
          total: summary.successful + summary.failed + summary.skipped,
          completed: summary.successful,
          failed: summary.failed,
        };
      })
      .addCase(scrapeBatch.rejected, (state, action) => {
        state.scraping = false;
        state.error = action.payload;
      });

    // Fetch document by ID
    builder
      .addCase(fetchDocumentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDocumentById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDocument = action.payload;
      })
      .addCase(fetchDocumentById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  clearError,
  clearCurrentDocument,
  resetScrapeProgress,
  updateScrapeProgress,
} = documentSlice.actions;

// Export selectors
export const selectAllDocuments = (state) => state.documents.documents;
export const selectCurrentDocument = (state) => state.documents.currentDocument;
export const selectDocumentsLoading = (state) => state.documents.loading;
export const selectDocumentsError = (state) => state.documents.error;
export const selectScraping = (state) => state.documents.scraping;
export const selectScrapeProgress = (state) => state.documents.scrapeProgress;

// Export reducer
export default documentSlice.reducer;
