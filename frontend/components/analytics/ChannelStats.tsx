'use client';

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ChannelStat {
  channel: string;
  conversations: number;
  messages: number;
}

interface ChannelStatsProps {
  data: ChannelStat[];
}

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#8b5cf6'];

const CHANNEL_LABELS: Record<string, string> = {
  telegram: 'Telegram',
  max: 'MAX',
  avito: 'Avito',
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
};

export default function ChannelStats({ data }: ChannelStatsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        No data
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: CHANNEL_LABELS[item.channel] || item.channel,
    value: item.conversations,
    messages: item.messages,
  }));

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: any) => [value, 'Conversations']} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-2">
        {data.map((item, i) => (
          <div key={item.channel} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span>{CHANNEL_LABELS[item.channel] || item.channel}</span>
            </div>
            <div className="flex gap-4 text-gray-500">
              <span>{item.conversations} conv.</span>
              <span>{item.messages} msg.</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
