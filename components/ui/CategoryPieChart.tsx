"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useMemo } from "react";

interface CategoryChartProps {
  data: Array<{
    category_name: string;
    total: number;
  }>;
  colors?: string[];
}

const DEFAULT_COLORS = [
  "#8B5CF6", // Violet
  "#EC4899", // Pink
  "#F59E0B", // Amber
  "#10B981", // Emerald
  "#3B82F6", // Blue
  "#EF4444", // Red
  "#06B6D4", // Cyan
  "#84CC16", // Lime
];

export function CategoryPieChart({ data, colors = DEFAULT_COLORS }: Readonly<CategoryChartProps>) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map((item, index) => ({
      id: `cat-${index}-${item.category_name}`,
      name: item.category_name,
      value: item.total,
      color: colors[index % colors.length],
    }));
  }, [data, colors]);

  const total = useMemo(() => {
    return chartData.reduce((sum, item) => sum + item.value, 0);
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-text-muted">
        No hay datos suficientes
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {chartData.map((entry) => (
                <Cell key={entry.id} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => [`$${value.toLocaleString('es-AR')}`, 'Monto']}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      {/* Center total */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          <p className="text-xs text-text-muted font-medium">Total</p>
          <p className="text-lg font-bold text-text-primary">
            ${total.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {chartData.slice(0, 6).map((item, index) => (
          <div key={item.name} className="flex items-center gap-2 text-xs">
            <div 
              className={`w-3 h-3 rounded-full flex-shrink-0 bg-chart-${index % 8}`} 
            />
            <span className="text-text-secondary truncate">{item.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
