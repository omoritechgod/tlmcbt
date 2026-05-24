import { NextRequest, NextResponse } from 'next/server';
import { gradeSubmission, releaseSubmission, getSubmission } from '@/lib/db';
import { isAdminAuthed } from '@/lib/auth';
import { getCourse } from '@/lib/questions';
import { sendResultsEmail } from '@/lib/email';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { scores, feedback, action } = await req.json();
  const submission = await getSubmission(params.id);
  if (!submission) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (action === 'grade') {
    const total = Object.values(scores as Record<string, number>).reduce(
      (s, v) => s + (Number(v) || 0),
      0
    );
    await gradeSubmission(params.id, scores, total, feedback || '');
    return NextResponse.json({ ok: true, total });
  }

  if (action === 'release') {
    const updated = await getSubmission(params.id);
    if (!updated || updated.status !== 'graded') {
      return NextResponse.json({ error: 'Must grade before releasing' }, { status: 400 });
    }
    const course = getCourse(updated.course_id);
    const breakdown =
      course?.questions.map((q) => ({
        question: q.question,
        score: updated.scores?.[q.id] || 0,
        max: q.maxScore,
      })) || [];

    const emailResult = await sendResultsEmail({
      to: updated.student_email,
      studentName: updated.student_name,
      courseName: course?.name || updated.course_id,
      totalScore: updated.total_score || 0,
      maxTotal: updated.max_total || 0,
      feedback: updated.admin_feedback || undefined,
      scoreBreakdown: breakdown,
    });

    // If email failed, surface the error and don't mark as released
    if ((emailResult as any).error) {
      return NextResponse.json(
        {
          error: `Grades saved, but email failed to send: ${(emailResult as any).error}. Check SMTP settings.`,
          email: emailResult,
        },
        { status: 500 }
      );
    }

    await releaseSubmission(params.id);
    return NextResponse.json({ ok: true, email: emailResult });
  }

  if (action === 'resend') {
    // Re-send email for already-released submission
    if (submission.status !== 'released' && submission.status !== 'graded') {
      return NextResponse.json(
        { error: 'Can only resend graded or released submissions' },
        { status: 400 }
      );
    }
    const course = getCourse(submission.course_id);
    const breakdown =
      course?.questions.map((q) => ({
        question: q.question,
        score: submission.scores?.[q.id] || 0,
        max: q.maxScore,
      })) || [];

    const emailResult = await sendResultsEmail({
      to: submission.student_email,
      studentName: submission.student_name,
      courseName: course?.name || submission.course_id,
      totalScore: submission.total_score || 0,
      maxTotal: submission.max_total || 0,
      feedback: submission.admin_feedback || undefined,
      scoreBreakdown: breakdown,
    });

    if ((emailResult as any).error) {
      return NextResponse.json(
        {
          error: `Email failed to send: ${(emailResult as any).error}`,
          email: emailResult,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, email: emailResult, resent: true });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
