# finShare

finShare is a modern expense sharing dashboard built with Next.js App Router, Clerk authentication, Prisma v7, and PostgreSQL.

It lets authenticated users:

- sign in with Clerk
- track expenses they paid
- split shared bills with friends
- add friends and settle debt splits
- view net balance and category charts

## Tech Stack

- **Next.js 16.2.6** (App Router, server components)
- **React 19.2.4**
- **TypeScript 5**
- **Tailwind CSS v4**
- **Clerk** for authentication
- **Prisma v7** with `@prisma/client` and `@prisma/adapter-pg`
- **PostgreSQL** (Neon-compatible connection string)
- **Recharts** for chart rendering
- **qrcode.react** for QR code UI support

## Key Features

- protected `/dashboard` route
- Clerk `currentUser()` authentication guard
- lazy user sync between Clerk and Prisma database
- expense creation with split methods: equal, exact, percent
- friend link creation and debt settlement
- aggregated dashboard totals and category charts
- Prisma v7 config using `prisma.config.mjs`

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root.

3. Add the needed environment variables:

```env
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=verify-full&connect_timeout=30"
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
```

4. Generate the Prisma client:

```bash
npx prisma generate
```

5. Push the Prisma schema to the database:

```bash
npx prisma db push
```

6. Start the development server:

```bash
npm run dev
```

Open `http://localhost:3000` in your browser.

> If port `3000` is already occupied, Next.js may start on `3001`. Stop the existing process first if you want to return to `3000`.

## Prisma Notes

- Prisma config file: `prisma.config.mjs`
- Prisma schema file: `prisma/schema.prisma`
- Generated client output: `app/generated/prisma`
- The project uses `PrismaPg` adapter in `app/lib/db.ts`.

### Important Prisma files

- `prisma.config.mjs`
- `prisma/schema.prisma`
- `app/lib/db.ts`

## Application Structure

- `app/dashboard/page.tsx` — dashboard server page and user sync logic
- `app/dashboard/action.ts` — server actions for expense creation, adding friends, settling splits
- `app/dashboard/FriendsCard.tsx` — friend list UI
- `app/dashboard/CategoryChart.tsx` — expense category visualization
- `app/dashboard/SplitRow.tsx` — split detail row UI
- `app/lib/db.ts` — Prisma client singleton

## Data Model

The Prisma schema includes:

- `User`
- `Expense`
- `ExpenseSplit`
- `Friendship`
- enums: `Category`, `SplitMethod`

## Deployment

This project can be deployed to Vercel or any platform that supports Next.js. Make sure to set the same environment variables in the deployment environment and run Prisma migrations or `prisma db push` before startup.

## Troubleshooting

- If you see a PostgreSQL SSL warning, use `sslmode=verify-full` or `uselibpqcompat=true&sslmode=require` depending on your DB provider.
- If the dashboard says `public.User` does not exist, rerun `npx prisma db push` after verifying `DATABASE_URL`.
- If the server switches to port `3001`, stop the old process with:

```bash
taskkill /PID <PID> /F
```

## License

This repository is currently private and not licensed for public use.
