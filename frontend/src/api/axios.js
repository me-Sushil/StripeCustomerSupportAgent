// src/api/axios.js
// Axios instance configuration for API calls
// Includes interceptors for request/response handling

import axios from "axios";
import toast from "react-hot-toast";

// Base URL for API - will use proxy in development
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - runs before every request
axiosInstance.interceptors.request.use(
  (config) => {
    // Log request in development
    if (import.meta.env.DEV) {
      console.log(
        `🚀 ${config.method.toUpperCase()} ${config.url}`,
        config.data
      );
    }

    // Add authorization token if available
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - runs after every response
axiosInstance.interceptors.response.use(
  (response) => {
    // Log response in development
    if (import.meta.env.DEV) {
      console.log(
        `✅ ${response.config.method.toUpperCase()} ${response.config.url}`,
        response.data
      );
    }
    return response;
  },
  (error) => {
    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 400:
          toast.error(data.error || "Bad request");
          break;
        case 401:
          toast.error("Unauthorized. Please login again.");
          // Could redirect to login here
          break;
        case 403:
          toast.error("Forbidden. You do not have permission.");
          break;
        case 404:
          toast.error("Resource not found");
          break;
        case 500:
          toast.error("Server error. Please try again later.");
          break;
        default:
          toast.error(data.message || "An error occurred");
      }

      console.error(`❌ Response error [${status}]:`, data);
    } else if (error.request) {
      // Request made but no response received
      toast.error("No response from server. Check your connection.");
      console.error("❌ No response:", error.request);
    } else {
      // Error in request setup
      toast.error("Request failed. Please try again.");
      console.error("❌ Request setup error:", error.message);
    }

    return Promise.reject(error);
  }
);

// Helper function for handling API calls with loading states
export const apiCall = async (requestFn, options = {}) => {
  const {
    showLoading = true,
    successMessage = null,
    errorMessage = null,
  } = options;

  try {
    if (showLoading) {
      toast.loading("Processing...", { id: "api-loading" });
    }

    const response = await requestFn();

    if (showLoading) {
      toast.dismiss("api-loading");
    }

    if (successMessage) {
      toast.success(successMessage);
    }

    return { success: true, data: response.data };
  } catch (error) {
    if (showLoading) {
      toast.dismiss("api-loading");
    }

    if (errorMessage) {
      toast.error(errorMessage);
    }

    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
};

export default axiosInstance;
