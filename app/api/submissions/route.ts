import { NextRequest, NextResponse } from 'next/server';
import { createSubmission, countAttempts, isAssessmentOpen, getStudent } from '@/lib/db';
import { getCourse, getMaxTotalScore } from '@/lib/questions';
import { getStudentSession } from '@/lib/auth';
import crypto from 'crypto';

const MAX_ATTEMPTS = 2;

export async function POST(req: NextRequest) {
  try {
    const session = await getStudentSession();
    if (!session) return NextResponse.json({ error: 'Not logged in' }, { status: 401 });

    const body = await req.json();
    const { courseId, answers, autoSubmitted } = body;
    if (!courseId || !answers) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });

    const course = getCourse(courseId);
    if (!course) return NextResponse.json({ error: 'Invalid course' }, { status: 400 });

    const { open, reason } = await isAssessmentOpen();
    if (!open && !autoSubmitted) {
      return NextResponse.json({ error: reason || 'Assessment is closed' }, { status: 403 });
    }

    const used = await countAttempts(session.email, courseId);
    if (used >= MAX_ATTEMPTS) {
      return NextResponse.json(
        { error: `You have used all ${MAX_ATTEMPTS} attempts for this course.` },
        { status: 403 }
      );
    }

    const student = await getStudent(session.email);
    const id = crypto.randomBytes(8).toString('hex');
    const { attemptNumber } = await createSubmission({
      id,
      course_id: courseId,
      student_name: session.name,
      student_email: session.email,
      student_phone: student?.phone || '',
      answers,
      max_total: getMaxTotalScore(courseId),
      auto_submitted: !!autoSubmitted,
    });

    return NextResponse.json({ ok: true, id, attemptNumber });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
