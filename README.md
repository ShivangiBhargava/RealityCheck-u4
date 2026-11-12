# RealityCheck

RealityCheck is a neighborhood task and reward app. People can post local tasks with criteria and a reward; contributors submit a photo and note as evidence; task owners review submissions and can send an approved reward through PayPal Sandbox.

## Features

- Account registration and sign-in.
- Create, browse, and manage neighborhood tasks.
- Submit a photo and a short note as task evidence.
- Get an AI-generated, structured evidence review to help assess the submission.
- Let the task owner make the final approval decision.
- Connect PayPal and submit rewards using the PayPal Payouts **Sandbox** API.

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, PostgreSQL, Drizzle ORM, Better Auth, Vercel Blob, Vercel Connect, and the Vercel AI SDK.

## Requirements

- Node.js compatible with Next.js 16.
- pnpm 12.3.4 (the version declared in `package.json`).
- PostgreSQL.
- Vercel Blob and Vercel Connect configuration for evidence uploads and PayPal authorization/payouts.
- An AI Gateway credential/configuration that can access the model used by the app (`anthropic/claude-sonnet-5.5` by default).

## Local setup

1. Clone the repository and install dependencies:

   ```bash
   git clone https://github.com/ShivangiBhargava/RealityCheck-u4.git
   cd RealityCheck-u4
   corepack enable
   corepack prepare pnpm@12.3.4 --activate
   pnpm install
   ```

2. Create `.env.local` in the project root and configure the required services:

   ```dotenv
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
   BETTER_AUTH_URL=http://localhost:3000
   BLOB_READ_WRITE_TOKEN=your-vercel-blob-read-write-token
   AI_GATEWAY_API_KEY=your-ai-gateway-key
   # Optional: choose a model ID available to your AI Gateway account.
   AI_REVIEW_MODEL=anthropic/claude-sonnet-5.5
   ```

   `DATABASE_URL` must point to a PostgreSQL database whose tables match the Drizzle schema in `lib/db/schema.ts`. This repository currently does not include database migration or seed scripts, so provision the schema before running the app. Keep `.env.local` and all credentials private; do not commit them.

3. Configure PayPal in Vercel Connect. The app expects the connector UID `paypal/realitycheck-paypal-payouts` with the PayPal payouts scope (`https://uri.paypal.com/payments/payouts`). For local development, make sure your Vercel Connect setup supports the local callback URL. The payout route targets PayPal Sandbox; use sandbox accounts and credentials only. PayPal is optional for browsing/testing other flows but required to connect an account and send payouts.

4. Start the development server:

   ```bash
   pnpm dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Create an account to use the authenticated app.

5. Check the production build when needed:

   ```bash
   pnpm build
   pnpm start
   ```

On Vercel, configure the same database, Blob, AI Gateway, auth URL, and Vercel Connect integration in the project's environment/integration settings. Vercel deployment URLs are detected by the app for auth and PayPal callbacks. After changing environment variables, redeploy so the server uses the new configuration.

## How AI is used

When a contributor submits an evidence photo and note, the server sends the image, task title, task criteria, and note to the AI model through the Vercel AI SDK. The model returns a schema-validated assessment: an outcome (`strong_match`, `partial_match`, or `needs_attention`), confidence, a short summary, and up to five visible checks. The review is stored with the submission to help the task owner assess it.

AI is advisory, not an automated judge: a task owner reviews and decides whether to approve the evidence. The model may be wrong, so its assessment should be checked against the actual task criteria and submitted evidence. If the AI service is unavailable or the configured model is not enabled for your AI Gateway account, the app stores a fallback review and logs the model identifier and error type on the server. Confirm the AI Gateway key and model access in deployment settings.

## How PayPal is used

Task owners authorize their PayPal account through Vercel Connect. After the owner approves a submission, they can request a payout to the contributor's submitted PayPal email. The server obtains the owner's scoped PayPal token, then creates a payout through PayPal's Payouts API. The current implementation points to `api-m.sandbox.paypal.com`, so payouts are simulated in PayPal Sandbox and are not real-money transfers. The reward amount comes from the task, and the payout is restricted to approved submissions owned by the signed-in user.

For a rejected request, the app now logs PayPal's HTTP status, error name, safe issue identifiers, and PayPal `debug_id` without logging the recipient email or access token. The response gives a more specific next step for common insufficient-funds, authorization, and validation failures. Check the server logs and PayPal Sandbox when the status is uncertain; do not retry an uncertain payout until its status is checked.

## License

This project is available under the OSI-approved MIT License. See [LICENSE](LICENSE).
