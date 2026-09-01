# FestiveGuest E2E Test Suite

Playwright end-to-end tests for [festiveguest.com](https://www.festiveguest.com), covering the flows that
don't require a real account (navigation, forms, static pages, the registration disclaimer gate) plus a
template for the flows that do (login, search, booking) once you supply a dedicated test account.

## What's covered

| File | Covers |
|---|---|
| `homepage-and-nav.spec.ts` | Homepage content, console errors on load, header/footer links, language toggle |
| `login.spec.ts` | Login form rendering & validation, invalid-login error path, the **broken "Forgot Password?" button** |
| `routing-regressions.spec.ts` | The **missing 404/catch-all route** (unknown URLs and `/forgot-password` render blank) |
| `help-and-static-pages.spec.ts` | Help page, FAQ accordion, feedback form validation, WhatsApp support link, Terms/Privacy/Safety pages |
| `registration-disclaimer.spec.ts` | The mandatory disclaimer + consent checkbox gate before guest/host signup |
| `authenticated-flows.spec.ts` | Login-success, search/browse, and booking flows — **skipped by default**, see below |

## Known bugs this suite documents

Found during manual exploration on 2026-09-01, and encoded as regression tests so they show up red until fixed:

1. **`Forgot Password?` on `/login` does nothing.** No navigation, no modal — clicking it is a no-op.
   See `login.spec.ts` → `BUG: "Forgot Password?" control does not respond to clicks`.
2. **No 404 / catch-all route.** Any URL the router doesn't recognize (including `/forgot-password` itself,
   which has no route at all) renders the header only, with a completely blank content area and no
   user-facing message. Confirmed via the console warning `No routes matched location "..."`.
   See `routing-regressions.spec.ts`.

Once these are fixed, update the corresponding test to assert the *correct* behavior instead (the tests
say what to change inline).

## Setup

Requires Node.js 18+.

```bash
npm install
```

This project expects a Chromium binary to already be available (see `playwright.config.ts` — it points at
`PW_CHROMIUM_PATH`, defaulting to `/opt/pw-browsers/chromium`). On a normal machine, install Playwright's
browsers instead and drop that `launchOptions.executablePath` override:

```bash
npx playwright install chromium
```

## Running

```bash
npm test                # headless, all browsers/projects
npm run test:headed     # see the browser while it runs
npm run test:ui         # interactive Playwright UI mode
npm run report          # open the HTML report from the last run
```

Run a single file or test:

```bash
npx playwright test tests/login.spec.ts
npx playwright test -g "Forgot Password"
```

### Pointing at a different environment

```bash
BASE_URL=https://staging.festiveguest.com npm test
```

### Running the authenticated flows

`authenticated-flows.spec.ts` is skipped unless you provide a **dedicated test account** (never a real
user's credentials):

```bash
FG_TEST_EMAIL=qa+e2e@yourcompany.com FG_TEST_PASSWORD='...' npm test -- tests/authenticated-flows.spec.ts
```

Create that test account by hand once (accepting the disclaimer yourself through the UI), then store the
credentials as CI secrets. The search/browse and booking tests in that file are left as `test.fixme()`
templates — fill in real selectors once you can see the authenticated UI.

Full **registration completion** (actually finishing guest/host signup) is intentionally left disabled
everywhere except a non-production `BASE_URL`, since running it against the live site would create a real
account on every run.

## What this suite deliberately does NOT do

- Create real accounts or complete signup against the live production site.
- Log in with real user credentials.
- Submit the feedback form with real content (only empty-submit validation is tested).
- Click "Continue with Google" (would kick off a real OAuth consent flow).
- Send an actual WhatsApp message (the support-button test opens the chat and closes it without typing).

## CI

A sample GitHub Actions workflow is included at `.github/workflows/e2e.yml` — it runs the suite on a
schedule and on demand, uploading the HTML report as an artifact on failure.
