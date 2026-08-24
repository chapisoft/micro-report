"use client";

import React from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { ReportVisualConfigDto } from "../../model/types";
import { t } from "../../../../shared/locales";

interface DynamicPieChartProps {
  data: Record<string, any>[];
  config: ReportVisualConfigDto;
}

const DEFAULT_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4", "#64748B"];

export const DynamicPieChart: React.FC<DynamicPieChartProps> = ({ data, config }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
        {t("bi.noChartData")}
      </div>
    );
  }

  const categoryKey = config.categoryColumn || config.xAxisColumn || Object.keys(data[0])[0];
  const valueKey =
    config.valueColumn ||
    (config.yAxisColumns && config.yAxisColumns[0]) ||
    Object.keys(data[0]).find((k) => k !== categoryKey && typeof data[0][k] === "number") ||
    Object.keys(data[0])[1];

  const colors = config.colorPalette || DEFAULT_COLORS;

  const chartData = data.map((row) => ({
    name: String(row[categoryKey] ?? "N/A"),
    value: typeof row[valueKey] === "number" ? row[valueKey] : Number(row[valueKey]) || 0,
  }));

  const formatTooltipValue = (value: any) => {
    if (typeof value === "number") {
      return new Intl.NumberFormat("vi-VN").format(value);
    }
    return value;
  };

  return (
    <div className="w-full h-80 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }: any) =>
              `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
            }
            outerRadius={100}
            innerRadius={45}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={formatTooltipValue}
            contentStyle={{
              backgroundColor: "rgba(15, 23, 42, 0.95)",
              borderColor: "#334155",
              borderRadius: "0.5rem",
              color: "#f8fafc",
              fontSize: "12px",
            }}
          />
          {config.showLegend !== false && <Legend wrapperStyle={{ fontSize: "12px" }} />}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
