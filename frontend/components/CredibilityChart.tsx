'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';

interface CredibilityChartProps {
  authenticPercent: number;
  confidence: number;
}

export default function CredibilityChart({
  authenticPercent,
}: CredibilityChartProps) {
  const score = Math.max(
    0,
    Math.min(100, Number(authenticPercent) || 0)
  );

  const data = [
    { name: 'Credibility', value: score },
    { name: 'Lower credibility', value: 100 - score },
  ];

  return (
    <div className="w-full">
      <div className="relative h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={72}
              startAngle={90}
              endAngle={-270}
              paddingAngle={2}
              stroke="none"
            >
              <Cell fill="#dc2626" />
              <Cell fill="#52525b" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* CENTER SCORE */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-zinc-100">
            {score}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-zinc-500">
            Credibility
          </span>
        </div>
      </div>

      <div className="flex justify-center gap-5 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-600" />
          <span className="text-zinc-400">
            Credibility {score}%
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-zinc-600" />
          <span className="text-zinc-400">
            Lower {100 - score}%
          </span>
        </div>
      </div>
    </div>
  );
}