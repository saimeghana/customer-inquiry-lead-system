/**
 * config.js — Centralised configuration for the inquiry form.
 *
 * HOW TO SET THIS UP:
 *   1. Replace ZAPIER_WEBHOOK_URL with your Zapier Catch Hook URL.
 *   2. (Optional) Replace AIRTABLE_* values if you are posting directly
 *      to Airtable instead of going through Zapier.
 *   3. Commit config.js BUT never commit real API tokens — use environment
 *      variables or a CI/CD secrets manager for production.
 *
 * See SETUP.md for step-by-step instructions.
 */

const CONFIG = {

  // ── Zapier Webhook ────────────────────────────────────────────────────────
  // Create a "Webhooks by Zapier > Catch Hook" trigger and paste the URL here.
  // Zapier will forward each submission to Airtable, email, Slack, etc.
  ZAPIER_WEBHOOK_URL: "https://hooks.zapier.com/hooks/catch/26732947/ux6nc4a/",

  // ── Direct Airtable API (alternative / parallel path) ────────────────────
  // If you want the form to ALSO write directly to Airtable (bypassing Zapier),
  // fill in these values.  Leave blank ("") to disable.
  AIRTABLE_BASE_ID:   "",          // e.g. "appXXXXXXXXXXXXXX"
  AIRTABLE_TABLE_NAME: "Leads",    // Name of your Airtable table
  AIRTABLE_API_TOKEN:  "",         // Personal Access Token (NOT the old API key)
                                   // Scope needed: data.records:write

  // ── Submission mode ───────────────────────────────────────────────────────
  // "zapier"   → POST to Zapier webhook only (recommended for beginners)
  // "airtable" → POST directly to Airtable API only
  // "both"     → POST to both simultaneously
  SUBMISSION_MODE: "zapier",

  // ── Lead source tag ───────────────────────────────────────────────────────
  // Automatically appended to every submission so you know where it came from.
  LEAD_SOURCE: "Website Contact Form",

};
