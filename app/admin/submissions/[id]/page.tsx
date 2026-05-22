import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthed } from '@/lib/auth';
import { getSubmission } from '@/lib/db';
import { getCourse } from '@/lib/questions';
import GradeForm from './GradeForm';

export const dynamic = 'force-dynamic';

export default async function SubmissionPage({ params }: { params: { id: string } }) {
  if (!(await isAdminAuthed())) redirect('/admin/login');

  const submission = await getSubmission(params.id);
  if (!submission) notFound();

  const course = getCourse(submission.course_id);
  if (!course) notFound();

  return (
    <div className="min-h-screen">
      <header className="bg-tlm-dark text-white">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/admin" className="text-sm text-blue-300 hover:underline">&larr; Back to dashboard</Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="card mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{submission.student_name}</h1>
              <p className="text-gray-600">{submission.student_email}</p>
              {submission.student_phone && <p className="text-gray-500 text-sm">{submission.student_phone}</p>}
            </div>
            <div className="text-right text-sm">
              <p className="font-medium">{course.name}</p>
              <p className="text-gray-500">Attempt #{submission.attempt_number}{submission.auto_submitted ? ' (auto)' : ''}</p>
              <p className="text-gray-500">Submitted: {new Date(submission.submitted_at).toLocaleString()}</p>
              <p className="mt-1">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${submission.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : submission.status === 'graded' ? 'bg-indigo-100 text-indigo-800' : 'bg-green-100 text-green-800'}`}>{submission.status}</span>
              </p>
            </div>
          </div>
        </div>

        <GradeForm submission={submission} course={course} />
      </main>
    </div>
  );
}
