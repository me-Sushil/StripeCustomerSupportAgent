// src/store/slices/pipelineSlice.js
// Redux slice for managing complete pipeline execution
// Handles end-to-end processing: scrape -> chunk -> embed

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/endpoints";

// Initial state
const initialState = {
  running: false,
  currentStep: null, // 'scraping' | 'chunking' | 'embedding' | 'complete'
  progress: {
    scraping: { status: "pending", count: 0 },
    chunking: { status: "pending", count: 0 },
    embedding: { status: "pending", count: 0 },
  },
  results: null,
  error: null,
  logs: [],
};

// ============================================
// ASYNC THUNKS
// ============================================

// Run complete pipeline
export const runCompletePipeline = createAsyncThunk(
  "pipeline/runComplete",
  async ({ urls }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(addLog({ message: "Starting pipeline...", type: "info" }));
      dispatch(updateStep("scraping"));

      const response = await api.runPipeline(urls);

      dispatch(addLog({ message: "Pipeline completed!", type: "success" }));
      dispatch(updateStep("complete"));

      return response.data;
    } catch (error) {
      dispatch(
        addLog({
          message: `Pipeline failed: ${error.message}`,
          type: "error",
        })
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Run scraping step only
export const runScrapingStep = createAsyncThunk(
  "pipeline/runScraping",
  async ({ urls, usePuppeteer = false }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(addLog({ message: "Starting scraping...", type: "info" }));
      const response = await api.scrapeBatch(urls, usePuppeteer);
      dispatch(
        addLog({
          message: `Scraped ${response.data.summary.successful} URLs`,
          type: "success",
        })
      );
      return response.data;
    } catch (error) {
      dispatch(
        addLog({
          message: `Scraping failed: ${error.message}`,
          type: "error",
        })
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Run chunking step only
export const runChunkingStep = createAsyncThunk(
  "pipeline/runChunking",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      dispatch(addLog({ message: "Starting chunking...", type: "info" }));
      const response = await api.chunkAllDocuments();
      dispatch(
        addLog({
          message: `Chunked ${response.data.data.processed} documents`,
          type: "success",
        })
      );
      return response.data;
    } catch (error) {
      dispatch(
        addLog({
          message: `Chunking failed: ${error.message}`,
          type: "error",
        })
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Run embedding step only
export const runEmbeddingStep = createAsyncThunk(
  "pipeline/runEmbedding",
  async ({ limit = 100 }, { rejectWithValue, dispatch }) => {
    try {
      dispatch(addLog({ message: "Starting embedding...", type: "info" }));
      const response = await api.processVectors(limit);
      dispatch(
        addLog({
          message: `Embedded ${response.data.data.processed} chunks`,
          type: "success",
        })
      );
      return response.data;
    } catch (error) {
      dispatch(
        addLog({
          message: `Embedding failed: ${error.message}`,
          type: "error",
        })
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ============================================
// SLICE
// ============================================

const pipelineSlice = createSlice({
  name: "pipeline",
  initialState,
  reducers: {
    // Update current step
    updateStep: (state, action) => {
      state.currentStep = action.payload;
    },

    // Update progress for specific step
    updateProgress: (state, action) => {
      const { step, status, count } = action.payload;
      state.progress[step] = { status, count };
    },

    // Add log entry
    addLog: (state, action) => {
      const log = {
        timestamp: new Date().toISOString(),
        message: action.payload.message,
        type: action.payload.type || "info",
      };
      state.logs.push(log);

      // Keep only last 100 logs
      if (state.logs.length > 100) {
        state.logs = state.logs.slice(-100);
      }
    },

    // Clear logs
    clearLogs: (state) => {
      state.logs = [];
    },

    // Reset pipeline
    resetPipeline: (state) => {
      state.running = false;
      state.currentStep = null;
      state.progress = initialState.progress;
      state.results = null;
      state.error = null;
    },

    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Complete pipeline
    builder
      .addCase(runCompletePipeline.pending, (state) => {
        state.running = true;
        state.error = null;
        state.currentStep = "scraping";
      })
      .addCase(runCompletePipeline.fulfilled, (state, action) => {
        state.running = false;
        state.currentStep = "complete";
        state.results = action.payload.results;

        // Update progress
        if (action.payload.results) {
          const { scraping, chunking, embedding } = action.payload.results;

          state.progress.scraping = {
            status: "complete",
            count: scraping?.successful?.length || 0,
          };

          state.progress.chunking = {
            status: "complete",
            count: chunking?.processed || 0,
          };

          state.progress.embedding = {
            status: "complete",
            count: embedding?.processed || 0,
          };
        }
      })
      .addCase(runCompletePipeline.rejected, (state, action) => {
        state.running = false;
        state.error = action.payload;
        state.currentStep = null;
      });

    // Scraping step
    builder
      .addCase(runScrapingStep.pending, (state) => {
        state.running = true;
        state.currentStep = "scraping";
        state.progress.scraping.status = "running";
      })
      .addCase(runScrapingStep.fulfilled, (state, action) => {
        state.running = false;
        state.progress.scraping = {
          status: "complete",
          count: action.payload.summary?.successful || 0,
        };
      })
      .addCase(runScrapingStep.rejected, (state, action) => {
        state.running = false;
        state.error = action.payload;
        state.progress.scraping.status = "failed";
      });

    // Chunking step
    builder
      .addCase(runChunkingStep.pending, (state) => {
        state.running = true;
        state.currentStep = "chunking";
        state.progress.chunking.status = "running";
      })
      .addCase(runChunkingStep.fulfilled, (state, action) => {
        state.running = false;
        state.progress.chunking = {
          status: "complete",
          count: action.payload.data?.processed || 0,
        };
      })
      .addCase(runChunkingStep.rejected, (state, action) => {
        state.running = false;
        state.error = action.payload;
        state.progress.chunking.status = "failed";
      });

    // Embedding step
    builder
      .addCase(runEmbeddingStep.pending, (state) => {
        state.running = true;
        state.currentStep = "embedding";
        state.progress.embedding.status = "running";
      })
      .addCase(runEmbeddingStep.fulfilled, (state, action) => {
        state.running = false;
        state.progress.embedding = {
          status: "complete",
          count: action.payload.data?.processed || 0,
        };
      })
      .addCase(runEmbeddingStep.rejected, (state, action) => {
        state.running = false;
        state.error = action.payload;
        state.progress.embedding.status = "failed";
      });
  },
});

// Export actions
export const {
  updateStep,
  updateProgress,
  addLog,
  clearLogs,
  resetPipeline,
  clearError,
} = pipelineSlice.actions;

// Export selectors
export const selectPipelineRunning = (state) => state.pipeline.running;
export const selectCurrentStep = (state) => state.pipeline.currentStep;
export const selectPipelineProgress = (state) => state.pipeline.progress;
export const selectPipelineResults = (state) => state.pipeline.results;
export const selectPipelineError = (state) => state.pipeline.error;
export const selectPipelineLogs = (state) => state.pipeline.logs;

// Export reducer
export default pipelineSlice.reducer;
