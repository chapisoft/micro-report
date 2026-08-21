"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckCircle,
  Database,
  Play,
  RefreshCw,
  Server,
  Zap,
} from "lucide-react";
import { defaultApiClient } from "@/features/dynamic-builder/api/reportBuilderApi";
import { t } from "@/shared/locales";
import { toast } from "@/shared/hooks/useToast";

export default function DwhSyncDashboardPage() {
  const [datasourceCode, setDatasourceCode] = useState("DIP_DWH");
  const [tableName, setTableName] = useState("FACT_PAYMENTS");
  const [fromDate, setFromDate] = useState("2026-08-01");
  const [toDate, setToDate] = useState("2026-08-21");
  const [refreshMv, setRefreshMv] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleTriggerSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await defaultApiClient.manualDwhSync({
        datasourceCode,
        tableName,
        fromDate,
        toDate,
        refreshMaterializedViews: refreshMv,
      });
      setSyncStatus(res.message);
      toast.success(t("messages.dwhSyncSuccess"));
    } catch (e: any) {
      const errText = t("messages.dwhSyncError") + (e.message || e);
      setSyncStatus(errText);
      toast.error(errText);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
          <Server className="w-5 h-5 text-blue-600" />
          <span>{t("dwh.title")}</span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t("dwh.subtitle")}
        </p>
      </div>

      {/* Sync Schedules Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Batch Sync Periodic</span>
            <RefreshCw className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono">
            Every 60 Min
          </p>
          <p className="text-[11px] text-slate-400">
            Lookback 2h automated catch-up.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Nightly Reconcile</span>
            <Calendar className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono">
            00:30 AM Daily
          </p>
          <p className="text-[11px] text-slate-400">
            24h full reconcile & revenue audits.
          </p>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span>Materialized Views</span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono">
            Every 15 Min
          </p>
          <p className="text-[11px] text-slate-400">
            Fast query aggregated cache refresh.
          </p>
        </div>
      </div>

      {/* Manual Sync Form */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl space-y-4">
        <h2 className="font-semibold text-sm text-slate-800 dark:text-slate-200 flex items-center space-x-2">
          <Database className="w-4 h-4 text-emerald-500" />
          <span>{t("dwh.manualTitle")}</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <label className="font-medium text-slate-600 dark:text-slate-400">
              {t("dwh.selectDatasource")}:
            </label>
            <input
              type="text"
              value={datasourceCode}
              onChange={(e) => setDatasourceCode(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-600 dark:text-slate-400">
              {t("dwh.tableNameOptional")}:
            </label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-600 dark:text-slate-400">
              {t("dwh.fromDate")}:
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="font-medium text-slate-600 dark:text-slate-400">
              {t("dwh.toDate")}:
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg font-mono"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <input
            id="chkMv"
            type="checkbox"
            checked={refreshMv}
            onChange={(e) => setRefreshMv(e.target.checked)}
            className="rounded text-blue-600"
          />
          <label htmlFor="chkMv" className="text-slate-700 dark:text-slate-300 cursor-pointer">
            {t("dwh.refreshMvCheckbox")}
          </label>
        </div>

        <button
          onClick={handleTriggerSync}
          disabled={isSyncing}
          className="flex items-center space-x-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow transition-all active:scale-95"
        >
          {isSyncing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{t("common.processing")}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{t("dwh.triggerButton")}</span>
            </>
          )}
        </button>

        {syncStatus && (
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono text-slate-700 dark:text-slate-300 flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{syncStatus}</span>
          </div>
        )}
      </div>
    </div>
  );
}
