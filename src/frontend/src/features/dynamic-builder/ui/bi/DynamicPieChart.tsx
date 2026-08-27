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
  onPieClick?: (entry: any) => void;
}

const DEFAULT_COLORS = ["#1d4ed8", "#3b82f6", "#0ea5e9", "#06b6d4", "#10b981", "#f59e0b", "#6366f1"];

export const DynamicPieChart: React.FC<DynamicPieChartProps> = ({ data, config, onPieClick }) => {
  const hasData = data && data.length > 0;
  const firstRow = hasData ? data[0] : {};
  const categoryKey = config.categoryColumn || config.xAxisColumn || Object.keys(firstRow)[0] || "";
  const valueKey =
    config.valueColumn ||
    (config.yAxisColumns && config.yAxisColumns[0]) ||
    Object.keys(firstRow).find((k) => k !== categoryKey && typeof firstRow[k] === "number") ||
    Object.keys(firstRow)[1] ||
    categoryKey;

  const colors = config.colorPalette && config.colorPalette.length > 0 ? config.colorPalette : DEFAULT_COLORS;

  const chartData = React.useMemo(() => {
    if (!hasData) return [];
    return data.map((row, idx) => {
      const raw = row[valueKey];
      const num = Number(raw);
      return {
        name: String(row[categoryKey] ?? `Mục ${idx + 1}`),
        value: isNaN(num) ? (raw ? raw.toString().length * 1000 : idx + 1) : num,
      };
    });
  }, [data, hasData, categoryKey, valueKey]);

  if (!hasData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
        {t("bi.noChartData")}
      </div>
    );
  }

  const formatTooltipValue = (value: any) => {
    if (typeof value === "number") {
      return new Intl.NumberFormat("vi-VN").format(value);
    }
    return value;
  };

  return (
    <div className="w-full h-full min-h-[280px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <Pie
            data={chartData}
            cx="50%"
            cy="45%"
            labelLine={false}
            label={({ percent }: any) =>
              (percent ?? 0) > 0.05 ? `${((percent ?? 0) * 100).toFixed(0)}%` : ""
            }
            outerRadius={80}
            innerRadius={44}
            paddingAngle={3}
            dataKey="value"
            onClick={(entry) => onPieClick && onPieClick(entry)}
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
          {config.showLegend !== false && (
            <Legend
              wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
              formatter={(value) => (
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {value}
                </span>
              )}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
