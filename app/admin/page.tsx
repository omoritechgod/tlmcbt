import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAdminAuthed } from '@/lib/auth';
import { listSubmissions, getStats, getDeadline, getSetting } from '@/lib/db';
import { COURSES } from '@/lib/questions';
import LogoutButton from '@/components/LogoutButton';
import SettingsPanel from './SettingsPanel';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: { course?: string; status?: string };
}) {
  if (!(await isAdminAuthed())) redirect('/admin/login');

  const submissions = await listSubmissions({
    course_id: searchParams.course,
    status: searchParams.status as any,
  });
  const stats = await getStats();
  const deadline = await getDeadline();
  const isOpen = (await getSetting('is_open')) === '1';

  return (
    <div className="min-h-screen">
      <header className="bg-tlm-dark text-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">TLM Admin Dashboard</h1>
            <p className="text-xs text-gray-400">Manage submissions & scores</p>
          </div>
          <div className="flex gap-4 items-center text-sm">
            <Link href="/admin/upload" className="hover:underline">Upload Questions</Link>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <SettingsPanel initialDeadline={deadline.toISOString()} initialOpen={isOpen} />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard label="Students" value={stats.studentCount} color="bg-purple-500" />
          <StatCard label="Submissions" value={stats.total} color="bg-blue-500" />
          <StatCard label="Pending" value={stats.pending} color="bg-yellow-500" />
          <StatCard label="Graded" value={stats.graded} color="bg-indigo-500" />
          <StatCard label="Released" value={stats.released} color="bg-green-500" />
        </div>

        <div className="card mb-4">
          <div className="flex gap-2 flex-wrap items-center text-sm">
            <span className="font-medium mr-2">Filter:</span>
            <FilterLink href="/admin" label="All" active={!searchParams.course && !searchParams.status} />
            <FilterLink href="/admin?status=pending" label="Pending" active={searchParams.status === 'pending'} />
            <FilterLink href="/admin?status=graded" label="Graded" active={searchParams.status === 'graded'} />
            <FilterLink href="/admin?status=released" label="Released" active={searchParams.status === 'released'} />
            <span className="mx-2 text-gray-300">|</span>
            {COURSES.map((c) => (
              <FilterLink key={c.id} href={`/admin?course=${c.id}`} label={c.name} active={searchParams.course === c.id} />
            ))}
          </div>
        </div>

        <div className="card p-0 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-xs uppercase text-gray-500">
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Course</th>
                <th className="px-4 py-3">Attempt</th>
                <th className="px-4 py-3">Submitted</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {submissions.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No submissions yet.</td></tr>
              ) : (
                submissions.map((s) => {
                  const course = COURSES.find((c) => c.id === s.course_id);
                  return (
                    <tr key={s.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="font-medium">{s.student_name}</div>
                        <div className="text-xs text-gray-500">{s.student_email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{course?.name || s.course_id}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="bg-gray-100 px-2 py-1 rounded text-xs">#{s.attempt_number}</span>
                        {s.auto_submitted ? <span className="ml-1 text-xs text-orange-600" title="Auto-submitted (time ran out)">⏰</span> : null}
                        {s.is_kept ? <span className="ml-1 text-xs text-green-600" title="Final attempt">★</span> : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(s.submitted_at).toLocaleString('en-NG', { timeZone: 'Africa/Lagos', dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {s.total_score !== null ? <span className="font-medium">{s.total_score} / {s.max_total}</span> : <span className="text-gray-400">&mdash;</span>}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={s.status} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/submissions/${s.id}`} className="text-tlm-primary text-sm font-medium hover:underline">
                          {s.status === 'pending' ? 'Grade' : 'View'} &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="card">
      <div className="flex items-center gap-3"><div className={`w-3 h-3 rounded-full ${color}`} /><div className="text-sm text-gray-600">{label}</div></div>
      <div className="text-3xl font-bold mt-2">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = { pending: 'bg-yellow-100 text-yellow-800', graded: 'bg-indigo-100 text-indigo-800', released: 'bg-green-100 text-green-800' } as const;
  return <span className={`text-xs px-2 py-1 rounded-full font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100'}`}>{status}</span>;
}

function FilterLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return <Link href={href} className={`px-3 py-1 rounded-full text-xs transition ${active ? 'bg-tlm-primary text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>{label}</Link>;
}
