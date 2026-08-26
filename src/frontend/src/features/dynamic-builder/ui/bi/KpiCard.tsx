"use client";

import React from "react";
import { Activity, ArrowUpRight, DollarSign, Hash, TrendingUp } from "lucide-react";
import { ReportVisualConfigDto } from "../../model/types";
import { t } from "../../../../shared/locales";

interface KpiCardProps {
  data: Record<string, any>[];
  config: ReportVisualConfigDto;
}

export const KpiCard: React.FC<KpiCardProps> = ({ data, config }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
        {t("bi.noChartData")}
      </div>
    );
  }

  const title = config.kpiTitle || t("bi.kpiTitle");
  const subtitle = config.kpiSubtitle || t("bi.kpiBasedOnRows").replace("{count}", String(data.length));
  const agg = config.kpiAggregation || "SUM";
  const format = config.kpiFormat || "CURRENCY";

  const valueCol =
    config.kpiValueColumn ||
    config.valueColumn ||
    Object.keys(data[0]).find((k) => typeof data[0][k] === "number") ||
    Object.keys(data[0])[0];

  let rawValue = 0;
  const values = data.map((r) => Number(r[valueCol]) || 0);

  if (agg === "COUNT") {
    rawValue = data.length;
  } else if (agg === "AVG") {
    rawValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  } else if (agg === "MAX") {
    rawValue = values.length > 0 ? Math.max(...values) : 0;
  } else if (agg === "MIN") {
    rawValue = values.length > 0 ? Math.min(...values) : 0;
  } else {
    // SUM
    rawValue = values.reduce((a, b) => a + b, 0);
  }

  let formattedValue = "";
  if (format === "CURRENCY") {
    formattedValue = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    }).format(rawValue);
  } else if (format === "PERCENT") {
    formattedValue = `${(rawValue * 100).toFixed(1)}%`;
  } else {
    formattedValue = new Intl.NumberFormat("vi-VN").format(rawValue);
  }

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-2xl pointer-events-none" />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            {format === "CURRENCY" ? (
              <DollarSign className="w-5 h-5" />
            ) : agg === "COUNT" ? (
              <Hash className="w-5 h-5" />
            ) : (
              <TrendingUp className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {title}
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 rounded-full text-xs font-semibold">
          <ArrowUpRight className="w-3.5 h-3.5" />
          <span>{agg} ({valueCol})</span>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          {formattedValue}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span className="flex items-center space-x-1">
          <Activity className="w-3 h-3 text-blue-500" />
          <span>{t("bi.kpiAutoCalculated")}</span>
        </span>
        <span className="font-mono text-slate-500">{t("bi.totalRowsFootnote").replace("{count}", String(data.length))}</span>
      </div>
    </div>
  );
};
