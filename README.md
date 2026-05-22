# TLM Assessment Portal

A mini CBT (Computer-Based Test) platform for TLM students.

## Features

- **Student auth**: name + email login (auto-creates account on first login)
- **Dashboard**: 6 courses with attempt tracking + live countdown timer
- **2 attempts per course**: students can retry within the window
- **10-minute timer per attempt**: auto-submits when time runs out
- **Admin-configurable deadline**: open/close the assessment anytime
- **Admin grading**: review answers, score theory questions, release results via email
- **Mixed question types**: MCQ + theory

## Courses (5 questions each)

1. Web Development
2. Graphics Design
3. Video Editing
4. Leadership & Entrepreneurship
5. Robotics (2 theory + 3 MCQ)
6. Digital Marketing & Virtual Assistance

## Tech stack

- Next.js 14 (App Router)
- Tailwind CSS
- SQLite via `better-sqlite3`
- Resend for emails
- JWT auth (separate cookies for students and admin)

## Local setup

```bash
npm install
cp .env.example .env.local
# Edit .env.local
npm run dev
```

Open `http://localhost:3000`.

## Important env vars

- `ADMIN_PASSWORD` — admin login password
- `JWT_SECRET` — random 32+ char string
- `RESEND_API_KEY` — for sending result emails (optional in dev)
- `EMAIL_FROM` — verified sender address

## Setting the deadline

When you first run the app, it auto-sets the deadline to **today at 21:45 Lagos time** (or tomorrow if already past). You can change this any time from the admin dashboard.

## Flow

**Student:**
1. Land on `/` → enter name + email + (optional) phone → "Continue"
2. Redirected to `/dashboard` → sees all 6 courses + countdown
3. Click a course → intro screen → "Start Timer & Begin"
4. Take test (10 min timer counting down) → submit (or auto-submit at 0:00)
5. See confirmation screen → back to dashboard
6. Can retake the same course one more time within the window

**Admin:**
1. `/admin/login` → enter password
2. See settings panel (adjust deadline, toggle open/closed)
3. See submissions table (filterable by course/status)
4. Click any submission → see student's answers
5. Score each question + write feedback → "Save Grades"
6. Click "Release & Email Results" → student gets email with breakdown

## Attempt logic

- Each student gets 2 attempts per course
- Both attempts are stored separately (admin sees both)
- Auto-submitted attempts (timer ran out) are marked with ⏰
- Admin can mark which attempt is "kept" as final (★)

## Deployment

### Railway/Render (easiest for SQLite)

1. Push to GitHub
2. Create new project, connect repo
3. Add env vars
4. Add a persistent volume at `/app/data`
5. Deploy

### Vercel (needs Turso)

Vercel's serverless = no persistent disk. Either:
- Swap `better-sqlite3` for `@libsql/client` (Turso, SQLite-compatible cloud)
- Or use Postgres (Neon, Supabase)

I can do the swap whenever you're ready to deploy.

## Files of note

- `lib/questions.ts` — edit this to change questions
- `lib/db.ts` — database schema and queries
- `lib/auth.ts` — student + admin session handling
- `app/dashboard/` — student dashboard
- `app/test/[courseId]/` — test page with timer
- `app/admin/` — admin pages
