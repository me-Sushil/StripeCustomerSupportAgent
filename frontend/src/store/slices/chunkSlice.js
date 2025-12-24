// src/store/slices/chunkSlice.js
// Redux slice for managing document chunks state
// Handles chunking operations and chunk statistics

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/endpoints";

// Initial state
const initialState = {
  chunks: [],
  stats: {
    total: 0,
    pending: 0,
    embedded: 0,
    failed: 0,
  },
  currentDocumentChunks: [],
  loading: false,
  chunking: false,
  error: null,
  chunkingProgress: {
    processed: 0,
    failed: 0,
  },
};

// ============================================
// ASYNC THUNKS
// ============================================

// Get chunk statistics
export const fetchChunkStats = createAsyncThunk(
  "chunks/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getChunkStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Chunk a specific document
export const chunkDocument = createAsyncThunk(
  "chunks/chunkDocument",
  async (documentId, { rejectWithValue }) => {
    try {
      const response = await api.chunkDocument(documentId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Chunk all pending documents
export const chunkAllDocuments = createAsyncThunk(
  "chunks/chunkAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.chunkAllDocuments();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get chunks for a specific document
export const fetchChunksByDocument = createAsyncThunk(
  "chunks/fetchByDocument",
  async (documentId, { rejectWithValue }) => {
    try {
      const response = await api.getChunksByDocument(documentId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Get all chunks with pagination
export const fetchAllChunks = createAsyncThunk(
  "chunks/fetchAll",
  async ({ page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await api.getAllChunks(page, limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const chunkSlice = createSlice({
  name: "chunks",
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },

    // Reset chunking progress
    resetChunkingProgress: (state) => {
      state.chunkingProgress = {
        processed: 0,
        failed: 0,
      };
    },

    // Clear current document chunks
    clearCurrentDocumentChunks: (state) => {
      state.currentDocumentChunks = [];
    },

    // Update stats manually
    updateStats: (state, action) => {
      state.stats = {
        ...state.stats,
        ...action.payload,
      };
    },
  },
  extraReducers: (builder) => {
    // Fetch chunk statistics
    builder
      .addCase(fetchChunkStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChunkStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload.stats;
      })
      .addCase(fetchChunkStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Chunk single document
    builder
      .addCase(chunkDocument.pending, (state) => {
        state.chunking = true;
        state.error = null;
      })
      .addCase(chunkDocument.fulfilled, (state, action) => {
        state.chunking = false;
        state.chunkingProgress.processed += 1;
      })
      .addCase(chunkDocument.rejected, (state, action) => {
        state.chunking = false;
        state.error = action.payload;
        state.chunkingProgress.failed += 1;
      });

    // Chunk all documents
    builder
      .addCase(chunkAllDocuments.pending, (state) => {
        state.chunking = true;
        state.error = null;
      })
      .addCase(chunkAllDocuments.fulfilled, (state, action) => {
        state.chunking = false;
        state.chunkingProgress = {
          processed: action.payload.data.processed,
          failed: action.payload.data.failed,
        };
      })
      .addCase(chunkAllDocuments.rejected, (state, action) => {
        state.chunking = false;
        state.error = action.payload;
      });

    // Fetch chunks by document
    builder
      .addCase(fetchChunksByDocument.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChunksByDocument.fulfilled, (state, action) => {
        state.loading = false;
        state.currentDocumentChunks = action.payload.chunks || [];
      })
      .addCase(fetchChunksByDocument.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch all chunks
    builder
      .addCase(fetchAllChunks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllChunks.fulfilled, (state, action) => {
        state.loading = false;
        state.chunks = action.payload.chunks || [];
      })
      .addCase(fetchAllChunks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Export actions
export const {
  clearError,
  resetChunkingProgress,
  clearCurrentDocumentChunks,
  updateStats,
} = chunkSlice.actions;

// Export selectors
export const selectChunkStats = (state) => state.chunks.stats;
export const selectCurrentDocumentChunks = (state) =>
  state.chunks.currentDocumentChunks;
export const selectAllChunks = (state) => state.chunks.chunks;
export const selectChunksLoading = (state) => state.chunks.loading;
export const selectChunking = (state) => state.chunks.chunking;
export const selectChunksError = (state) => state.chunks.error;
export const selectChunkingProgress = (state) => state.chunks.chunkingProgress;

// Export reducer
export default chunkSlice.reducer;
