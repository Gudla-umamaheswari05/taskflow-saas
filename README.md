# TaskFlow

A project & task management SaaS with Free / Pro / Team subscription tiers, built with React, Node/Express, PostgreSQL (Prisma), and Stripe.

## What you need installed first

- **Node.js** 18+ — check with `node -v`
- **PostgreSQL** — running locally, or a free instance from [Neon](https://neon.tech) / [Supabase](https://supabase.com) (easier if you don't want to install Postgres yourself)
- **Stripe account** (free) — for payments: https://dashboard.stripe.com/register
- **Stripe CLI** — for testing webhooks locally: https://stripe.com/docs/stripe-cli

## 1. Backend setup

```bash
cd server
npm install
cp .env.example .env
```

Open `.env` and fill in:
- `DATABASE_URL` — your Postgres connection string
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — any long random strings
- `STRIPE_SECRET_KEY` — from Stripe Dashboard → Developers → API keys (use the **test mode** key, starts with `sk_test_`)
- `STRIPE_PRICE_*` — create 4 Products/Prices in Stripe Dashboard → Product catalog (Pro monthly, Pro annual, Team monthly, Team annual) and paste their price IDs here
- SMTP settings are optional for local dev — if left blank, emails are just printed to the server console instead of actually sending

Then create the database tables:

```bash
npx prisma migrate dev --name init
```

Start the API:

```bash
npm run dev
```

It runs on **http://localhost:4000**.

## 2. Stripe webhook (for local testing)

In a separate terminal:

```bash
stripe login
stripe listen --forward-to localhost:4000/api/webhooks
```

This prints a `whsec_...` value — copy it into `STRIPE_WEBHOOK_SECRET` in your `.env` and restart the server.

## 3. Frontend setup

```bash
cd client
npm install
cp .env.example .env
npm run dev
```

It runs on **http://localhost:5173**.

## 4. Try it out

1. Open http://localhost:5173, click "Get started," sign up
2. Create a project, add a task, move it across the board
3. Go to **Billing**, pick a plan — you'll be sent to Stripe Checkout (use test card `4242 4242 4242 4242`, any future expiry/CVC)
4. After checkout, the webhook updates your plan in the database — refresh the Billing page to confirm
5. Try creating a 2nd project on the Free plan — you should see the "Upgrade to create more" message

## Project structure

```
taskflow/
├── server/          Express API
│   ├── prisma/schema.prisma   Database schema
│   └── src/
│       ├── routes/            auth, projects, tasks, billing, webhooks
│       ├── middleware/        JWT auth, plan-limit enforcement
│       └── utils/             Prisma client, Stripe client, email
└── client/           React app (Vite + Tailwind)
    └── src/
        ├── pages/             Landing, auth pages, Dashboard, ProjectBoard, Billing, Account
        ├── components/        Navbar, ProtectedRoute
        └── context/           AuthContext (login/signup/logout state)
```

## Deployment checklist

- [ ] Set all `.env` values as real environment variables on your host (Render/Railway/Fly.io for the API, Vercel/Netlify for the client)
- [ ] Use a **production** Postgres database (not your local one) and run `npx prisma migrate deploy`
- [ ] Switch Stripe keys from test (`sk_test_`) to live (`sk_live_`) mode
- [ ] In Stripe Dashboard → Webhooks, add an endpoint pointing to `https://yourdomain.com/api/webhooks` and copy its signing secret into `STRIPE_WEBHOOK_SECRET`
- [ ] Update `CLIENT_URL` (server) and `VITE_API_URL` (client) to your real production URLs
- [ ] Set up a real SMTP provider (Resend, Postmark, SES) for verification/reset emails
- [ ] Turn on HTTPS everywhere — required for Stripe and for cookies/tokens to be safe

## What's intentionally left as an extension point

This is an MVP scaffold, not a finished product. Things to add next, in rough priority order:
1. Google OAuth login (the field for it exists in the plan but isn't wired up)
2. Email-triggered notifications (task assigned to you, invite reminders)
3. File attachments on tasks
4. Soft-delete / account deletion flow
5. Tests (the prompt asked for basic auth + webhook tests — add these before going to production)
