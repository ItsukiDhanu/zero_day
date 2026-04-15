# Zero Day Hackathon Platform

A terminal-themed hackathon registration and team management platform built with Next.js, Prisma, and Neon Postgres.

## Features

- Email/password authentication with signed cookie sessions
- Registration restriction to `@acharya.ac.in` email addresses
- Team creation with unique 6-character join codes
- Team join flow requiring team name + join code (with typo tolerance for team name)
- Team capacity guard (`max 4` members)
- Live team dashboard with captain/member visibility
- Organizer console:
  - Toggle registration open/closed
  - Read-only user and team directories
- Admin console:
  - Update user roles (`PARTICIPANT`, `ORGANIZER`, `ADMIN`)
  - Force-remove users from teams
  - Delete users and teams
- Production-ready UX polish:
  - Route/loading skeletons
  - Command palette
  - Hero command animation + countdown

## Tech Stack

- Next.js (App Router)
- React 19 + TypeScript
- Tailwind CSS
- Prisma ORM
- Neon PostgreSQL
- Vercel deployment

## Environment Variables

Create a `.env` file from `.env.example`.

Required variables:

- `DATABASE_URL` - pooled Postgres connection string
- `DIRECT_URL` - direct Postgres connection string for migrations
- `SESSION_SECRET` - strong random secret for session token signing

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Configure environment variables:

```bash
cp .env.example .env
```

3. Run Prisma migrations:

```bash
npx prisma migrate dev
```

4. Start dev server:

```bash
npm run dev
```

5. Open:

```text
http://localhost:3000
```

## Available Scripts

- `npm run dev` - start development server
- `npm run build` - production build
- `npm run start` - run production server locally
- `npm run lint` - run lint checks
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - run Prisma dev migrations

## Project Structure

- `app/` - pages and API routes
- `components/` - UI components and client shells
- `lib/` - auth/session/util modules
- `prisma/` - Prisma schema + migrations

## Deployment

This app is designed for Vercel deployment.

Basic flow:

1. Configure project env vars in Vercel (`DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`)
2. Deploy:

```bash
npx vercel --prod
```

## Contact

For project queries:

- Email: `dhanushvpshetty@gmail.com`
- Phone: `+91 9606726468`

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
