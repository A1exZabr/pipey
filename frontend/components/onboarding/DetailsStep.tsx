'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface DetailsStepProps {
  onComplete: () => void;
}

export default function DetailsStep({ onComplete }: DetailsStepProps) {
  const [companyName, setCompanyName] = useState('');
  const [inn, setInn] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateSettings({
        company: {
          name: companyName || undefined,
          inn: inn || undefined,
        },
      });
      onComplete();
    } catch {
      onComplete(); // Proceed even on error
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">Company details</h1>
        <p className="text-gray-500 mt-2">
          Required for generating invoices and quotes. You can fill this in later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="input-field"
            placeholder="Acme Inc."
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
          <input
            type="text"
            value={inn}
            onChange={(e) => setInn(e.target.value)}
            className="input-field"
            placeholder="7712345678"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onComplete}
            className="btn-secondary flex-1"
          >
            I'll do this later
          </button>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1"
          >
            {saving ? 'Saving...' : 'Save and continue'}
          </button>
        </div>
      </form>
    </div>
  );
}
