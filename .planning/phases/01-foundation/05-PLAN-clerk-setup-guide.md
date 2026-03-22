---
wave: 1
depends_on: []
files_modified: []
autonomous: false
---

# Plan 05: Clerk Dashboard Setup Guide

**Goal:** Provide a step-by-step setup guide for the developer to configure Clerk after Phase 1 code is deployed. This plan is informational — the executor creates a README file; the developer (user) follows the steps.

**REQ-IDs:** AUTH-01, AUTH-02

---

## Tasks

### Task 1 — Create the Clerk Dashboard Setup Guide README

<read_first>
- `/Users/nhannguyenthanh/Developer/lpoint/.planning/phases/01-foundation/01-RESEARCH.md` — Q5 contains the complete setup steps with exact Clerk Dashboard navigation paths
</read_first>

<action>
Create the file `/Users/nhannguyenthanh/Developer/lpoint/.planning/phases/01-foundation/01-SETUP-GUIDE.md` with the following exact content:

```markdown
# Phase 1 Setup Guide — Clerk Configuration

**Before starting:** Run Phase 1 code locally with `npm run dev` and ensure the app loads at `http://localhost:3000`.

---

## Step 1: Create a Clerk Application

1. Go to [clerk.com](https://clerk.com) and sign in.
2. Click **New Application**.
3. In the dialog:
   - **Name:** `LPoint`
   - **Sign-in methods:** Select **Username** only. Uncheck all others:
     - ☐ Email address
     - ☐ Phone number
     - ☐ Google
     - ☐ GitHub
     - ☐ Other SSO providers
4. Click **Create Application**.

> **Why username only?** The app uses Clerk for staff authentication only. New accounts are created by ADMIN in Clerk Dashboard, not by self-signup. Username/password is the only auth method needed.

---

## Step 2: Copy API Keys

1. In your Clerk app, go to **API Keys** (sidebar).
2. Copy the **Publishable key** → add to `.env.local` as:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   ```
3. Copy the **Secret key** → add to `.env.local` as:
   ```
   CLERK_SECRET_KEY=sk_test_...
   ```

> **Warning:** `CLERK_SECRET_KEY` is server-only. Never expose it in the browser or commit it to version control.

---

## Step 3: Configure User & Authentication Settings

1. Go to **User & Authentication** → **Login method**.
2. Confirm that only **Username** is enabled.
3. Go to **SSO Connections** (under User & Authentication).
4. Disable any active SSO connections if present (they should be off by default).

---

## Step 4: Create ADMIN and STAFF Users

You must create at least one ADMIN and one STAFF user manually in Clerk Dashboard.

### Create ADMIN user:

1. Go to **Users** (sidebar) → **Create user**.
2. Fill in:
   - **Username:** e.g., `admin`
   - **First name:** e.g., `Admin`
   - **Last name:** e.g., `User`
3. Click **Create user and send invite** (or just Create if email is optional).
4. Set the initial password (at least 8 characters).
5. After the user is created, click the user row → **Metadata** → **Public metadata**.
6. Add the JSON:
   ```json
   { "role": "ADMIN" }
   ```
7. Click **Save**.

### Create STAFF user:

Repeat the same steps, but set `public_metadata` to:
```json
{ "role": "STAFF" }
```

> **Important:** The `public_metadata.role` field is the single source of truth for authorization in LPoint. All role checks in `lib/auth.ts` read this value.

---

## Step 5: Configure the Webhook Endpoint

Clerk sends webhook events to your app when users are created, updated, or deleted. This keeps InstantDB in sync with Clerk.

1. Go to **Webhooks** (sidebar) → **Add Endpoint**.
2. Fill in:
   - **Endpoint URL:** `https://your-domain.com/api/auth/webhook`
     - For local testing: use a tunneling tool like [ngrok](https://ngrok.com) or [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/) to expose `http://localhost:3000`.
   - **Message filtering:** Select all three events:
     - ☑ `user.created`
     - ☑ `user.updated`
     - ☑ `user.deleted`
3. Click **Create**.
4. On the next screen, copy the **Signing Secret** → add to `.env.local` as:
   ```
   CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
   ```

> **Local testing tip:** After setting up ngrok, use the ngrok URL (e.g., `https://abc123.ngrok.io`) as the webhook URL. Update it when you have a production domain.

---

## Step 6: Update `.env.local`

Your `.env.local` should now contain:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...
NEXT_PUBLIC_INSTANTDB_APP_ID=your-app-id-here
INSTANTDB_ADMIN_TOKEN=your-admin-token-here
CRON_SECRET=openssl\ rand\ -hex\ 32\ # generate with: openssl rand -hex 32
```

Generate a `CRON_SECRET` if you don't have one:
```bash
openssl rand -hex 32
```

---

## Step 7: Restart the Dev Server

```bash
# Kill the current dev server (Ctrl+C), then:
npm run dev
```

Visit `http://localhost:3000/sign-in`. You should be redirected to Clerk's hosted sign-in page. Sign in with the ADMIN or STAFF username and password you created in Step 4.

---

## Troubleshooting

### "Sign-in not working" or infinite redirect loop

- Check that `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are correct in `.env.local`.
- Check that the Clerk application was created with **Username** auth method (not email).
- Run `npx Clerk dashboard` to open the Clerk Dashboard for your app.

### Webhook not firing

- Use [ngrok](https://ngrok.com) to expose your local server and use the ngrok URL as the webhook endpoint.
- In Clerk Dashboard → Webhooks → your endpoint → **Messages** tab, check the delivery log.
- Verify `CLERK_WEBHOOK_SIGNING_SECRET` is correct (it starts with `whsec_`).

### "Cannot read properties of undefined (reading 'public_metadata')"

- This is a bug — `sessionClaims.public_metadata` is undefined. Make sure `public_metadata` is set on the Clerk user in Dashboard (Step 4).
- If using a custom JWT template in Clerk, ensure `public_metadata` is included in the template's claims. For default Clerk sessions, this is automatic.

---

## What's Next?

After completing this guide, move to **Phase 2: RBAC Enforcement**.

Run:
```bash
/gsd:execute-phase phase=2
```
```

This file is the developer-facing setup guide. The executor creates it so the user knows what to do after Phase 1 code is deployed.
</action>

<acceptance_criteria>
- File `/Users/nhannguyenthanh/Developer/lpoint/.planning/phases/01-foundation/01-SETUP-GUIDE.md` exists
- File contains "Step 1: Create a Clerk Application" with Username-only sign-in method
- File contains "Step 4: Create ADMIN and STAFF Users" with `public_metadata` JSON instructions
- File contains "Step 5: Configure the Webhook Endpoint" with all three events (`user.created`, `user.updated`, `user.deleted`)
- File contains the `CLERK_WEBHOOK_SIGNING_SECRET` step
- File contains `openssl rand -hex 32` for CRON_SECRET generation
- File contains troubleshooting section for webhook and auth issues
- File contains "What's Next?" linking to Phase 2
</acceptance_criteria>

---

## Verification

```bash
# Verify all critical steps are documented
grep -c "Step 1\|Step 2\|Step 3\|Step 4\|Step 5\|Step 6\|Step 7" \
  /Users/nhannguyenthanh/Developer/lpoint/.planning/phases/01-foundation/01-SETUP-GUIDE.md
# Must output 7

grep "public_metadata" /Users/nhannguyenthanh/Developer/lpoint/.planning/phases/01-foundation/01-SETUP-GUIDE.md | wc -l
# Must be >= 4

grep "CLERK_WEBHOOK_SIGNING_SECRET" /Users/nhannguyenthanh/Developer/lpoint/.planning/phases/01-foundation/01-SETUP-GUIDE.md
# Must be present
```

---

## must_haves

- [ ] Setup guide created at `01-SETUP-GUIDE.md` in the phase directory
- [ ] All 7 Clerk Dashboard setup steps documented with exact navigation
- [ ] `public_metadata.role` instructions for ADMIN and STAFF users
- [ ] Webhook configuration with all 3 events
- [ ] ngrok/local-tunnel recommendation for webhook testing
- [ ] Troubleshooting section covering common issues
- [ ] Next step pointing to Phase 2
