import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthed } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function UploadPage() {
  if (!(await isAdminAuthed())) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen">
      <header className="bg-tlm-dark text-white">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <Link href="/admin" className="text-sm text-blue-300 hover:underline">
            &larr; Back to dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <div className="card">
          <h1 className="text-2xl font-bold mb-3">Upload Questions via CSV</h1>
          <p className="text-gray-600 mb-6">
            Questions are currently hardcoded in <code className="bg-gray-100 px-2 py-1 rounded">lib/questions.ts</code>.
            To add CSV upload, we'd extend this page \u2014 it's wired up for when you're ready.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold mb-2">Suggested CSV format:</h3>
            <pre className="text-xs bg-white p-3 rounded overflow-x-auto">
{`course_id,type,question,option_a,option_b,option_c,option_d,correct_answer,max_score
robotics,mcq,"What pins control direction?","ENA/ENB","IN1-IN4","VCC/GND","OUT1/OUT2","IN1-IN4",10
web-development,theory,"What is HTML?",,,,,,20`}
            </pre>
          </div>

          <input type="file" accept=".csv" className="mb-4 block" disabled />
          <button className="btn-primary" disabled>
            Upload (coming soon)
          </button>

          <p className="text-xs text-gray-500 mt-4">
            For now, edit <code>lib/questions.ts</code> directly to add or change questions.
          </p>
        </div>
      </main>
    </div>
  );
}
