'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import Link from 'next/link';

interface Stats {
  contacts: number;
  deals: number;
  won: number;
  revenue: number;
}

interface Deal {
  id: string;
  title: string;
  value: string;
  notes: string | null;
  createdAt: string;
  contact: { id: string; name: string; email: string } | null;
  stage: { id: string; name: string; color: string };
}

interface Stage {
  id: string;
  name: string;
  color: string;
}

type DatePreset = 'today' | 'week' | 'month' | 'all' | 'custom';

function getDateRange(preset: DatePreset): { start: Date | null; end: Date | null } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case 'today':
      return { start: today, end: now };
    case 'week':
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - 7);
      return { start: weekStart, end: now };
    case 'month':
      const monthStart = new Date(today);
      monthStart.setDate(today.getDate() - 30);
      return { start: monthStart, end: now };
    case 'all':
    default:
      return { start: null, end: null };
  }
}

function formatDateShort(date: Date): string {
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ contacts: 0, deals: 0, won: 0, revenue: 0 });
  const [allDeals, setAllDeals] = useState<Deal[]>([]);
  const [recentDeals, setRecentDeals] = useState<Deal[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);

  // Date filtering state
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | null>(null);
  const [customEndDate, setCustomEndDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Recalculate stats when date filter changes
    if (allDeals.length > 0) {
      calculateStats(allDeals);
    }
  }, [datePreset, customStartDate, customEndDate, allDeals]);

  function filterDealsByDate(deals: Deal[]): Deal[] {
    let start: Date | null;
    let end: Date | null;

    if (datePreset === 'custom') {
      start = customStartDate;
      end = customEndDate;
    } else {
      const range = getDateRange(datePreset);
      start = range.start;
      end = range.end;
    }

    if (!start && !end) return deals;

    return deals.filter((deal) => {
      const dealDate = new Date(deal.createdAt);
      if (start && dealDate < start) return false;
      if (end && dealDate > end) return false;
      return true;
    });
  }

  function calculateStats(deals: Deal[]) {
    const filteredDeals = filterDealsByDate(deals);
    const wonDeals = filteredDeals.filter((d) => d.stage?.name?.toLowerCase().includes('won'));
    const revenue = wonDeals.reduce((sum, d) => sum + (parseFloat(d.value) || 0), 0);

    setStats({
      contacts: contacts.length,
      deals: filteredDeals.length,
      won: wonDeals.length,
      revenue,
    });

    setRecentDeals(filteredDeals.slice(0, 5));
  }

  async function loadData() {
    try {
      const [contactsData, deals, pipelines] = await Promise.all([
        api.getContacts(),
        api.getDeals(),
        api.getPipelines(),
      ]);

      setAllDeals(deals);
      setContacts(contactsData);

      const wonDeals = deals.filter((d: any) => d.stage?.name?.toLowerCase().includes('won'));
      const revenue = wonDeals.reduce((sum: number, d: any) => sum + (parseFloat(d.value) || 0), 0);

      setStats({
        contacts: contactsData.length,
        deals: deals.length,
        won: wonDeals.length,
        revenue,
      });

      setRecentDeals(deals.slice(0, 5));

      // Load stages for the first pipeline
      if (pipelines.length > 0) {
        const pipelineData = await api.getDealsByPipeline(pipelines[0].id);
        setStages(pipelineData.stages.map((s: any) => ({ id: s.id, name: s.name, color: s.color })));
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  function handlePresetChange(preset: DatePreset) {
    setDatePreset(preset);
    if (preset !== 'custom') {
      setCustomStartDate(null);
      setCustomEndDate(null);
    }
  }

  function handleCustomDateSelect(start: Date, end: Date) {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setDatePreset('custom');
    setShowDatePicker(false);
  }

  function getDateFilterLabel(): string {
    if (datePreset === 'custom' && customStartDate && customEndDate) {
      return `${formatDateShort(customStartDate)} - ${formatDateShort(customEndDate)}`;
    }
    switch (datePreset) {
      case 'today': return 'Today';
      case 'week': return 'Week';
      case 'month': return 'Month';
      default: return 'All time';
    }
  }

  async function handleUpdateDeal(id: string, data: { title?: string; value?: number; notes?: string; stageId?: string }) {
    try {
      await api.updateDeal(id, data);
      await loadData();
      setEditingDeal(null);
    } catch (error) {
      console.error('Failed to update deal:', error);
    }
  }

  async function handleDeleteDeal(dealId: string) {
    if (!confirm('Delete this deal?')) return;
    try {
      await api.deleteDeal(dealId);
      await loadData();
      setEditingDeal(null);
    } catch (error) {
      console.error('Failed to delete deal:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening.</p>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="glass-card rounded-xl p-1 flex items-center gap-1">
            <button
              onClick={() => handlePresetChange('today')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                datePreset === 'today'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-black/5'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handlePresetChange('week')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                datePreset === 'week'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-black/5'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => handlePresetChange('month')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                datePreset === 'month'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-black/5'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => handlePresetChange('all')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                datePreset === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 hover:bg-black/5'
              }`}
            >
              All
            </button>
          </div>
          <button
            onClick={() => setShowDatePicker(true)}
            className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
              datePreset === 'custom'
                ? 'bg-blue-500 text-white'
                : 'glass-card text-gray-600 hover:bg-black/5'
            }`}
          >
            <CalendarIcon className="w-4 h-4" />
            {datePreset === 'custom' ? getDateFilterLabel() : 'Select dates'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total contacts"
          value={stats.contacts.toString()}
          icon={<ContactsIcon />}
          color="blue"
        />
        <StatCard
          title="Active deals"
          value={stats.deals.toString()}
          icon={<DealsIcon />}
          color="purple"
        />
        <StatCard
          title="Won"
          value={stats.won.toString()}
          icon={<WonIcon />}
          color="green"
        />
        <StatCard
          title="Revenue"
          value={formatCurrency(stats.revenue)}
          icon={<RevenueIcon />}
          color="orange"
        />
      </div>

      {/* Quick Actions & Recent Deals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="text-lg font-semibold mb-4">Quick actions</h2>
          <div className="space-y-3">
            <Link href="/contacts?new=true" className="btn-primary w-full flex items-center justify-center gap-2">
              <PlusIcon className="w-5 h-5" />
              New contact
            </Link>
            <Link href="/pipeline?new=true" className="btn-secondary w-full flex items-center justify-center gap-2">
              <PlusIcon className="w-5 h-5" />
              New deal
            </Link>
          </div>
        </div>

        {/* Recent Deals */}
        <div className="glass-card rounded-2xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent deals</h2>
            <Link href="/pipeline" className="text-blue-500 text-sm font-medium hover:underline">
              All deals
            </Link>
          </div>

          {recentDeals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No deals yet</p>
              <Link href="/pipeline?new=true" className="text-blue-500 font-medium hover:underline">
                Create your first deal
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDeals.map((deal) => (
                <div
                  key={deal.id}
                  onClick={() => setEditingDeal(deal)}
                  className="flex items-center justify-between p-3 rounded-xl bg-black/[0.02] hover:bg-black/[0.04] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: deal.stage?.color || '#6B7280' }}
                    />
                    <div>
                      <p className="font-medium">{deal.title}</p>
                      <p className="text-sm text-gray-500">{deal.contact?.name || 'No contact'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatCurrency(parseFloat(deal.value) || 0)}</p>
                    <p className="text-sm text-gray-500">{deal.stage?.name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Deal Modal */}
      {editingDeal && (
        <EditDealModal
          deal={editingDeal}
          stages={stages}
          contacts={contacts}
          onClose={() => setEditingDeal(null)}
          onSave={(data) => handleUpdateDeal(editingDeal.id, data)}
          onDelete={() => handleDeleteDeal(editingDeal.id)}
        />
      )}

      {/* Date Picker Modal */}
      {showDatePicker && (
        <DatePickerModal
          initialStart={customStartDate}
          initialEnd={customEndDate}
          onClose={() => setShowDatePicker(false)}
          onSelect={handleCustomDateSelect}
        />
      )}
    </div>
  );
}

function EditDealModal({
  deal,
  stages,
  contacts,
  onClose,
  onSave,
  onDelete,
}: {
  deal: Deal;
  stages: Stage[];
  contacts: any[];
  onClose: () => void;
  onSave: (data: { title?: string; value?: number; notes?: string; stageId?: string }) => void;
  onDelete: () => void;
}) {
  const [title, setTitle] = useState(deal.title);
  const [value, setValue] = useState(deal.value || '');
  const [notes, setNotes] = useState(deal.notes || '');
  const [stageId, setStageId] = useState(deal.stage?.id || '');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      value: value ? parseFloat(value) : undefined,
      notes: notes || undefined,
      stageId: stageId !== deal.stage?.id ? stageId : undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-lg m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Edit deal</h2>
          <button
            onClick={onDelete}
            className="p-2 rounded-lg hover:bg-red-50 transition-colors"
            title="Delete deal"
          >
            <TrashIcon className="w-5 h-5 text-red-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Deal title"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="input-field"
                placeholder="100000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
              <select
                value={stageId}
                onChange={(e) => setStageId(e.target.value)}
                className="input-field"
              >
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contact</label>
            <div className="input-field bg-gray-50 text-gray-600">
              {deal.contact?.name || deal.contact?.email || 'No contact'}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes and comments</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[150px] resize-none"
              placeholder="Add notes, comments, communication history..."
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) {
  const colors = {
    blue: 'from-blue-500 to-cyan-400',
    purple: 'from-purple-500 to-pink-400',
    green: 'from-green-500 to-emerald-400',
    orange: 'from-orange-500 to-amber-400',
  };

  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-semibold mt-1">{value}</p>
        </div>
        <div className={'w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white ' + colors[color as keyof typeof colors]}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

// Icons
function ContactsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function DealsIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function WonIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function RevenueIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  );
}

function DatePickerModal({
  initialStart,
  initialEnd,
  onClose,
  onSelect,
}: {
  initialStart: Date | null;
  initialEnd: Date | null;
  onClose: () => void;
  onSelect: (start: Date, end: Date) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(initialStart);
  const [endDate, setEndDate] = useState<Date | null>(initialEnd);
  const [selectingEnd, setSelectingEnd] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function getDaysInMonth(date: Date): (Date | null)[] {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of the month
    let firstDayOfWeek = firstDay.getDay();
    // Convert Sunday (0) to 7 for Monday-first week
    firstDayOfWeek = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;
    for (let i = 1; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }

  function handleDayClick(date: Date) {
    if (!selectingEnd || !startDate) {
      setStartDate(date);
      setEndDate(null);
      setSelectingEnd(true);
    } else {
      if (date < startDate) {
        setEndDate(startDate);
        setStartDate(date);
      } else {
        setEndDate(date);
      }
      setSelectingEnd(false);
    }
  }

  function isInRange(date: Date): boolean {
    if (!startDate || !endDate) return false;
    return date >= startDate && date <= endDate;
  }

  function isSelected(date: Date): boolean {
    if (startDate && date.toDateString() === startDate.toDateString()) return true;
    if (endDate && date.toDateString() === endDate.toDateString()) return true;
    return false;
  }

  function isToday(date: Date): boolean {
    return date.toDateString() === new Date().toDateString();
  }

  function handleSubmit() {
    if (startDate && endDate) {
      onSelect(startDate, endDate);
    } else if (startDate) {
      onSelect(startDate, startDate);
    }
  }

  function prevMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  }

  function nextMonth() {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  }

  const days = getDaysInMonth(currentMonth);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative glass-card rounded-2xl p-6 w-full max-w-sm m-4">
        <h2 className="text-lg font-semibold mb-4">Select a period</h2>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 rounded-lg hover:bg-black/5 transition-colors"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <span className="font-medium">
            {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button
            onClick={nextMonth}
            className="p-2 rounded-lg hover:bg-black/5 transition-colors"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Day Names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {days.map((date, index) => (
            <div key={index} className="aspect-square">
              {date ? (
                <button
                  onClick={() => handleDayClick(date)}
                  className={`w-full h-full rounded-lg text-sm font-medium transition-colors ${
                    isSelected(date)
                      ? 'bg-blue-500 text-white'
                      : isInRange(date)
                      ? 'bg-blue-100 text-blue-700'
                      : isToday(date)
                      ? 'bg-gray-100 text-gray-900'
                      : 'hover:bg-black/5 text-gray-700'
                  }`}
                >
                  {date.getDate()}
                </button>
              ) : (
                <div />
              )}
            </div>
          ))}
        </div>

        {/* Selected Range Display */}
        <div className="mt-4 p-3 rounded-xl bg-gray-50 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Start:</span>
            <span className="font-medium text-gray-900">
              {startDate ? startDate.toLocaleDateString('en-US') : '—'}
            </span>
          </div>
          <div className="flex justify-between text-gray-600 mt-1">
            <span>End:</span>
            <span className="font-medium text-gray-900">
              {endDate ? endDate.toLocaleDateString('en-US') : '—'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-4">
          <button onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="btn-primary flex-1"
            disabled={!startDate}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
