import { createClient, type Client } from '@libsql/client';

// Works with both Turso (libsql://...) and local file (file:./data/cbt.db)
const URL = process.env.TURSO_DATABASE_URL || 'file:./data/cbt.db';
const AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

let client: Client | null = null;
let initPromise: Promise<void> | null = null;

function getClient(): Client {
  if (!client) {
    client = createClient({
      url: URL,
      authToken: AUTH_TOKEN,
    });
  }
  return client;
}

async function ensureSchema() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const c = getClient();
    await c.batch(
      [
        `CREATE TABLE IF NOT EXISTS students (
          email TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          phone TEXT,
          created_at TEXT NOT NULL,
          last_login_at TEXT
        )`,
        `CREATE TABLE IF NOT EXISTS submissions (
          id TEXT PRIMARY KEY,
          course_id TEXT NOT NULL,
          student_email TEXT NOT NULL,
          student_name TEXT NOT NULL,
          student_phone TEXT,
          attempt_number INTEGER NOT NULL DEFAULT 1,
          answers TEXT NOT NULL,
          scores TEXT,
          total_score INTEGER,
          max_total INTEGER,
          status TEXT NOT NULL DEFAULT 'pending',
          auto_submitted INTEGER DEFAULT 0,
          admin_feedback TEXT,
          is_kept INTEGER DEFAULT 0,
          submitted_at TEXT NOT NULL,
          graded_at TEXT,
          released_at TEXT
        )`,
        `CREATE INDEX IF NOT EXISTS idx_course ON submissions(course_id)`,
        `CREATE INDEX IF NOT EXISTS idx_status ON submissions(status)`,
        `CREATE INDEX IF NOT EXISTS idx_email ON submissions(student_email)`,
        `CREATE INDEX IF NOT EXISTS idx_email_course ON submissions(student_email, course_id)`,
        `CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        )`,
      ],
      'write'
    );

    // Seed default deadline if missing
    const existing = await c.execute({
      sql: "SELECT value FROM settings WHERE key = 'deadline'",
      args: [],
    });
    if (existing.rows.length === 0) {
      const now = new Date();
      const deadline = new Date(now);
      deadline.setUTCHours(20, 45, 0, 0); // 21:45 Lagos (UTC+1) = 20:45 UTC
      if (deadline < now) deadline.setUTCDate(deadline.getUTCDate() + 1);
      await c.execute({
        sql: "INSERT INTO settings (key, value) VALUES ('deadline', ?)",
        args: [deadline.toISOString()],
      });
    }
    const openRow = await c.execute({
      sql: "SELECT value FROM settings WHERE key = 'is_open'",
      args: [],
    });
    if (openRow.rows.length === 0) {
      await c.execute({
        sql: "INSERT INTO settings (key, value) VALUES ('is_open', '1')",
        args: [],
      });
    }
  })();
  return initPromise;
}

async function db() {
  await ensureSchema();
  return getClient();
}

// ---------- SETTINGS ----------

export async function getSetting(key: string): Promise<string | null> {
  const c = await db();
  const r = await c.execute({ sql: 'SELECT value FROM settings WHERE key = ?', args: [key] });
  return (r.rows[0]?.value as string) ?? null;
}

export async function setSetting(key: string, value: string) {
  const c = await db();
  await c.execute({
    sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    args: [key, value],
  });
}

export async function getDeadline(): Promise<Date> {
  const v = await getSetting('deadline');
  return v ? new Date(v) : new Date(Date.now() + 48 * 60 * 60 * 1000);
}

export async function isAssessmentOpen(): Promise<{ open: boolean; reason?: string; deadline: Date }> {
  const deadline = await getDeadline();
  const adminOpen = (await getSetting('is_open')) === '1';
  const now = new Date();
  if (!adminOpen) return { open: false, reason: 'Assessment is currently closed', deadline };
  if (now > deadline) return { open: false, reason: 'Assessment window has closed', deadline };
  return { open: true, deadline };
}

// ---------- STUDENTS ----------

export type Student = {
  email: string;
  name: string;
  phone: string | null;
  created_at: string;
  last_login_at: string | null;
};

export async function getOrCreateStudent(name: string, email: string, phone?: string): Promise<Student> {
  const c = await db();
  const normalizedEmail = email.trim().toLowerCase();
  const trimmedName = name.trim();
  const trimmedPhone = phone?.trim() || null;
  const nowIso = new Date().toISOString();

  const existing = await c.execute({
    sql: 'SELECT * FROM students WHERE email = ?',
    args: [normalizedEmail],
  });

  if (existing.rows.length > 0) {
    await c.execute({
      sql: 'UPDATE students SET last_login_at = ?, name = ?, phone = COALESCE(?, phone) WHERE email = ?',
      args: [nowIso, trimmedName, trimmedPhone, normalizedEmail],
    });
    const row = existing.rows[0] as any;
    return {
      email: row.email,
      name: trimmedName,
      phone: trimmedPhone ?? row.phone,
      created_at: row.created_at,
      last_login_at: nowIso,
    };
  }

  await c.execute({
    sql: 'INSERT INTO students (email, name, phone, created_at, last_login_at) VALUES (?, ?, ?, ?, ?)',
    args: [normalizedEmail, trimmedName, trimmedPhone, nowIso, nowIso],
  });
  return {
    email: normalizedEmail,
    name: trimmedName,
    phone: trimmedPhone,
    created_at: nowIso,
    last_login_at: nowIso,
  };
}

export async function getStudent(email: string): Promise<Student | null> {
  const c = await db();
  const r = await c.execute({
    sql: 'SELECT * FROM students WHERE email = ?',
    args: [email.toLowerCase()],
  });
  return (r.rows[0] as any) || null;
}

// ---------- SUBMISSIONS ----------

export type SubmissionStatus = 'pending' | 'graded' | 'released';

export type Submission = {
  id: string;
  course_id: string;
  student_email: string;
  student_name: string;
  student_phone: string | null;
  attempt_number: number;
  answers: Record<string, string>;
  scores: Record<string, number> | null;
  total_score: number | null;
  max_total: number | null;
  status: SubmissionStatus;
  auto_submitted: number;
  admin_feedback: string | null;
  is_kept: number;
  submitted_at: string;
  graded_at: string | null;
  released_at: string | null;
};

function rowToSubmission(row: any): Submission {
  return {
    ...row,
    answers: JSON.parse(row.answers),
    scores: row.scores ? JSON.parse(row.scores) : null,
  };
}

export async function countAttempts(email: string, courseId: string): Promise<number> {
  const c = await db();
  const r = await c.execute({
    sql: 'SELECT COUNT(*) as c FROM submissions WHERE student_email = ? AND course_id = ?',
    args: [email.toLowerCase(), courseId],
  });
  return Number(r.rows[0].c);
}

export async function getStudentAttempts(email: string): Promise<Submission[]> {
  const c = await db();
  const r = await c.execute({
    sql: 'SELECT * FROM submissions WHERE student_email = ? ORDER BY submitted_at DESC',
    args: [email.toLowerCase()],
  });
  return r.rows.map(rowToSubmission);
}

export async function getStudentAttemptsForCourse(email: string, courseId: string): Promise<Submission[]> {
  const c = await db();
  const r = await c.execute({
    sql: 'SELECT * FROM submissions WHERE student_email = ? AND course_id = ? ORDER BY attempt_number ASC',
    args: [email.toLowerCase(), courseId],
  });
  return r.rows.map(rowToSubmission);
}

export async function createSubmission(data: {
  id: string;
  course_id: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  answers: Record<string, string>;
  max_total: number;
  auto_submitted?: boolean;
}): Promise<{ attemptNumber: number }> {
  const c = await db();
  const email = data.student_email.toLowerCase();
  const attemptNumber = (await countAttempts(email, data.course_id)) + 1;

  await c.execute({
    sql: `INSERT INTO submissions
      (id, course_id, student_email, student_name, student_phone, attempt_number, answers, max_total, auto_submitted, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.id,
      data.course_id,
      email,
      data.student_name,
      data.student_phone,
      attemptNumber,
      JSON.stringify(data.answers),
      data.max_total,
      data.auto_submitted ? 1 : 0,
      new Date().toISOString(),
    ],
  });
  return { attemptNumber };
}

export async function listSubmissions(filters?: {
  course_id?: string;
  status?: SubmissionStatus;
}): Promise<Submission[]> {
  const c = await db();
  let sql = 'SELECT * FROM submissions WHERE 1=1';
  const args: any[] = [];
  if (filters?.course_id) {
    sql += ' AND course_id = ?';
    args.push(filters.course_id);
  }
  if (filters?.status) {
    sql += ' AND status = ?';
    args.push(filters.status);
  }
  sql += ' ORDER BY submitted_at DESC';
  const r = await c.execute({ sql, args });
  return r.rows.map(rowToSubmission);
}

export async function getSubmission(id: string): Promise<Submission | null> {
  const c = await db();
  const r = await c.execute({ sql: 'SELECT * FROM submissions WHERE id = ?', args: [id] });
  return r.rows[0] ? rowToSubmission(r.rows[0]) : null;
}

export async function gradeSubmission(
  id: string,
  scores: Record<string, number>,
  totalScore: number,
  feedback: string
) {
  const c = await db();
  await c.execute({
    sql: `UPDATE submissions
      SET scores = ?, total_score = ?, admin_feedback = ?, status = 'graded', graded_at = ?
      WHERE id = ?`,
    args: [JSON.stringify(scores), totalScore, feedback, new Date().toISOString(), id],
  });
}

export async function markAsKept(id: string) {
  const c = await db();
  const sub = await getSubmission(id);
  if (!sub) return;
  await c.execute({
    sql: 'UPDATE submissions SET is_kept = 0 WHERE student_email = ? AND course_id = ?',
    args: [sub.student_email, sub.course_id],
  });
  await c.execute({
    sql: 'UPDATE submissions SET is_kept = 1 WHERE id = ?',
    args: [id],
  });
}

export async function releaseSubmission(id: string) {
  const c = await db();
  await c.execute({
    sql: "UPDATE submissions SET status = 'released', released_at = ? WHERE id = ?",
    args: [new Date().toISOString(), id],
  });
}

export async function getStats() {
  const c = await db();
  const total = Number(
    (await c.execute('SELECT COUNT(*) as c FROM submissions')).rows[0].c
  );
  const pending = Number(
    (await c.execute("SELECT COUNT(*) as c FROM submissions WHERE status = 'pending'")).rows[0].c
  );
  const graded = Number(
    (await c.execute("SELECT COUNT(*) as c FROM submissions WHERE status = 'graded'")).rows[0].c
  );
  const released = Number(
    (await c.execute("SELECT COUNT(*) as c FROM submissions WHERE status = 'released'")).rows[0].c
  );
  const studentCount = Number(
    (await c.execute('SELECT COUNT(*) as c FROM students')).rows[0].c
  );

  return { total, pending, graded, released, studentCount };
}
