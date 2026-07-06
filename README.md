# Healthia Debtor Management Training Site — Setup Guide

## What this is
A self-contained static website: one hub (`index.html`) with tabs for Overview,
SOP, FAQ & Cheat Sheets, and Training Modules. No backend required to host it —
GitHub Pages (or any static host) will serve it as-is.

## File structure
```
site/
  index.html              ← hub page (start here)
  faq.html
  cheatsheet.html
  sop/AR-Debt-Management-SOP.pdf
  modules/
    module1.html           All Admin Team          — open to all
    module2-gate.html       Trained Admin & PM GATE  — code required
    module2.html            Trained Admin & PM       — only reachable via gate
    module3-gate.html       Clinic Partner/CCS/CM GATE — code required
    module3.html            Clinic Partner/CCS/CM    — only reachable via gate
```

Only two folders now: `sop` and `modules`. The chat assistant's code used to
live in a separate `assets` folder — it's now built directly into each page
that uses it, so there's one less folder to worry about uploading.

## 1. Deploy to GitHub Pages
1. Create a repo (or reuse an existing one), push the `site/` folder contents
   to the repo root (or to a `/docs` folder if you prefer).
2. Repo Settings → Pages → set source to the branch/folder you used.
3. Your hub will be live at `https://<yourusername>.github.io/<repo>/`.

**Important — this is public.** GitHub Pages on the free tier has no login
wall. Anyone with the link can view everything on the site. Don't put
anything in here you wouldn't want to end up outside the company.

## 2. Access codes
- **Module 1 (All Admin Team)** — open to everyone, no code
- **Module 2 (Trained Admin & PM)** — code: `PM2026`
- **Module 3 (Clinic Partner/CCS/CM)** — code: `CP2026`

To change a code: open the relevant `module2-gate.html` or `module3-gate.html`,
open your browser console (F12) and run `await sha256("YOURNEWCODE")`, then
paste the result into `CODE_HASH` in that file. Tell people the new code via
email/Teams — not on the site itself.

Remember: this is a deterrent, not real security — anyone reasonably
technical could bypass it by reading the page source. If this content is
genuinely sensitive, it needs to move to SharePoint/Teams with real
login-based permissions instead of GitHub Pages.

## 3. Completion tracking (Microsoft Forms)
Every module ends with a "Record Your Completion" panel that embeds a real
Microsoft Form directly on the page (First Name, Surname, Clinic, Module).
This is already wired up and working — no further setup needed to record
completions.

**To see results:** open the Form in forms.office.com → **Responses** tab →
**Open in Excel**. That gives you a live spreadsheet you can filter/pivot by
Clinic or Module, same idea as your other tracking dashboards.

**To change the form** (add a question, fix wording, etc.): edit it directly
in forms.office.com — changes appear on the site automatically since it's a
live embed, not a copy. If you ever need to point the site at a *different*
form, get its embed link (Share → Embed in the Form), and update the
`src="..."` value inside the `<iframe>` in each of `modules/module1.html`,
`module2.html`, and `module3.html` (search for "capture-panel" to find it).

**Note:** the Module field on the form is a dropdown people fill in
themselves — it isn't auto-detected from which page they're on. Worth
double-checking Responses periodically for anyone leaving it blank or
picking the wrong one.

## 4. Notes on the completion panel
- It's a genuine live Microsoft Form embed, not a custom box — so anything
  you change in the Form (wording, adding a question) shows up on the site
  immediately, no file edits needed.
- If it looks blank or shows an error to someone, it's almost always a
  Microsoft 365 permissions issue on the Form itself — check the Form's
  **Share** settings allow "Anyone with the link" or your org's equivalent,
  not just people signed in as you.

## 5. Updating content later
- **SOP**: replace `sop/AR-Debt-Management-SOP.pdf` with a new export.
- **FAQ/Cheat Sheets**: edit the `data`/`roles` arrays near the bottom of
  `faq.html` / `cheatsheet.html` — plain JS objects, no build step needed.
- **Training modules**: edit directly in the HTML, or hand back to Claude
  with the specific change needed.

## 6. Site Assistant (chatbot)
A floating chat bubble (bottom-right, every page) answers questions using
**only** the content in `assets/knowledge-base.js` — no AI, no API key,
nothing that can be stolen from view-source or run up a bill. It does
keyword matching against the SOP/FAQ/cheat sheet facts already on the site.

- If it finds a confident match, it answers directly and shows which
  question it matched, so people can sanity-check the source.
- If nothing matches well, it says so and points them to open an **ASSIST
  ticket with Operations**.

**To add or correct an answer**: the assistant's question/answer list is
built directly into each page (search any HTML file for `SITE_KB` to find
it — it's identical in every file). Edit an entry, then repeat the same
edit in the other 5 files (`index.html`, `faq.html`, `cheatsheet.html`,
`modules/module1.html`, `module2.html`, `module3.html`) so they all stay in
sync. A bit more repetitive than a shared file, but it means there's no
`assets` folder that can fail to upload.

**Why not a real AI chatbot?** A true conversational AI needs a backend to
hold the API key securely. Embedding an API key directly in a public
GitHub Pages site would let anyone view-source it and run up charges on
your account — not worth the risk for an internal tool. If you want a real
AI assistant later, that needs a small serverless backend (e.g. a
Cloudflare Worker) to proxy the request — a bigger but doable next step.

