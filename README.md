# Customer Inquiry Lead System

A lightweight, production-ready customer inquiry form that:

- Captures leads from a public-facing website
- Stores them instantly in **Airtable**
- Notifies the sales team via **email / Slack** through **Zapier**
- Schedules automated follow-up tasks

Hosted for free on **GitHub Pages** (no server required).

---

## Live Demo

Once deployed, your form will be live at:
```
https://<your-github-username>.github.io/customer-inquiry-lead-system/
```

---

## Architecture Overview

```
                          ┌──────────────┐
  Visitor fills form  ──► │  index.html  │
                          └──────┬───────┘
                                 │ fetch() POST (JSON)
                    ┌────────────▼────────────┐
                    │    Zapier Catch Hook     │
                    └────────────┬────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                   ▼
       ┌────────────┐   ┌──────────────┐   ┌──────────────────┐
       │  Airtable  │   │  Email Alert │   │  Slack Notify    │
       │  (Leads DB)│   │  (Sales team)│   │  (#new-leads)    │
       └────────────┘   └──────────────┘   └──────────────────┘
              │
              ▼
   ┌──────────────────────┐
   │  Zapier Follow-up    │
   │  Delay → Email (24h) │
   └──────────────────────┘
```

**No backend server.** The form posts directly to a Zapier webhook. Zapier handles all routing, storage, and notifications.

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/<your-username>/customer-inquiry-lead-system.git
cd customer-inquiry-lead-system
```

### 2. Set up Airtable + Zapier

Follow the detailed guide in [`SETUP.md`](./SETUP.md).

### 3. Configure the form

Open `assets/js/config.js` and fill in your Zapier webhook URL:

```js
const CONFIG = {
  ZAPIER_WEBHOOK_URL: "https://hooks.zapier.com/hooks/catch/YOUR_HOOK_ID/YOUR_HOOK_KEY/",
  SUBMISSION_MODE: "zapier",  // "zapier" | "airtable" | "both"
  ...
};
```

### 4. Customise the form

- Edit `index.html` to change your brand name, logo, copy, and form fields.
- Edit `assets/css/style.css` to match your brand colours (change `--brand-primary`).

### 5. Deploy to GitHub Pages

Push to `main` — GitHub Actions deploys automatically.

```bash
git add .
git commit -m "feat: initial inquiry form setup"
git push origin main
```

Then go to your repo **Settings → Pages → Source → Deploy from branch → main / root**.

---

## Project Structure

```
customer-inquiry-lead-system/
├── index.html                  # Main page with the inquiry form
├── assets/
│   ├── css/
│   │   └── style.css           # All styles (responsive, dark-ready)
│   └── js/
│       ├── config.js           # ← Edit this: webhook URLs & API keys
│       └── form.js             # Form validation + submission logic
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Actions: auto-deploy to Pages
├── SETUP.md                    # Step-by-step Airtable + Zapier guide
└── README.md                   # This file
```

---

## Form Fields

| Field | Type | Required |
|---|---|---|
| First Name | Text | ✅ |
| Last Name | Text | ✅ |
| Email Address | Email | ✅ |
| Phone Number | Tel | ❌ |
| Company | Text | ❌ |
| Type of Inquiry | Select | ✅ |
| Estimated Budget | Select | ❌ |
| Message | Textarea | ✅ |
| Consent checkbox | Checkbox | ✅ |

---

## Submission Modes

Set `SUBMISSION_MODE` in `config.js`:

| Mode | Behaviour |
|---|---|
| `"zapier"` | POST to Zapier webhook. Zapier routes to Airtable, email, Slack. *(Recommended)* |
| `"airtable"` | POST directly to Airtable REST API. No Zapier needed. |
| `"both"` | POST to both simultaneously. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES2020) |
| Hosting | GitHub Pages (free) |
| Lead storage | Airtable |
| Automation | Zapier |
| Notifications | Zapier → Gmail / Slack |
| Follow-ups | Zapier delay + email action |

No npm, no build tools, no frameworks. Just open `index.html` and it works.

---

## Customisation Tips

**Change brand colour:** In `style.css`, update `--brand-primary` and `--brand-dark`.

**Add/remove form fields:** Add the HTML in `index.html`, add a validator rule in `form.js`, and add the field mapping in `submitToAirtable()`.

**Change inquiry types:** Edit the `<select id="inquiryType">` options in `index.html`.

**Add Google Analytics:** Paste your GA4 snippet just before `</head>` in `index.html`.

---

## Security Notes

- **Never commit real API tokens** to a public repo. Use GitHub Secrets + a build step if you need to inject them.
- The Zapier webhook URL is semi-public — it accepts POST requests from anyone. Add Zapier's built-in filter step to validate the `source` field if needed.
- For GDPR compliance, ensure your Airtable base is hosted in your required region and update the consent copy in `index.html` to match your privacy policy.

---

## Contributing

1. Fork the repo
2. Create a branch: `git checkout -b feature/my-change`
3. Commit your changes
4. Open a pull request

---

## License

MIT — free to use, modify, and distribute.
