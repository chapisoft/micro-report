"use client";

import React, { useState } from "react";
import {
  AlertCircle,
  Clock,
  Download,
  Eye,
  FileSpreadsheet,
  Layers,
  Play,
  RotateCcw,
  X,
} from "lucide-react";
import { useReportBuilderStore } from "../model/useReportBuilderStore";
import { t } from "../../../shared/locales";

interface LiveDataPreviewTableProps {
  onOpenExportModal?: () => void;
}

export const LiveDataPreviewTable: React.FC<LiveDataPreviewTableProps> = ({
  onOpenExportModal,
}) => {
  const {
    previewData,
    isLoadingPreview,
    errorMessage,
    runPreview,
    clearPreview,
  } = useReportBuilderStore();

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [activeDetailRow, setActiveDetailRow] = useState<Record<string, any> | null>(null);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked && previewData?.rows) {
      setSelectedRows(new Set(previewData.rows.map((_, i) => i)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleToggleRow = (index: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const allSelected =
    previewData?.rows &&
    previewData.rows.length > 0 &&
    selectedRows.size === previewData.rows.length;

  return (
    <div className="h-72 flex flex-col bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
      {/* Table Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <button
            onClick={runPreview}
            disabled={isLoadingPreview}
            className="flex items-center space-x-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            {isLoadingPreview ? (
              <div className="animate-spin w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current" />
            )}
            <span>{t("builder.runQuery")}</span>
          </button>

          {previewData && (
            <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>{previewData.executionTimeMs}ms</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                <span>{previewData.rows.length} {t("preview.rowCount")}</span>
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {previewData && (
            <button
              onClick={clearPreview}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
              title={t("common.cancel")}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}

          {onOpenExportModal && (
            <button
              onClick={onOpenExportModal}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t("export.title")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message Banner */}
      {errorMessage && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-mono">{errorMessage}</span>
        </div>
      )}

      {/* Main DataTable (Tuân thủ thứ tự cột: Checkbox -> STT -> Thao tác -> Dữ liệu) */}
      <div className="flex-1 overflow-auto">
        {!previewData ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <FileSpreadsheet className="w-8 h-8 text-slate-300 dark:text-slate-700" />
            <p className="text-xs">
              {t("preview.emptyRowsHint")}
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 z-10 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                {/* 1. Cột Checkbox */}
                <th className="w-10 px-3 py-2 text-center">
                  <input
                    aria-label={t("common.selectAll")}
                    type="checkbox"
                    checked={allSelected}
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>

                {/* 2. Cột STT */}
                <th className="w-14 px-3 py-2 text-center font-mono">{t("common.orderNumber")}</th>

                {/* 3. Cột Thao tác / Hành động */}
                <th className="w-20 px-3 py-2 text-center">{t("common.actions")}</th>

                {/* 4. Các cột dữ liệu */}
                {previewData.columns.map((col) => (
                  <th key={col} className="px-4 py-2 font-mono truncate">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {previewData.rows.map((row, idx) => {
                const isSelected = selectedRows.has(idx);

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      isSelected
                        ? "bg-blue-50/50 dark:bg-blue-900/10"
                        : idx % 2 === 0
                        ? "bg-white dark:bg-slate-900"
                        : "bg-slate-50/40 dark:bg-slate-900/40"
                    }`}
                  >
                    {/* 1. Checkbox */}
                    <td className="px-3 py-2 text-center">
                      <input
                        aria-label={`Row ${idx + 1}`}
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleRow(idx)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>

                    {/* 2. STT */}
                    <td className="px-3 py-2 text-center text-slate-400">
                      {idx + 1}
                    </td>

                    {/* 3. Thao tác / Hành động */}
                    <td className="px-3 py-2 text-center">
                      <button
                        title={t("common.detail")}
                        onClick={() => setActiveDetailRow(row)}
                        className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>

                    {/* 4. Các cột dữ liệu */}
                    {previewData.columns.map((col) => {
                      const val = row[col];
                      return (
                        <td
                          key={col}
                          className="px-4 py-2 text-slate-700 dark:text-slate-300 truncate max-w-xs"
                        >
                          {val !== null && val !== undefined
                            ? typeof val === "object"
                              ? JSON.stringify(val)
                              : String(val)
                            : <span className="text-slate-300 dark:text-slate-600 italic">null</span>}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Row Detail View Modal */}
      {activeDetailRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">
                {t("preview.detailRowTitle")}
              </h3>
              <button
                onClick={() => setActiveDetailRow(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <pre className="p-3 bg-slate-50 dark:bg-slate-950 border rounded-lg text-xs font-mono overflow-auto max-h-80">
              {JSON.stringify(activeDetailRow, null, 2)}
            </pre>
            <div className="flex justify-end">
              <button
                onClick={() => setActiveDetailRow(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-xs font-semibold"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
