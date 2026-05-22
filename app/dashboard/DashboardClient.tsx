'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type CourseStatus = {
  id: string;
  name: string;
  description: string;
  questions: any[];
  attemptsUsed: number;
  maxAttempts: number;
  locked: boolean;
};

export default function DashboardClient({
  studentName,
  studentEmail,
  courses,
  deadlineISO,
  assessmentOpen,
  reason,
}: {
  studentName: string;
  studentEmail: string;
  courses: CourseStatus[];
  deadlineISO: string;
  assessmentOpen: boolean;
  reason?: string;
}) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    const update = () => {
      const ms = new Date(deadlineISO).getTime() - Date.now();
      if (ms <= 0) {
        setTimeLeft('Closed');
        setClosed(true);
        return;
      }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setTimeLeft(`${h}h ${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [deadlineISO]);

  const logout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen">
      <header className="bg-tlm-primary text-white">
        <div className="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">TLM Assessment Portal</h1>
            <p className="text-blue-100 text-xs">{studentEmail}</p>
          </div>
          <button onClick={logout} className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition">
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="card mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Hi {studentName.split(' ')[0]} 👋</h2>
            <p className="text-gray-600 text-sm">Choose a course to begin your assessment.</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Time remaining</div>
            <div className={`text-2xl font-mono font-bold ${closed ? 'text-red-600' : 'text-tlm-primary'}`}>
              {timeLeft}
            </div>
          </div>
        </div>

        {!assessmentOpen && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-sm text-red-800">
            <strong>{reason || 'Assessment is closed.'}</strong>
            <p className="mt-1">You can still view this page, but cannot start new tests.</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((c) => {
            const used = c.attemptsUsed;
            const remaining = c.maxAttempts - used;
            const isLocked = c.locked || closed;
            const isFull = used >= c.maxAttempts;

            return (
              <div
                key={c.id}
                className={`card transition ${isLocked ? 'opacity-60' : 'hover:shadow-md hover:border-tlm-primary'}`}
              >
                <h3 className="text-lg font-bold mb-1">{c.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{c.description}</p>

                <div className="text-xs mb-4">
                  <span className="text-gray-500">{c.questions.length} questions · 10 min timer</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <AttemptDots used={used} max={c.maxAttempts} />
                    <p className="text-xs text-gray-500 mt-1">
                      {isFull
                        ? 'Both attempts used'
                        : used === 0
                          ? `${c.maxAttempts} attempts available`
                          : `${remaining} attempt${remaining === 1 ? '' : 's'} left`}
                    </p>
                  </div>

                  {isFull ? (
                    <span className="text-xs bg-gray-100 text-gray-600 px-3 py-2 rounded-lg">
                      Completed
                    </span>
                  ) : closed ? (
                    <span className="text-xs bg-red-50 text-red-600 px-3 py-2 rounded-lg">
                      Closed
                    </span>
                  ) : (
                    <Link
                      href={`/test/${c.id}`}
                      className="text-sm bg-tlm-primary text-white px-4 py-2 rounded-lg hover:bg-blue-800"
                    >
                      {used === 0 ? 'Start Test' : 'Retake'}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
          <p className="font-medium mb-1">How it works</p>
          <ul className="text-gray-700 space-y-1 list-disc list-inside">
            <li>10-minute timer per attempt &mdash; auto-submits when time runs out</li>
            <li>You get 2 attempts per course &mdash; use them however you want</li>
            <li>Results come by email within 3 days after submission</li>
          </ul>
        </div>
      </main>
    </div>
  );
}

function AttemptDots({ used, max }: { used: number; max: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <span
          key={i}
          className={`w-3 h-3 rounded-full ${i < used ? 'bg-tlm-primary' : 'bg-gray-200'}`}
        />
      ))}
    </div>
  );
}
