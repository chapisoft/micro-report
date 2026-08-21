"use client";

import React, { useState } from "react";
import {
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { useReportBuilderStore } from "../model/useReportBuilderStore";
import { ExportFormat, ExportTask, QueryMode } from "../model/types";
import { t } from "../../../shared/locales";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportSuccess?: (task: ExportTask) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportSuccess,
}) => {
  const {
    apiClient,
    activeDatasourceCode,
    mode,
    sqlQuery,
    guiConfig,
    convertGuiToSql,
    queryParameters,
    activeTemplate,
  } = useReportBuilderStore();

  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.EXCEL);
  const [fileName, setFileName] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportTask | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setErrorMessage(null);
    setExportResult(null);

    const querySql = mode === QueryMode.GUI ? convertGuiToSql() : sqlQuery;
    const configJson = mode === QueryMode.GUI ? JSON.stringify(guiConfig) : "";

    const payload = {
      datasourceCode: activeDatasourceCode,
      templateId: activeTemplate?.id,
      mode,
      sql: querySql,
      configJson,
      params: queryParameters,
      fileName: fileName.trim() || undefined,
    };

    try {
      const task =
        exportFormat === ExportFormat.EXCEL
          ? await apiClient.exportExcel(payload)
          : await apiClient.exportCsv(payload);

      setExportResult(task);
      setIsExporting(false);
      if (onExportSuccess) {
        onExportSuccess(task);
      }
    } catch (err: any) {
      setIsExporting(false);
      setErrorMessage(
        err.response?.data?.message || err.message || t("messages.exportError")
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-100">
            <Download className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{t("export.title")}</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded"
            title={t("common.close")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Format Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t("export.formatExcel")}:
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setExportFormat(ExportFormat.EXCEL)}
                className={`flex items-center justify-center space-x-2 p-3 border rounded-xl font-medium text-xs transition-all ${
                  exportFormat === ExportFormat.EXCEL
                    ? "border-blue-600 bg-blue-50/60 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={() => setExportFormat(ExportFormat.CSV)}
                className={`flex items-center justify-center space-x-2 p-3 border rounded-xl font-medium text-xs transition-all ${
                  exportFormat === ExportFormat.CSV
                    ? "border-blue-600 bg-blue-50/60 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-2 ring-blue-500/20"
                    : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>CSV UTF-8 (.csv)</span>
              </button>
            </div>
          </div>

          {/* File Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {t("export.fileNameLabel")} ({t("common.info")}):
            </label>
            <input
              type="text"
              placeholder={t("export.fileNamePlaceholder")}
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Success State */}
          {exportResult && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl space-y-3">
              <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
                <CheckCircle className="w-4 h-4" />
                <span>{t("export.exportSuccess")}</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1 font-mono">
                <p>File: {exportResult.fileName}</p>
                <p>{t("export.totalRows")}: {exportResult.rowCount?.toLocaleString()}</p>
                <p>{t("export.fileSize")}: {Math.round((exportResult.fileSizeBytes || 0) / 1024)} KB</p>
              </div>

              <a
                href={exportResult.downloadUrl || `/api/v1/reports/export/download/${exportResult.taskCode}`}
                download
                className="flex items-center justify-center space-x-2 w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs shadow transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{t("export.downloadNow")}</span>
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        {!exportResult && (
          <div className="flex items-center justify-end space-x-2 p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {t("common.cancel")}
            </button>

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center space-x-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow transition-all active:scale-95"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t("common.processing")}</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>{t("export.startExport")}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
