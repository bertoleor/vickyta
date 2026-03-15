"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface WeeklyChartProps {
  readonly data: ReadonlyArray<{
    readonly day: string;
    readonly dayName: string;
    readonly amount: number;
    readonly type: 'gasto' | 'ingreso';
  }>;
}

const COLORS = {
  gasto: "#EF4444",
  ingreso: "#10B981",
};

export function WeeklyBarChart({ data }: WeeklyChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-text-muted text-sm">
        No hay datos suficientes
      </div>
    );
  }

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data as any[]} barCategoryGap="30%">
          <XAxis 
            dataKey="dayName" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            dy={5}
          />
          <YAxis 
            hide 
            domain={[0, 'dataMax + 1000']}
          />
          <Tooltip 
            formatter={(value: number) => [`$${value.toLocaleString('es-AR')}`, 'Monto']}
            cursor={{ fill: 'rgba(0,0,0,0.05)' }}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: 'none',
              borderRadius: '12px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}
          />
          <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
            {data.map((entry) => (
              <Cell 
                key={`cell-${entry.day}`} 
                fill={entry.type === 'gasto' ? COLORS.gasto : COLORS.ingreso}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
