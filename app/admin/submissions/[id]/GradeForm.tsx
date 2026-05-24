'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Course } from '@/lib/questions';
import type { Submission } from '@/lib/db';

export default function GradeForm({
  submission,
  course,
}: {
  submission: Submission;
  course: Course;
}) {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    course.questions.forEach((q) => {
      if (submission.scores?.[q.id] !== undefined) {
        initial[q.id] = submission.scores[q.id];
      } else if (q.type === 'mcq') {
        // auto-suggest score for MCQ
        const studentAnswer = submission.answers[q.id];
        initial[q.id] = studentAnswer === q.correctAnswer ? q.maxScore : 0;
      } else {
        initial[q.id] = 0;
      }
    });
    return initial;
  });
  const [feedback, setFeedback] = useState(submission.admin_feedback || '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const total = Object.values(scores).reduce((s, v) => s + (Number(v) || 0), 0);
  const isReleased = submission.status === 'released';
  const isGraded = submission.status === 'graded';

  const saveGrades = async () => {
    setSaving(true);
    setMessage('');
    const res = await fetch(`/api/admin/submissions/${submission.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'grade', scores, feedback }),
    });
    if (res.ok) {
      setMessage('\u2713 Grades saved');
      router.refresh();
    } else {
      setMessage('Failed to save');
    }
    setSaving(false);
  };

  const releaseResults = async () => {
    if (!confirm('Send results to ' + submission.student_email + '?')) return;
    setSaving(true);
    setMessage('');
    const res = await fetch(`/api/admin/submissions/${submission.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'release' }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('\u2713 Results released & email sent');
      router.refresh();
    } else {
      setMessage('Failed: ' + (data.error || 'unknown error'));
    }
    setSaving(false);
  };

  const resendEmail = async () => {
    if (!confirm('Resend the results email to ' + submission.student_email + '?')) return;
    setSaving(true);
    setMessage('');
    const res = await fetch(`/api/admin/submissions/${submission.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resend' }),
    });
    const data = await res.json();
    if (res.ok) {
      setMessage('\u2713 Email resent successfully');
    } else {
      setMessage('Resend failed: ' + (data.error || 'unknown error'));
    }
    setSaving(false);
  };

  return (
    <>
      <div className="space-y-4">
        {course.questions.map((q, i) => {
          const studentAnswer = submission.answers[q.id] || '(no answer)';
          const isCorrect = q.type === 'mcq' && studentAnswer === q.correctAnswer;
          return (
            <div key={q.id} className="card">
              <div className="flex justify-between mb-3">
                <span className="text-sm font-medium text-tlm-primary">
                  Question {i + 1} ({q.type === 'mcq' ? 'MCQ' : 'Theory'})
                </span>
                <span className="text-xs text-gray-500">Max: {q.maxScore} pts</span>
              </div>

              <p className="text-gray-800 mb-4">{q.question}</p>

              {q.type === 'mcq' && (
                <div className="text-xs mb-2 space-y-1">
                  <div className="text-gray-600">
                    Correct answer: <span className="font-medium text-green-700">{q.correctAnswer}</span>
                  </div>
                </div>
              )}

              <div
                className={`p-4 rounded-lg mb-4 ${
                  q.type === 'mcq'
                    ? isCorrect
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">Student's answer:</div>
                <div className="whitespace-pre-wrap text-gray-800">{studentAnswer}</div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-sm font-medium">Score:</label>
                <input
                  type="number"
                  min={0}
                  max={q.maxScore}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                  value={scores[q.id] ?? 0}
                  onChange={(e) =>
                    setScores({ ...scores, [q.id]: Number(e.target.value) })
                  }
                  disabled={isReleased}
                />
                <span className="text-sm text-gray-500">/ {q.maxScore}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feedback + Total */}
      <div className="card mt-6">
        <label className="block text-sm font-medium mb-2">
          Overall Feedback (optional \u2014 will appear in email)
        </label>
        <textarea
          className="input min-h-[100px]"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="E.g. Great work on theory, focus more on practical examples next time..."
          disabled={isReleased}
        />

        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div>
            <div className="text-sm text-gray-500">Total Score</div>
            <div className="text-3xl font-bold">
              {total} <span className="text-lg text-gray-400">/ {submission.max_total}</span>
            </div>
          </div>

          <div className="flex gap-2">
            {!isReleased && (
              <button onClick={saveGrades} className="btn-secondary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Grades'}
              </button>
            )}
            {!isReleased && (
              <button
                onClick={releaseResults}
                className="btn-primary"
                disabled={saving || !isGraded}
                title={!isGraded ? 'Save grades first' : ''}
              >
                {isGraded ? 'Release & Email Results' : 'Save grades first'}
              </button>
            )}
            {isReleased && (
              <div className="flex items-center gap-2">
                <div className="text-sm text-green-700 bg-green-50 px-4 py-2 rounded-lg">
                  \u2713 Released on{' '}
                  {submission.released_at
                    ? new Date(submission.released_at).toLocaleString()
                    : ''}
                </div>
                <button
                  onClick={resendEmail}
                  className="btn-secondary text-sm"
                  disabled={saving}
                  title="Resend the results email to the student"
                >
                  {saving ? 'Sending...' : '\u21bb Resend Email'}
                </button>
              </div>
            )}
          </div>
        </div>

        {message && <div className="text-sm mt-3 text-green-700">{message}</div>}
      </div>
    </>
  );
}
