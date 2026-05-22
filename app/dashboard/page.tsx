import { redirect } from 'next/navigation';
import { getStudentSession } from '@/lib/auth';
import { COURSES } from '@/lib/questions';
import { getStudentAttempts, isAssessmentOpen, getDeadline } from '@/lib/db';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 2;

export default async function Dashboard() {
  const session = await getStudentSession();
  if (!session) redirect('/');

  const attempts = await getStudentAttempts(session.email);
  const { open, reason } = await isAssessmentOpen();
  const deadline = await getDeadline();

  const attemptsByCourse: Record<string, number> = {};
  attempts.forEach((a) => {
    attemptsByCourse[a.course_id] = (attemptsByCourse[a.course_id] || 0) + 1;
  });

  const coursesWithStatus = COURSES.map((c) => ({
    ...c,
    attemptsUsed: attemptsByCourse[c.id] || 0,
    locked: !open || (attemptsByCourse[c.id] || 0) >= MAX_ATTEMPTS,
    maxAttempts: MAX_ATTEMPTS,
  }));

  return (
    <DashboardClient
      studentName={session.name}
      studentEmail={session.email}
      courses={coursesWithStatus}
      deadlineISO={deadline.toISOString()}
      assessmentOpen={open}
      reason={reason}
    />
  );
}
