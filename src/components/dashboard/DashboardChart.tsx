import { useMemo } from 'react';
import { LineChart, Line, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { chartTheme } from '../../utils/chartTheme';
import { formatCurrency, formatAxisCurrency } from '../../utils/formatters';

interface DashboardChartProps {
  data: any[];
  width: number;
  height: number;
  isLoading?: boolean;
}

const DashboardChart = ({ data, width, height, isLoading }: DashboardChartProps) => {
  const lucroLineGradientId = 'lucroLineGradient';

  const chartTooltipStyles = useMemo(
    () => ({
      backgroundColor: 'rgba(3, 21, 19, 0.95)',
      border: '1px solid rgba(31, 231, 203, 0.25)',
      borderRadius: 16,
      boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
      color: '#f4fffc',
      padding: '12px 16px',
    }),
    []
  );

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data || data.length === 0) {
      return (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 text-xs font-medium text-white/60">
              Sem dados para exibir
          </div>
      );
  }

  return (
    <LineChart
      width={width}
      height={height}
      data={data}
      margin={{ top: 5, right: 30, left: 10, bottom: 10 }}
    >
      <defs>
        <linearGradient id={lucroLineGradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#35ffe4" />
          <stop offset="100%" stopColor="#1ddfd0" />
        </linearGradient>
      </defs>
      <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="4 4" vertical={false} />
      <XAxis
        dataKey="date"
        axisLine={false}
        tickLine={false}
        tick={{ ...chartTheme.axisTick, fill: 'rgba(255,255,255,0.7)' }}
        tickMargin={12}
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        width={70}
        tick={{ ...chartTheme.axisTick, fill: 'rgba(255,255,255,0.7)' }}
        tickFormatter={formatAxisCurrency}
      />
      <Tooltip
        contentStyle={chartTooltipStyles}
        itemStyle={{ color: '#1fe7cb' }}
        labelStyle={{ color: '#e8ffff', fontWeight: 600 }}
        formatter={(value: number) => [formatCurrency(value), 'Lucro diário']}
        labelFormatter={(label: string) => `Dia ${label}`}
      />
      <Line
        type="monotone"
        dataKey="diário"
        stroke={`url(#${lucroLineGradientId})`}
        strokeWidth={3}
        dot={{ r: 4, strokeWidth: 0, fill: '#38ffe4' }}
        activeDot={{ r: 6, fill: '#38ffe4', stroke: '#042620', strokeWidth: 2 }}
      />
    </LineChart>
  );
};

export default DashboardChart;
