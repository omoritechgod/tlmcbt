'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Helpers to convert between UTC ISO and Lagos-local datetime-local string
function isoToLagosLocal(iso: string): string {
  // datetime-local input expects "YYYY-MM-DDTHH:mm" in *local* time
  // We want Lagos time displayed. Format the date in Africa/Lagos timezone.
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(d).reduce((acc: any, p) => {
    acc[p.type] = p.value;
    return acc;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function lagosLocalToIso(localStr: string): string {
  // localStr is "YYYY-MM-DDTHH:mm" in Lagos time. Lagos = UTC+1.
  // Treat as Lagos time, convert to UTC ISO.
  // Simple approach: parse as if it were UTC, then subtract the Lagos offset.
  const asIfUtc = new Date(localStr + ':00Z');
  // Subtract 1 hour because Lagos is UTC+1 (so 21:45 Lagos = 20:45 UTC)
  const utc = new Date(asIfUtc.getTime() - 60 * 60 * 1000);
  return utc.toISOString();
}

export default function SettingsPanel({
  initialDeadline,
  initialOpen,
}: {
  initialDeadline: string;
  initialOpen: boolean;
}) {
  const router = useRouter();
  const [deadlineLocal, setDeadlineLocal] = useState(() => isoToLagosLocal(initialDeadline));
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const ms = new Date(initialDeadline).getTime() - Date.now();
      if (ms <= 0) {
        setTimeLeft('Window closed');
        return;
      }
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m remaining`);
    };
    update();
    const id = setInterval(update, 30000);
    return () => clearInterval(id);
  }, [initialDeadline]);

  const save = async () => {
    setSaving(true);
    setMsg('');
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deadline: lagosLocalToIso(deadlineLocal),
        is_open: isOpen,
      }),
    });
    if (res.ok) {
      setMsg('✓ Saved');
      router.refresh();
    } else {
      setMsg('Failed to save');
    }
    setSaving(false);
  };

  return (
    <div className="card mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div>
          <h2 className="font-bold mb-1">Assessment Window</h2>
          <p className="text-xs text-gray-600 mb-3">
            All times in Africa/Lagos (WAT). Currently: <strong>{timeLeft}</strong>
          </p>

          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-medium mb-1">Deadline (Lagos time)</label>
              <input
                type="datetime-local"
                value={deadlineLocal}
                onChange={(e) => setDeadlineLocal(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1">Status</label>
              <label className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOpen}
                  onChange={(e) => setIsOpen(e.target.checked)}
                />
                <span className="text-sm">{isOpen ? 'Open' : 'Closed'}</span>
              </label>
            </div>

            <button onClick={save} disabled={saving} className="btn-primary text-sm py-2">
              {saving ? 'Saving...' : 'Save'}
            </button>

            {msg && <span className="text-sm text-green-700">{msg}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
