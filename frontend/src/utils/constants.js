// ============================================
// src/utils/constants.js
// ============================================

export const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000";

export const STATUS_COLORS = {
  pending: "warning",
  processed: "success",
  failed: "danger",
  embedded: "success",
};

export const STRIPE_DOCS_URLS = [
  "https://stripe.com/docs/api",
  "https://stripe.com/docs/payments",
  "https://stripe.com/docs/billing",
  "https://stripe.com/docs/connect",
  "https://stripe.com/docs/webhooks",
];
