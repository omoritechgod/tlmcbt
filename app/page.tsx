import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getStudentSession } from '@/lib/auth';
import { isAssessmentOpen } from '@/lib/db';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getStudentSession();
  if (session) redirect('/dashboard');

  const { open, reason, deadline } = await isAssessmentOpen();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-tlm-primary text-white">
        <div className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">TLM Assessment Portal</h1>
            <p className="text-blue-100 text-sm">Computer-Based Test</p>
          </div>
          {/* <Link
            href="/admin/login"
            className="text-sm bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition"
          >
            Admin Login
          </Link> */}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-6">
        <div className="card max-w-md w-full">
          <h2 className="text-2xl font-bold mb-2">Welcome</h2>
          <p className="text-gray-600 mb-6">
            Enter your details below. If you've taken any test before with the same email,
            we'll pick up from where you left off.
          </p>

          {!open && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-sm text-red-800">
              <strong>Note:</strong> {reason || 'Assessment is currently unavailable.'}
            </div>
          )}

          <LoginForm assessmentOpen={open} deadline={deadline.toISOString()} />

          <div className="mt-6 pt-6 border-t text-xs text-gray-600 space-y-1">
            <p>&bull; You have <strong>2 attempts per course</strong></p>
            <p>&bull; Each test has a <strong>10-minute timer</strong></p>
            <p>&bull; Deadline: <strong>{new Date(deadline).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'medium', timeStyle: 'short' })}</strong></p>
          </div>
        </div>
      </main>
    </div>
  );
}
