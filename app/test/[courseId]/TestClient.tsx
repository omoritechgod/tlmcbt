'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Course } from '@/lib/questions';

export default function TestClient({
  course,
  studentName,
  studentEmail,
  attemptNumber,
  maxAttempts,
  timerSeconds,
  deadlineISO,
}: {
  course: Course;
  studentName: string;
  studentEmail: string;
  attemptNumber: number;
  maxAttempts: number;
  timerSeconds: number;
  deadlineISO: string;
}) {
  const router = useRouter();
  const [phase, setPhase] = useState<'intro' | 'test' | 'submitted'>('intro');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(timerSeconds);
  const [submitting, setSubmitting] = useState(false);
  const [autoSubmitted, setAutoSubmitted] = useState(false);
  const submitLockRef = useRef(false);
  const startTimeRef = useRef<number>(0);

  const doSubmit = useCallback(
    async (auto = false) => {
      if (submitLockRef.current) return;
      submitLockRef.current = true;
      setSubmitting(true);
      try {
        const res = await fetch('/api/submissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            courseId: course.id,
            answers,
            autoSubmitted: auto,
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.error?.includes('attempts')) {
            alert(data.error);
            router.push('/dashboard');
            return;
          }
          throw new Error(data.error || 'Submit failed');
        }
        if (auto) setAutoSubmitted(true);
        setPhase('submitted');
      } catch (err: any) {
        alert(err.message || 'Submission failed. Try again.');
        submitLockRef.current = false;
        setSubmitting(false);
      }
    },
    [answers, course.id, router]
  );

  // Timer effect
  useEffect(() => {
    if (phase !== 'test') return;
    startTimeRef.current = Date.now();
    const id = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const remaining = timerSeconds - elapsed;
      if (remaining <= 0) {
        clearInterval(id);
        setSecondsLeft(0);
        doSubmit(true);
      } else {
        setSecondsLeft(remaining);
      }
    }, 250);
    return () => clearInterval(id);
  }, [phase, timerSeconds, doSubmit]);

  // Warn on tab close during test
  useEffect(() => {
    if (phase !== 'test') return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [phase]);

  const handleManualSubmit = () => {
    const unanswered = course.questions.filter(
      (q) => !answers[q.id] || answers[q.id].trim() === ''
    );
    if (unanswered.length > 0) {
      if (
        !confirm(
          `You have ${unanswered.length} unanswered question(s). Submit anyway? You'll use up this attempt.`
        )
      )
        return;
    } else if (!confirm('Submit your final answers?')) {
      return;
    }
    doSubmit(false);
  };

  // ----------- SUBMITTED -----------
  if (phase === 'submitted') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-lg text-center">
          <div className="text-6xl mb-4">{autoSubmitted ? '⏰' : '✅'}</div>
          <h1 className="text-2xl font-bold mb-3">
            {autoSubmitted ? 'Time\u2019s up \u2014 auto-submitted' : 'Submission Received'}
          </h1>
          <p className="text-gray-600 mb-4">
            {autoSubmitted
              ? `Your ${course.name} attempt was submitted automatically when the timer ran out.`
              : `Your ${course.name} attempt has been submitted.`}
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-sm">
            <p>
              Results will be sent to <strong>{studentEmail}</strong> within 3 days after your instructor reviews your submission.
            </p>
            {attemptNumber < maxAttempts && (
              <p className="mt-2 text-tlm-primary font-medium">
                You still have {maxAttempts - attemptNumber} attempt left for this course.
              </p>
            )}
          </div>
          <Link href="/dashboard" className="btn-primary inline-block">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // ----------- INTRO -----------
  if (phase === 'intro') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="card max-w-lg w-full">
          <Link href="/dashboard" className="text-sm text-tlm-primary mb-4 inline-block">
            &larr; Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold mb-1">{course.name}</h1>
          <p className="text-gray-600 mb-6">{course.description}</p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm space-y-2">
            <p className="font-bold">Before you start:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong>{course.questions.length} questions</strong> in total</li>
              <li><strong>10 minutes</strong> &mdash; timer starts as soon as you click below</li>
              <li><strong>Auto-submit</strong> when time runs out</li>
              <li>This is <strong>attempt {attemptNumber} of {maxAttempts}</strong></li>
              <li>Don't refresh or close the tab during the test</li>
            </ul>
          </div>

          <button
            onClick={() => setPhase('test')}
            className="btn-primary w-full"
          >
            Start Timer & Begin
          </button>
        </div>
      </div>
    );
  }

  // ----------- TEST -----------
  const q = course.questions[currentQ];
  const isLast = currentQ === course.questions.length - 1;
  const answeredCount = Object.values(answers).filter((a) => a?.trim()).length;
  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isLowTime = secondsLeft <= 60;

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto px-6 py-3 flex justify-between items-center">
          <div>
            <h1 className="font-bold text-sm">{course.name}</h1>
            <p className="text-xs text-gray-500">
              {studentName} &middot; Attempt {attemptNumber}/{maxAttempts}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {answeredCount}/{course.questions.length}
            </div>
            <div
              className={`font-mono font-bold px-3 py-2 rounded-lg ${
                isLowTime ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {minutes}:{secs.toString().padStart(2, '0')}
            </div>
          </div>
        </div>
        <div className="h-1 bg-gray-200">
          <div
            className="h-full bg-tlm-primary transition-all"
            style={{ width: `${(answeredCount / course.questions.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6">
        <div className="flex gap-2 mb-6 flex-wrap">
          {course.questions.map((qq, i) => (
            <button
              key={qq.id}
              onClick={() => setCurrentQ(i)}
              className={`w-10 h-10 rounded-lg font-medium text-sm transition ${
                i === currentQ
                  ? 'bg-tlm-primary text-white'
                  : answers[qq.id]?.trim()
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="card">
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm text-tlm-primary font-medium">
              Question {currentQ + 1} of {course.questions.length}
            </span>
            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
              {q.maxScore} pts &middot; {q.type === 'mcq' ? 'Multiple Choice' : 'Theory'}
            </span>
          </div>

          <p className="text-lg mb-6 leading-relaxed">{q.question}</p>

          {q.type === 'mcq' ? (
            <div className="space-y-2">
              {q.options?.map((opt) => (
                <label
                  key={opt}
                  className={`flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition ${
                    answers[q.id] === opt
                      ? 'border-tlm-primary bg-blue-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name={q.id}
                    value={opt}
                    checked={answers[q.id] === opt}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                    className="mt-1"
                  />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          ) : (
            <textarea
              className="input min-h-[200px]"
              placeholder="Type your answer here..."
              value={answers[q.id] || ''}
              onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
            />
          )}
        </div>

        <div className="flex justify-between mt-6 gap-3">
          <button
            onClick={() => setCurrentQ(Math.max(0, currentQ - 1))}
            disabled={currentQ === 0}
            className="btn-secondary disabled:opacity-40"
          >
            &larr; Previous
          </button>

          {isLast ? (
            <button
              onClick={handleManualSubmit}
              disabled={submitting}
              className="btn-primary"
            >
              {submitting ? 'Submitting...' : 'Submit Assessment'}
            </button>
          ) : (
            <button onClick={() => setCurrentQ(currentQ + 1)} className="btn-primary">
              Next &rarr;
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
