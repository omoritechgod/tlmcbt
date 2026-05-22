import { redirect, notFound } from 'next/navigation';
import { getStudentSession } from '@/lib/auth';
import { getCourse } from '@/lib/questions';
import { countAttempts, isAssessmentOpen, getDeadline } from '@/lib/db';
import TestClient from './TestClient';

export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 2;
const TIMER_MINUTES = 10;

export default async function TestPage({ params }: { params: { courseId: string } }) {
  const session = await getStudentSession();
  if (!session) redirect('/');

  const course = getCourse(params.courseId);
  if (!course) notFound();

  const { open } = await isAssessmentOpen();
  if (!open) redirect('/dashboard');

  const used = await countAttempts(session.email, params.courseId);
  if (used >= MAX_ATTEMPTS) redirect('/dashboard');

  const deadline = await getDeadline();

  return (
    <TestClient
      course={course}
      studentName={session.name}
      studentEmail={session.email}
      attemptNumber={used + 1}
      maxAttempts={MAX_ATTEMPTS}
      timerSeconds={TIMER_MINUTES * 60}
      deadlineISO={deadline.toISOString()}
    />
  );
}
