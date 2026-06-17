'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import FunnelChart from '@/components/analytics/FunnelChart';
import RevenueChart from '@/components/analytics/RevenueChart';
import ChannelStats from '@/components/analytics/ChannelStats';
import TeamStats from '@/components/analytics/TeamStats';

type GroupBy = 'day' | 'week' | 'month';

const PERIOD_OPTIONS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: 'Year', days: 365 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState(30);
  const [groupBy, setGroupBy] = useState<GroupBy>('month');
  const [funnel, setFunnel] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAll();
  }, [period, groupBy]);

  async function loadAll() {
    setLoading(true);
    const to = new Date().toISOString();
    const from = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString();
    try {
      const [f, r, c, t] = await Promise.all([
        api.getAnalyticsFunnel({ from, to }),
        api.getAnalyticsRevenue({ from, to, groupBy }),
        api.getAnalyticsChannels({ from, to }),
        api.getAnalyticsTeam({ from, to }),
      ]);
      setFunnel(f);
      setRevenue(r);
      setChannels(c);
      setTeam(t);
    } catch {
      // Silently handle
    } finally {
      setLoading(false);
    }
  }

  const totalRevenue = revenue.reduce((sum: number, r: any) => sum + (r.revenue || 0), 0);
  const totalDeals = team.reduce((sum: number, m: any) => sum + (m.totalDeals || 0), 0);
  const totalConversations = channels.reduce((sum: number, c: any) => sum + (c.conversations || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">Sales and activity statistics</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setPeriod(opt.days)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === opt.days
                    ? 'bg-white shadow-sm text-gray-900'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-2xl font-semibold mt-1">
            {loading ? '—' : `${totalRevenue.toLocaleString('en-US')} ₽`}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm text-gray-500">Deals</p>
          <p className="text-2xl font-semibold mt-1">
            {loading ? '—' : totalDeals}
          </p>
        </div>
        <div className="glass-card rounded-2xl p-5">
          <p className="text-sm text-gray-500">Conversations</p>
          <p className="text-2xl font-semibold mt-1">
            {loading ? '—' : totalConversations}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Sales funnel</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <FunnelChart data={funnel} />
          )}
        </div>

        {/* Revenue */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Revenue</h2>
            <div className="flex gap-1">
              {(['day', 'week', 'month'] as GroupBy[]).map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupBy(g)}
                  className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                    groupBy === g
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {g === 'day' ? 'Day' : g === 'week' ? 'Wk' : 'Mo'}
                </button>
              ))}
            </div>
          </div>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <RevenueChart data={revenue} groupBy={groupBy} />
          )}
        </div>

        {/* Channels */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Channels</h2>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ChannelStats data={channels} />
          )}
        </div>

        {/* Team */}
        <div className="glass-card rounded-2xl p-5">
          <h2 className="font-semibold mb-4">Team</h2>
          {loading ? (
            <div className="h-24 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <TeamStats data={team} />
          )}
        </div>
      </div>
    </div>
  );
}
