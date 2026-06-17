'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { isPushSupported, isPushSubscribed, subscribeToPush, unsubscribeFromPush } from '@/lib/push';

type Scenario = 'b2b' | 'services' | 'products' | undefined;

interface Settings {
  scenario?: Scenario;
  company: {
    name?: string;
    inn?: string;
    kpp?: string;
    ogrn?: string;
    legalAddress?: string;
    actualAddress?: string;
    director?: string;
  };
  bank: {
    name?: string;
    bik?: string;
    account?: string;
    corrAccount?: string;
  };
  calendar: {
    workDays?: number[];
    workHoursStart?: string;
    workHoursEnd?: string;
    slotDuration?: number;
  };
  ai: {
    enabled?: boolean;
    autoSuggest?: boolean;
  };
}

const SCENARIO_CONFIG = {
  b2b: { label: 'B2B sales', icon: '🏢', description: 'Quotes, invoices, contracts' },
  services: { label: 'Services', icon: '📅', description: 'Bookings, consultations' },
  products: { label: 'Products', icon: '🛍', description: 'Catalog, product cards' },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'scenario' | 'company' | 'bank' | 'calendar' | 'ai' | 'notifications'>('scenario');

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(updates: Partial<Settings>) {
    setSaving(true);
    try {
      const data = await api.updateSettings(updates);
      setSettings(data);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-gray-500 mt-1">Organization and integration settings</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <TabButton active={activeTab === 'scenario'} onClick={() => setActiveTab('scenario')}>
          🎯 Scenario
        </TabButton>
        <TabButton active={activeTab === 'company'} onClick={() => setActiveTab('company')}>
          🏢 Company
        </TabButton>
        <TabButton active={activeTab === 'bank'} onClick={() => setActiveTab('bank')}>
          🏦 Bank
        </TabButton>
        <TabButton active={activeTab === 'calendar'} onClick={() => setActiveTab('calendar')}>
          📅 Schedule
        </TabButton>
        <TabButton active={activeTab === 'ai'} onClick={() => setActiveTab('ai')}>
          ✨ AI
        </TabButton>
        <TabButton active={activeTab === 'notifications'} onClick={() => setActiveTab('notifications')}>
          🔔 Notifications
        </TabButton>
      </div>

      {/* Content */}
      <div className="glass-card rounded-2xl p-6">
        {activeTab === 'scenario' && (
          <ScenarioSettings
            scenario={settings.scenario}
            onSave={(scenario) => saveSettings({ scenario })}
            saving={saving}
          />
        )}
        {activeTab === 'company' && (
          <CompanySettings
            company={settings.company}
            onSave={(company) => saveSettings({ company })}
            saving={saving}
          />
        )}
        {activeTab === 'bank' && (
          <BankSettings
            bank={settings.bank}
            onSave={(bank) => saveSettings({ bank })}
            saving={saving}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarSettings
            calendar={settings.calendar}
            onSave={(calendar) => saveSettings({ calendar })}
            saving={saving}
          />
        )}
        {activeTab === 'ai' && (
          <AiSettings
            ai={settings.ai}
            onSave={(ai) => saveSettings({ ai })}
            saving={saving}
          />
        )}
        {activeTab === 'notifications' && <PushNotificationSettings />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {children}
    </button>
  );
}

function PushNotificationSettings() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    async function check() {
      const s = await isPushSupported();
      setSupported(s);
      if (s) setSubscribed(await isPushSubscribed());
      setLoading(false);
    }
    check();
  }, []);

  async function handleToggle() {
    setToggling(true);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        const ok = await subscribeToPush();
        setSubscribed(ok);
      }
    } finally {
      setToggling(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-24">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!supported) {
    return (
      <div className="space-y-2">
        <h2 className="font-semibold">Push notifications</h2>
        <p className="text-sm text-gray-500">
          Your browser does not support push notifications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-semibold">Push notifications</h2>
        <p className="text-sm text-gray-500 mt-1">
          Get notified about new messages even when the app is closed.
        </p>
      </div>
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
        <div>
          <p className="font-medium text-sm">Message notifications</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {subscribed ? 'Enabled' : 'Disabled'}
          </p>
        </div>
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            subscribed ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              subscribed ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function ScenarioSettings({ scenario, onSave, saving }: { scenario: Scenario; onSave: (s: Scenario) => void; saving: boolean }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Work scenario</h2>
        <p className="text-gray-500 text-sm mt-1">Choose the main scenario for using the CRM</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {(Object.keys(SCENARIO_CONFIG) as Array<keyof typeof SCENARIO_CONFIG>).map((key) => {
          const config = SCENARIO_CONFIG[key];
          const isSelected = scenario === key;
          return (
            <button
              key={key}
              onClick={() => onSave(key)}
              disabled={saving}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-3xl">{config.icon}</span>
              <p className="font-semibold mt-2">{config.label}</p>
              <p className="text-sm text-gray-500 mt-1">{config.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CompanySettings({ company, onSave, saving }: { company: any; onSave: (c: any) => void; saving: boolean }) {
  const [form, setForm] = useState(company || {});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Company details</h2>
        <p className="text-gray-500 text-sm mt-1">Used in quotes and invoices</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Company name</label>
          <input className="input-field w-full" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Tax ID (INN)</label>
          <input className="input-field w-full" value={form.inn || ''} onChange={e => setForm({ ...form, inn: e.target.value })} />
        </div>
        <div>
          <label className="label">Tax code (KPP)</label>
          <input className="input-field w-full" value={form.kpp || ''} onChange={e => setForm({ ...form, kpp: e.target.value })} />
        </div>
        <div>
          <label className="label">Registration No. (OGRN)</label>
          <input className="input-field w-full" value={form.ogrn || ''} onChange={e => setForm({ ...form, ogrn: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="label">Legal address</label>
          <input className="input-field w-full" value={form.legalAddress || ''} onChange={e => setForm({ ...form, legalAddress: e.target.value })} />
        </div>
        <div className="col-span-2">
          <label className="label">Actual address</label>
          <input className="input-field w-full" value={form.actualAddress || ''} onChange={e => setForm({ ...form, actualAddress: e.target.value })} />
        </div>
        <div>
          <label className="label">Director</label>
          <input className="input-field w-full" value={form.director || ''} onChange={e => setForm({ ...form, director: e.target.value })} />
        </div>
      </div>
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}

function BankSettings({ bank, onSave, saving }: { bank: any; onSave: (b: any) => void; saving: boolean }) {
  const [form, setForm] = useState(bank || {});

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Bank details</h2>
        <p className="text-gray-500 text-sm mt-1">For issuing invoices</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Bank name</label>
          <input className="input-field w-full" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Bank code (BIK)</label>
          <input className="input-field w-full" value={form.bik || ''} onChange={e => setForm({ ...form, bik: e.target.value })} />
        </div>
        <div>
          <label className="label">Account number</label>
          <input className="input-field w-full" value={form.account || ''} onChange={e => setForm({ ...form, account: e.target.value })} />
        </div>
        <div>
          <label className="label">Correspondent account</label>
          <input className="input-field w-full" value={form.corrAccount || ''} onChange={e => setForm({ ...form, corrAccount: e.target.value })} />
        </div>
      </div>
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}

function CalendarSettings({ calendar, onSave, saving }: { calendar: any; onSave: (c: any) => void; saving: boolean }) {
  const [form, setForm] = useState(calendar || {
    workDays: [1, 2, 3, 4, 5],
    workHoursStart: '09:00',
    workHoursEnd: '18:00',
    slotDuration: 30,
  });

  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function toggleDay(day: number) {
    const days = form.workDays || [];
    if (days.includes(day)) {
      setForm({ ...form, workDays: days.filter((d: number) => d !== day) });
    } else {
      setForm({ ...form, workDays: [...days, day].sort() });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Booking schedule</h2>
        <p className="text-gray-500 text-sm mt-1">Settings for booking links</p>
      </div>
      <div>
        <label className="label">Working days</label>
        <div className="flex gap-2">
          {DAYS.map((name, i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleDay(i)}
              className={`w-10 h-10 rounded-lg font-medium text-sm ${
                (form.workDays || []).includes(i)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="label">Work start</label>
          <input type="time" className="input-field w-full" value={form.workHoursStart || '09:00'} onChange={e => setForm({ ...form, workHoursStart: e.target.value })} />
        </div>
        <div>
          <label className="label">Work end</label>
          <input type="time" className="input-field w-full" value={form.workHoursEnd || '18:00'} onChange={e => setForm({ ...form, workHoursEnd: e.target.value })} />
        </div>
        <div>
          <label className="label">Slot length (min)</label>
          <select className="input-field w-full" value={form.slotDuration || 30} onChange={e => setForm({ ...form, slotDuration: parseInt(e.target.value) })}>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
            <option value={60}>1 hour</option>
            <option value={90}>1.5 hours</option>
            <option value={120}>2 hours</option>
          </select>
        </div>
      </div>
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}

function AiSettings({ ai, onSave, saving }: { ai: any; onSave: (a: any) => void; saving: boolean }) {
  const [form, setForm] = useState(ai || { enabled: true, autoSuggest: false });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">AI assistant</h2>
        <p className="text-gray-500 text-sm mt-1">Artificial intelligence settings</p>
      </div>
      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.enabled ?? true}
            onChange={e => setForm({ ...form, enabled: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300"
          />
          <div>
            <p className="font-medium">Enable AI assistant</p>
            <p className="text-sm text-gray-500">Show the AI panel in the inbox</p>
          </div>
        </label>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.autoSuggest ?? false}
            onChange={e => setForm({ ...form, autoSuggest: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300"
          />
          <div>
            <p className="font-medium">Automatic suggestions</p>
            <p className="text-sm text-gray-500">Automatically generate suggestions when opening a chat</p>
          </div>
        </label>
      </div>
      <button type="submit" className="btn-primary" disabled={saving}>
        {saving ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}
