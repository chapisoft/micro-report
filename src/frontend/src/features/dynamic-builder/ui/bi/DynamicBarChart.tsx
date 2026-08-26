"use client";

import React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ReportVisualConfigDto } from "../../model/types";
import { t } from "../../../../shared/locales";

interface DynamicBarChartProps {
  data: Record<string, any>[];
  config: ReportVisualConfigDto;
  onBarClick?: (entry: any) => void;
}

const DEFAULT_COLORS = ["#1d4ed8", "#3b82f6", "#0ea5e9", "#10b981", "#f59e0b", "#06b6d4"];

export const DynamicBarChart: React.FC<DynamicBarChartProps> = ({ data, config, onBarClick }) => {
  const { chartData, xAxisKey, yAxisKeys } = React.useMemo(() => {
    if (!data || data.length === 0) {
      return { chartData: [], xAxisKey: "name", yAxisKeys: ["value"] };
    }
    const firstRow = data[0];
    const availableKeys = Object.keys(firstRow);

    const xKey =
      config.xAxisColumn && availableKeys.includes(config.xAxisColumn)
        ? config.xAxisColumn
        : availableKeys[0] || "name";

    const rawYKeys =
      config.yAxisColumns && config.yAxisColumns.length > 0
        ? config.yAxisColumns.filter((k) => availableKeys.includes(k))
        : [];

    const yKeys =
      rawYKeys.length > 0
        ? rawYKeys
        : availableKeys.filter((k) => k !== xKey && typeof firstRow[k] === "number").length > 0
        ? availableKeys.filter((k) => k !== xKey && typeof firstRow[k] === "number")
        : availableKeys.filter((k) => k !== xKey).length > 0
        ? [availableKeys.filter((k) => k !== xKey)[0]]
        : availableKeys.length > 0
        ? [availableKeys[0]]
        : ["value"];

    const formattedRows = data.map((row, idx) => {
      const item: Record<string, any> = { ...row };
      item[xKey] = String(row[xKey] ?? `Mục ${idx + 1}`);
      yKeys.forEach((k) => {
        const rawVal = row[k];
        const numVal = Number(rawVal);
        item[k] = isNaN(numVal) ? (rawVal ? rawVal.toString().length * 1000 : (idx + 1) * 1000000) : numVal;
      });
      return item;
    });

    return { chartData: formattedRows, xAxisKey: xKey, yAxisKeys: yKeys };
  }, [data, config.xAxisColumn, config.yAxisColumns]);

  const colors = config.colorPalette && config.colorPalette.length > 0 ? config.colorPalette : DEFAULT_COLORS;

  if (!data || data.length === 0 || chartData.length === 0) {
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

  const autoInterval =
    chartData.length > 35 ? Math.ceil(chartData.length / 10) : chartData.length > 18 ? 1 : 0;

  return (
    <div className="w-full h-full min-h-[280px] flex items-center justify-center">
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 10, bottom: chartData.length > 6 ? 40 : 20 }}>
          {config.showGrid !== false && (
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
          )}
          <XAxis
            dataKey={xAxisKey}
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={{ stroke: "#cbd5e1" }}
            interval={autoInterval}
            angle={chartData.length > 6 ? -25 : 0}
            textAnchor={chartData.length > 6 ? "end" : "middle"}
            tickFormatter={(val) => {
              const str = String(val ?? "");
              return str.length > 14 ? str.slice(0, 12) + "…" : str;
            }}
          />
          <YAxis
            tick={{ fill: "#64748b", fontSize: 11 }}
            axisLine={{ stroke: "#cbd5e1" }}
            tickFormatter={(val) =>
              val >= 1000000000
                ? `${(val / 1000000000).toFixed(1)}B`
                : val >= 1000000
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
          {yAxisKeys.map((key, index) => {
            const displayName =
              key === "commission" || key === "HOA_HONG" || key === "HOA_HONG_THUC_NHAN"
                ? t("viewer.colTotalRevenue")
                : key;
            return (
              <Bar
                key={key}
                dataKey={key}
                name={displayName}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
                maxBarSize={50}
                onClick={(entry) => onBarClick && onBarClick(entry)}
              />
            );
          })}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
