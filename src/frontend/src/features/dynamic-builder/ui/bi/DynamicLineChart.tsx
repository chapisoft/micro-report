"use client";

import React from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ReportVisualConfigDto } from "../../model/types";
import { t } from "../../../../shared/locales";

interface DynamicLineChartProps {
  data: Record<string, any>[];
  config: ReportVisualConfigDto;
}

const DEFAULT_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#06B6D4"];

export const DynamicLineChart: React.FC<DynamicLineChartProps> = ({ data, config }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-xs">
        {t("bi.noChartData")}
      </div>
    );
  }

  const xAxisKey = config.xAxisColumn || Object.keys(data[0])[0];
  const yAxisKeys =
    config.yAxisColumns && config.yAxisColumns.length > 0
      ? config.yAxisColumns
      : Object.keys(data[0]).filter((k) => k !== xAxisKey && typeof data[0][k] === "number");

  const colors = config.colorPalette || DEFAULT_COLORS;

  const formatTooltipValue = (value: any) => {
    if (typeof value === "number") {
      return new Intl.NumberFormat("vi-VN").format(value);
    }
    return value;
  };

  return (
    <div className="w-full h-80 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 30, left: 20, bottom: 25 }}>
          {config.showGrid !== false && (
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
          )}
          <XAxis
            dataKey={xAxisKey}
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={{ stroke: "#cbd5e1" }}
            interval={0}
            angle={-20}
            textAnchor="end"
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={{ stroke: "#cbd5e1" }}
            tickFormatter={(val) =>
              val >= 1000000
                ? `${(val / 1000000).toFixed(1)}M`
                : val >= 1000
                ? `${(val / 1000).toFixed(0)}k`
                : val
            }
          />
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
          {yAxisKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2.5}
              dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
