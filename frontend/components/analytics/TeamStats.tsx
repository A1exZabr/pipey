'use client';

interface TeamMemberStat {
  userId: string;
  userName?: string | null;
  userEmail: string;
  role: string;
  totalDeals?: number;
  closedDeals?: number;
  totalRevenue?: number;
}

interface TeamStatsProps {
  data: TeamMemberStat[];
}

export default function TeamStats({ data }: TeamStatsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-24 text-gray-400">
        No data
      </div>
    );
  }

  const maxRevenue = Math.max(...data.map((m) => m.totalRevenue || 0), 1);

  return (
    <div className="space-y-3">
      {data.map((member) => (
        <div key={member.userId} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {(member.userName || member.userEmail).charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{member.userName || member.userEmail}</p>
                {member.totalDeals !== undefined && (
                  <p className="text-xs text-gray-400">{member.closedDeals} / {member.totalDeals} deals</p>
                )}
              </div>
            </div>
            {member.totalRevenue !== undefined && (
              <span className="font-semibold text-gray-700">
                {member.totalRevenue.toLocaleString('ru-RU')} ₽
              </span>
            )}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 rounded-full transition-all"
              style={{ width: `${((member.totalRevenue || 0) / maxRevenue) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
