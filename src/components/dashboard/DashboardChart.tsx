import { useMemo } from 'react';
import { LineChart, Line, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { chartTheme } from '../../utils/chartTheme';
import { formatCurrency, formatAxisCurrency } from '../../utils/formatters';
import { ChartSkeleton } from '../skeletons/ChartSkeleton';
import type { EvolucaoBancaChartItem } from '../../types/dashboard';

interface DashboardChartProps {
  data: EvolucaoBancaChartItem[];
  width: number;
  height: number;
  isLoading?: boolean;
}

const DashboardChart = ({ data, width, height, isLoading }: DashboardChartProps) => {
  const lucroLineGradientId = 'lucroLineGradient';

  const chartTooltipStyles = useMemo(
    () => ({
      backgroundColor: chartTheme.colors.tooltipBg,
      border: `1px solid ${chartTheme.colors.tooltipBorder}`,
      borderRadius: 16,
      boxShadow: chartTheme.colors.tooltipShadow,
      color: chartTheme.colors.text,
      padding: '12px 16px',
    }),
    []
  );

  if (isLoading) {
    return <ChartSkeleton />;
  }

  if (!data || data.length === 0) {
      return (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-gray-300 text-xs font-medium text-gray-500 dark:border-white/10 dark:text-white/60">
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
          <stop offset="0%" stopColor="var(--success)" stopOpacity={0.8} />
          <stop offset="100%" stopColor="var(--success)" stopOpacity={1} />
        </linearGradient>
      </defs>
      <CartesianGrid stroke={chartTheme.colors.grid} strokeDasharray="4 4" vertical={false} />
      <XAxis
        dataKey="date"
        axisLine={false}
        tickLine={false}
        tick={{ ...chartTheme.axisTick, fill: chartTheme.colors.axis }}
        tickMargin={12}
      />
      <YAxis
        axisLine={false}
        tickLine={false}
        width={70}
        tick={{ ...chartTheme.axisTick, fill: chartTheme.colors.axis }}
        tickFormatter={formatAxisCurrency}
      />
      <Tooltip
        contentStyle={chartTooltipStyles}
        itemStyle={{ color: 'var(--success)' }}
        labelStyle={{ color: chartTheme.colors.tooltipLabel, fontWeight: 600 }}
        formatter={(value: number) => [formatCurrency(value), 'Lucro diário']}
        labelFormatter={(label: string) => `Dia ${label}`}
      />
      <Line
        type="monotone"
        dataKey="diário"
        stroke={`url(#${lucroLineGradientId})`}
        strokeWidth={3}
        dot={{ r: 4, strokeWidth: 0, fill: 'var(--success)' }}
        activeDot={{ r: 6, fill: 'var(--success)', stroke: chartTheme.colors.axis, strokeWidth: 2 }}
      />
    </LineChart>
  );
};

export default DashboardChart;
