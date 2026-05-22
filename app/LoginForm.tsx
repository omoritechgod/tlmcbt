'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm({
  assessmentOpen,
  deadline,
}: {
  assessmentOpen: boolean;
  deadline: string;
}) {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      router.push('/dashboard');
      router.refresh();
    } else {
      setError(data.error || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Full Name *</label>
        <input
          className="input"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="John Doe"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email Address *</label>
        <input
          type="email"
          className="input"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="john@example.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Phone (optional)</label>
        <input
          className="input"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="+234..."
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        className="btn-primary w-full"
        disabled={loading || !assessmentOpen}
      >
        {loading ? 'Logging in...' : 'Continue'}
      </button>
    </form>
  );
}
