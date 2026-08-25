"use client";

import React, { useState } from "react";
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Sliders,
  TrendingUp,
} from "lucide-react";
import { DynamicBarChart } from "./DynamicBarChart";
import { DynamicLineChart } from "./DynamicLineChart";
import { DynamicPieChart } from "./DynamicPieChart";
import { KpiCard } from "./KpiCard";
import { ChartType, ReportVisualConfigDto } from "../../model/types";
import { t } from "../../../../shared/locales";

interface BiDashboardViewProps {
  data: Record<string, any>[];
  columns: string[];
}

export const BiDashboardView: React.FC<BiDashboardViewProps> = ({ data, columns }) => {
  const numericCols = columns.filter((col) =>
    data.some((row) => typeof row[col] === "number" || (!isNaN(Number(row[col])) && row[col] !== ""))
  );
  const categoryCols = columns.filter((col) => !numericCols.includes(col));

  const [visualConfig, setVisualConfig] = useState<ReportVisualConfigDto>({
    chartType: ChartType.BAR,
    xAxisColumn: categoryCols[0] || columns[0] || "",
    yAxisColumns: numericCols.length > 0 ? [numericCols[0]] : [columns[1] || columns[0] || ""],
    categoryColumn: categoryCols[0] || columns[0] || "",
    valueColumn: numericCols[0] || columns[1] || columns[0] || "",
    kpiTitle: "Tổng Doanh Thu / Chỉ Số Chính",
    kpiSubtitle: "Số liệu tổng hợp tự động",
    kpiValueColumn: numericCols[0] || columns[0] || "",
    kpiAggregation: "SUM",
    kpiFormat: "CURRENCY",
    showLegend: true,
    showGrid: true,
  });

  const [showConfigPanel, setShowConfigPanel] = useState(false);

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs space-y-2">
        <BarChart3 className="w-8 h-8 text-slate-300 dark:text-slate-700" />
        <p>{t("bi.noChartData")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full space-y-3 p-4 overflow-y-auto">
      {/* Top Toolbar: Chart Type Selector & Settings */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setVisualConfig((prev) => ({ ...prev, chartType: ChartType.BAR }))}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              visualConfig.chartType === ChartType.BAR
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>{t("bi.barChart")}</span>
          </button>

          <button
            onClick={() => setVisualConfig((prev) => ({ ...prev, chartType: ChartType.LINE }))}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              visualConfig.chartType === ChartType.LINE
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>{t("bi.lineChart")}</span>
          </button>

          <button
            onClick={() => setVisualConfig((prev) => ({ ...prev, chartType: ChartType.PIE }))}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              visualConfig.chartType === ChartType.PIE
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <PieChartIcon className="w-3.5 h-3.5" />
            <span>{t("bi.pieChart")}</span>
          </button>

          <button
            onClick={() => setVisualConfig((prev) => ({ ...prev, chartType: ChartType.KPI }))}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              visualConfig.chartType === ChartType.KPI
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t("bi.kpiCard")}</span>
          </button>
        </div>

        <button
          onClick={() => setShowConfigPanel(!showConfigPanel)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
            showConfigPanel
              ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
              : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{t("bi.configVisual")}</span>
        </button>
      </div>

      {/* Optional Configuration Controls */}
      {showConfigPanel && (
        <div className="p-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {/* X Axis / Category */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {visualConfig.chartType === ChartType.PIE ? t("bi.categoryCol") : t("bi.xAxis")}
            </label>
            <select
              value={visualConfig.xAxisColumn || ""}
              onChange={(e) =>
                setVisualConfig((prev) => ({
                  ...prev,
                  xAxisColumn: e.target.value,
                  categoryColumn: e.target.value,
                }))
              }
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Y Axis / Value */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {visualConfig.chartType === ChartType.PIE ? t("bi.valueCol") : t("bi.yAxis")}
            </label>
            <select
              value={visualConfig.yAxisColumns?.[0] || visualConfig.valueColumn || ""}
              onChange={(e) =>
                setVisualConfig((prev) => ({
                  ...prev,
                  yAxisColumns: [e.target.value],
                  valueColumn: e.target.value,
                  kpiValueColumn: e.target.value,
                }))
              }
              className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
            >
              {columns.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* KPI Aggregation & Format */}
          {visualConfig.chartType === ChartType.KPI && (
            <div className="flex space-x-2">
              <div className="flex-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("bi.kpiAggregation")}
                </label>
                <select
                  value={visualConfig.kpiAggregation || "SUM"}
                  onChange={(e) =>
                    setVisualConfig((prev) => ({
                      ...prev,
                      kpiAggregation: e.target.value as any,
                    }))
                  }
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="SUM">SUM (Tổng)</option>
                  <option value="COUNT">COUNT (Đếm số lượng)</option>
                  <option value="AVG">AVG (Trung bình)</option>
                  <option value="MAX">MAX (Lớn nhất)</option>
                  <option value="MIN">MIN (Nhỏ nhất)</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t("bi.kpiFormat")}
                </label>
                <select
                  value={visualConfig.kpiFormat || "CURRENCY"}
                  onChange={(e) =>
                    setVisualConfig((prev) => ({
                      ...prev,
                      kpiFormat: e.target.value as any,
                    }))
                  }
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <option value="CURRENCY">Tiền tệ (VNĐ)</option>
                  <option value="NUMBER">Số nguyên / Thập phân</option>
                  <option value="PERCENT">Phần trăm (%)</option>
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Chart Canvas */}
      <div className="flex-1 min-h-[300px] flex items-center justify-center">
        {visualConfig.chartType === ChartType.BAR && (
          <DynamicBarChart data={data} config={visualConfig} />
        )}
        {visualConfig.chartType === ChartType.LINE && (
          <DynamicLineChart data={data} config={visualConfig} />
        )}
        {visualConfig.chartType === ChartType.PIE && (
          <DynamicPieChart data={data} config={visualConfig} />
        )}
        {visualConfig.chartType === ChartType.KPI && (
          <div className="w-full max-w-xl">
            <KpiCard data={data} config={visualConfig} />
          </div>
        )}
      </div>
    </div>
  );
};
