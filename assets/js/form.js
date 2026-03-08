/**
 * form.js — Inquiry form validation, submission, and integration logic.
 *
 * Flow:
 *   1. User fills the form and clicks "Send Message".
 *   2. Client-side validation runs (no network call on error).
 *   3. Depending on CONFIG.SUBMISSION_MODE:
 *        "zapier"   → POST JSON to Zapier webhook
 *        "airtable" → POST directly to Airtable REST API
 *        "both"     → Both in parallel
 *   4. On success → show confirmation, hide form.
 *   5. On error   → show error banner, re-enable button.
 */

(function () {
  "use strict";

  /* ── DOM refs ─────────────────────────────────────────────── */
  const form        = document.getElementById("inquiry-form");
  const submitBtn   = document.getElementById("submit-btn");
  const btnText     = document.getElementById("btn-text");
  const btnLoader   = document.getElementById("btn-loader");
  const successBox  = document.getElementById("form-success");
  const errorBox    = document.getElementById("form-error");

  if (!form) return; // Guard: form not on page

  /* ── Validation rules ─────────────────────────────────────── */
  const validators = {
    firstName:   { required: true,  label: "First name" },
    lastName:    { required: true,  label: "Last name" },
    email:       { required: true,  label: "Email", pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMsg: "Please enter a valid email address." },
    phone:       { required: false, label: "Phone" },
    company:     { required: false, label: "Company" },
    inquiryType: { required: true,  label: "Inquiry type" },
    budget:      { required: false, label: "Budget" },
    message:     { required: true,  label: "Message", minLength: 10, minLengthMsg: "Please write at least 10 characters." },
    consent:     { required: true,  label: "Consent", isCheckbox: true },
  };

  function validateField(name, value, el) {
    const rule = validators[name];
    if (!rule) return null;

    if (rule.isCheckbox) {
      return el && !el.checked ? "You must agree to be contacted." : null;
    }
    if (rule.required && !value.trim()) {
      return `${rule.label} is required.`;
    }
    if (rule.pattern && value.trim() && !rule.pattern.test(value)) {
      return rule.patternMsg || `${rule.label} is invalid.`;
    }
    if (rule.minLength && value.trim().length < rule.minLength) {
      return rule.minLengthMsg || `${rule.label} is too short.`;
    }
    return null;
  }

  function showFieldError(name, msg) {
    const errEl = document.getElementById(`err-${name}`);
    const inputEl = document.getElementById(name);
    if (errEl) errEl.textContent = msg || "";
    if (inputEl) {
      if (msg) inputEl.classList.add("invalid");
      else inputEl.classList.remove("invalid");
    }
  }

  function validateAll() {
    let valid = true;
    for (const [name, rule] of Object.entries(validators)) {
      const el = document.getElementById(name);
      if (!el) continue;
      const value = rule.isCheckbox ? "" : el.value;
      const msg = validateField(name, value, el);
      if (msg) { showFieldError(name, msg); valid = false; }
      else showFieldError(name, "");
    }
    return valid;
  }

  /* Live validation — clear error as user fixes the field */
  form.querySelectorAll("input, select, textarea").forEach(el => {
    el.addEventListener("input", () => {
      const rule = validators[el.name];
      if (!rule) return;
      const val = rule.isCheckbox ? "" : el.value;
      const msg = validateField(el.name, val, el);
      showFieldError(el.name, msg || "");
    });
  });

  /* ── Build payload ────────────────────────────────────────── */
  function buildPayload() {
    const data = new FormData(form);
    return {
      // Identity
      firstName:   data.get("firstName")?.trim() || "",
      lastName:    data.get("lastName")?.trim() || "",
      fullName:    `${data.get("firstName")?.trim()} ${data.get("lastName")?.trim()}`,
      email:       data.get("email")?.trim() || "",
      phone:       data.get("phone")?.trim() || "",
      company:     data.get("company")?.trim() || "",
      // Inquiry details
      inquiryType: data.get("inquiryType") || "",
      budget:      data.get("budget") || "",
      message:     data.get("message")?.trim() || "",
      // Meta
      source:      CONFIG.LEAD_SOURCE,
      submittedAt: new Date().toISOString(),
      pageUrl:     window.location.href,
    };
  }

  /* ── Zapier submission ────────────────────────────────────── */
  async function submitToZapier(payload) {
    // Zapier webhooks don't return CORS headers, so browsers block the response.
    // Using mode: 'no-cors' sends the data successfully — Zapier receives it —
    // but the response is opaque (status 0). We treat any completed fetch as success.
    // NOTE: no-cors only allows "simple" headers.
    // Content-Type: application/json is not simple — it triggers a preflight
    // that Zapier doesn't support, causing "Failed to fetch".
    // Omitting Content-Type lets the browser send it as a simple POST.
    await fetch(CONFIG.ZAPIER_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      body: JSON.stringify(payload),
    });
    // If fetch() didn't throw, the request reached Zapier.
  }

  /* ── Airtable direct submission ───────────────────────────── */
  async function submitToAirtable(payload) {
    if (!CONFIG.AIRTABLE_BASE_ID || !CONFIG.AIRTABLE_API_TOKEN) {
      throw new Error("Airtable is not configured. Check config.js.");
    }

    const url = `https://api.airtable.com/v0/${CONFIG.AIRTABLE_BASE_ID}/${encodeURIComponent(CONFIG.AIRTABLE_TABLE_NAME)}`;

    // Map form fields → Airtable field names.
    // Adjust these to match your actual Airtable column names.
    const fields = {
      "Full Name":     payload.fullName,
      "Email":         payload.email,
      "Phone":         payload.phone,
      "Company":       payload.company,
      "Inquiry Type":  payload.inquiryType,
      "Budget":        payload.budget,
      "Message":       payload.message,
      "Source":        payload.source,
      "Submitted At":  payload.submittedAt,
      "Page URL":      payload.pageUrl,
      "Status":        "New",
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${CONFIG.AIRTABLE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ fields }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `Airtable responded with status ${res.status}`);
    }
    return res;
  }

  /* ── UI helpers ───────────────────────────────────────────── */
  function setLoading(loading) {
    submitBtn.disabled = loading;
    btnText.textContent = loading ? "Sending…" : "Send Message";
    btnLoader.classList.toggle("hidden", !loading);
  }

  function showSuccess() {
    form.classList.add("hidden");
    successBox.classList.remove("hidden");
    errorBox.classList.add("hidden");
    window.scrollTo({ top: document.getElementById("form-section").offsetTop - 80, behavior: "smooth" });
  }

  function showError(msg) {
    errorBox.textContent = `⚠️ ${msg || "Something went wrong. Please try again or email us directly."}`;
    errorBox.classList.remove("hidden");
  }

  /* ── Form submit ──────────────────────────────────────────── */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.classList.add("hidden");

    if (!validateAll()) {
      // Scroll to first error
      const firstInvalid = form.querySelector(".invalid");
      if (firstInvalid) firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    setLoading(true);

    const payload = buildPayload();
    console.log("[Inquiry Form] Submitting payload:", payload);

    try {
      const mode = CONFIG.SUBMISSION_MODE;

      if (mode === "zapier") {
        await submitToZapier(payload);
      } else if (mode === "airtable") {
        await submitToAirtable(payload);
      } else if (mode === "both") {
        await Promise.all([submitToZapier(payload), submitToAirtable(payload)]);
      } else {
        throw new Error(`Unknown SUBMISSION_MODE: "${mode}"`);
      }

      console.log("[Inquiry Form] Submission successful.");
      showSuccess();

    } catch (err) {
      console.error("[Inquiry Form] Submission error:", err);
      showError(err.message);
    } finally {
      setLoading(false);
    }
  });

  /* ── Reset form (after success) ───────────────────────────── */
  window.resetForm = function () {
    form.reset();
    form.classList.remove("hidden");
    successBox.classList.add("hidden");
    errorBox.classList.add("hidden");
    // Clear all validation state
    form.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
    form.querySelectorAll(".field-error").forEach(el => el.textContent = "");
  };

})();
