# Setup Guide — Airtable + Zapier Integration

This guide walks you through connecting the inquiry form to Airtable (lead storage) and Zapier (notifications + follow-ups). Should take about **20 minutes**.

---

## Table of Contents

1. [Create the Airtable Base](#step-1-create-the-airtable-base)
2. [Set Up Zapier Webhook](#step-2-set-up-the-zapier-webhook)
3. [Zap 1 — Save lead to Airtable](#step-3-zap-1--save-lead-to-airtable)
4. [Zap 2 — Notify the sales team](#step-4-zap-2--notify-the-sales-team)
5. [Zap 3 — Schedule 24h follow-up email](#step-5-zap-3--schedule-24h-follow-up-email)
6. [Configure config.js](#step-6-configure-configjs)
7. [Test the full flow](#step-7-test-the-full-flow)
8. [Optional: Direct Airtable API](#optional-direct-airtable-api-mode)

---

## Step 1 — Create the Airtable Base

1. Go to [airtable.com](https://airtable.com) and sign in (free tier works).
2. Click **+ Add a base → Start from scratch**.
3. Name it: `CRM — Customer Leads`.
4. Rename the default table to **`Leads`**.
5. Set up the following fields (column names must match exactly):

| Field Name | Field Type | Notes |
|---|---|---|
| `Full Name` | Single line text | Primary field |
| `Email` | Email | |
| `Phone` | Phone number | |
| `Company` | Single line text | |
| `Inquiry Type` | Single select | Options: General Question, Request a Demo, Partnership Opportunity, Pricing & Plans, Support, Other |
| `Budget` | Single select | Options: Under $1,000, $1,000–$5,000, $5,000–$20,000, $20,000+ |
| `Message` | Long text | |
| `Source` | Single line text | Auto-filled: "Website Contact Form" |
| `Submitted At` | Date | Include time |
| `Page URL` | URL | |
| `Status` | Single select | Options: **New**, Contacted, Qualified, Closed Won, Closed Lost |
| `Assigned To` | Collaborator | Assign to a team member |
| `Follow-up Date` | Date | For scheduling |
| `Notes` | Long text | Internal sales notes |

6. Click the **Share** icon on the base → Copy the **Base ID** (starts with `app...`). Save it.

---

## Step 2 — Set Up the Zapier Webhook

1. Go to [zapier.com](https://zapier.com) and sign in (free tier allows 5 Zaps).
2. Click **Create Zap**.
3. For the **Trigger**, search for and choose **Webhooks by Zapier**.
4. Choose trigger event: **Catch Hook**.
5. Click **Continue** — Zapier generates a unique URL like:
   ```
   https://hooks.zapier.com/hooks/catch/1234567/abcdefg/
   ```
6. **Copy this URL** — you will paste it into `config.js`.
7. Keep this Zap open (you will add actions next).

---

## Step 3 — Zap 1 — Save Lead to Airtable

Still in your Zap from Step 2:

1. Click **+** to add an **Action**.
2. Search for **Airtable** → choose action: **Create Record**.
3. Connect your Airtable account when prompted.
4. Select your base: `CRM — Customer Leads`.
5. Select table: `Leads`.
6. Map the Zapier fields to Airtable columns:

| Airtable Column | Zapier Field |
|---|---|
| Full Name | `fullName` |
| Email | `email` |
| Phone | `phone` |
| Company | `company` |
| Inquiry Type | `inquiryType` |
| Budget | `budget` |
| Message | `message` |
| Source | `source` |
| Submitted At | `submittedAt` |
| Page URL | `pageUrl` |
| Status | (hardcode) `New` |

7. Click **Test action** — you should see a new row appear in Airtable.
8. Click **Publish**.

> 💡 **Tip:** Give this Zap a name like `Inquiry Form → Airtable`.

---

## Step 4 — Zap 2 — Notify the Sales Team

Create a **new Zap** with the same webhook trigger (use the same URL):

### Option A — Email notification

1. Trigger: **Webhooks by Zapier → Catch Hook** (same URL).
2. Action: **Gmail** (or any email provider) → **Send Email**.
3. Configure:
   - **To:** `sales-team@yourcompany.com`
   - **Subject:** `🔔 New Inquiry from {{fullName}} — {{inquiryType}}`
   - **Body:**
     ```
     A new customer inquiry has been submitted.

     Name:         {{fullName}}
     Email:        {{email}}
     Phone:        {{phone}}
     Company:      {{company}}
     Inquiry Type: {{inquiryType}}
     Budget:       {{budget}}
     Source:       {{source}}
     Submitted At: {{submittedAt}}

     Message:
     {{message}}

     ---
     View in Airtable: https://airtable.com/YOUR_BASE_URL
     ```

### Option B — Slack notification

1. Trigger: same webhook.
2. Action: **Slack → Send Channel Message**.
3. Configure:
   - **Channel:** `#new-leads`
   - **Message:**
     ```
     :bell: *New inquiry from {{fullName}}*
     *Type:* {{inquiryType}}  |  *Budget:* {{budget}}
     *Email:* {{email}}  |  *Company:* {{company}}
     *Message:* {{message}}
     ```

> You can run **both** by adding two actions to the same Zap.

---

## Step 5 — Zap 3 — Schedule 24h Follow-up Email

Create a **third Zap** (or add more steps to Zap 2):

1. Trigger: same webhook.
2. Action 1: **Delay by Zapier → Delay For**.
   - Delay: **1 day**.
3. Action 2: **Gmail → Send Email**.
   - **To:** `{{email}}` (the lead's email)
   - **From name:** Your sales rep name
   - **Subject:** `Following up on your inquiry, {{firstName}}`
   - **Body:**
     ```
     Hi {{firstName}},

     Thanks for reaching out! I wanted to follow up on your inquiry
     about "{{inquiryType}}" that you submitted yesterday.

     I'd love to learn more about your needs. Are you available for
     a quick 15-minute call this week?

     You can book a time here: [Your Calendly link]

     Looking forward to connecting!

     Best,
     [Your Name]
     [Your Title]
     ```

> 💡 **Tip:** Set up a Zapier Filter step before the delay so follow-ups only go to leads with `inquiryType = "Request a Demo"` or high-value budget ranges.

---

## Step 6 — Configure config.js

Open `assets/js/config.js` and update:

```js
const CONFIG = {
  // Paste your Zapier Catch Hook URL here
  ZAPIER_WEBHOOK_URL: "https://hooks.zapier.com/hooks/catch/YOUR_HOOK_ID/YOUR_HOOK_KEY/",

  SUBMISSION_MODE: "zapier",  // Use "zapier" for the setup above

  LEAD_SOURCE: "Website Contact Form",

  // Leave blank unless using Direct Airtable mode
  AIRTABLE_BASE_ID:    "",
  AIRTABLE_TABLE_NAME: "Leads",
  AIRTABLE_API_TOKEN:  "",
};
```

---

## Step 7 — Test the Full Flow

1. Open `index.html` in your browser (or visit your GitHub Pages URL).
2. Fill out the form with test data and click **Send Message**.
3. Check:
   - ✅ The success screen appears on the website.
   - ✅ A new row appears in Airtable within 1–2 minutes.
   - ✅ Your sales team email/Slack receives the notification.
   - ✅ After 24 hours (or use Zapier's test mode), the follow-up email lands.

**Check the browser console** (F12 → Console) if something is wrong. Errors are logged with the `[Inquiry Form]` prefix.

---

## Optional: Direct Airtable API Mode

If you want the form to write **directly to Airtable** (no Zapier needed for storage):

1. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens).
2. Create a **Personal Access Token** with scope: `data.records:write`.
3. Add your base to the token's access list.
4. Copy the token (starts with `pat...`).
5. In `config.js`:
   ```js
   AIRTABLE_BASE_ID:   "appXXXXXXXXXXXXXX",   // From Step 1
   AIRTABLE_TABLE_NAME: "Leads",
   AIRTABLE_API_TOKEN:  "patXXXXXXXXXXXXXX",   // From this step
   SUBMISSION_MODE: "airtable",
   ```

> ⚠️ **Security warning:** Placing an Airtable token in client-side JavaScript exposes it to anyone who views your page source. For a public site, use Zapier (server-side) instead, or proxy through a serverless function (Netlify Functions, Cloudflare Workers).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Form shows error after submit | Check browser console for `[Inquiry Form]` error. Verify the Zapier URL in `config.js` is correct. |
| Zapier not receiving data | Make sure the Zap is **published** (turned ON), not just saved. |
| Airtable row not appearing | Check Zapier task history for errors. Verify field name spelling matches exactly. |
| Follow-up email not sent | Zapier free plan delays can take up to 15 min. Check Zapier task history. |
| CORS error in console | This is a Zapier limitation in some browsers. Use a proxy or serverless function for production. |

---

## Production Checklist

- [ ] Replace `YourBrand` in `index.html` with your real company name
- [ ] Update brand colours in `style.css` (`--brand-primary`)
- [ ] Update inquiry type options to match your business
- [ ] Add your real privacy policy link to the consent checkbox
- [ ] Configure custom domain on GitHub Pages (optional)
- [ ] Set up Zapier email from a proper business email address
- [ ] Add a Zapier filter to avoid sending follow-ups to test submissions
- [ ] Test on mobile before going live
