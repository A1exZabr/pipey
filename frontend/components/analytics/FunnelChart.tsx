'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface FunnelStage {
  stageName: string;
  dealCount: number;
  totalValue: number;
}

interface FunnelData {
  pipelineId: string;
  pipelineName: string;
  stages: FunnelStage[];
}

interface FunnelChartProps {
  data: FunnelData[];
}

const COLORS = ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function FunnelChart({ data }: FunnelChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400">
        No data
      </div>
    );
  }

  const pipeline = data[0];
  const chartData = pipeline.stages.map((stage, i) => ({
    name: stage.stageName,
    deals: stage.dealCount,
    revenue: stage.totalValue,
    color: COLORS[i % COLORS.length],
  }));

  return (
    <div>
      {data.length > 1 && (
        <p className="text-sm text-gray-500 mb-3">{pipeline.pipelineName}</p>
      )}
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value: any, name: any) => [
              name === 'revenue' ? `${Number(value).toLocaleString('ru-RU')} ₽` : value,
              name,
            ]}
          />
          <Bar dataKey="deals" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
