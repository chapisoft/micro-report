"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
  X,
} from "lucide-react";
import { useReportBuilderStore } from "../model/useReportBuilderStore";
import { ExportFormat, ExportTask, QueryMode } from "../model/types";
import { PdfPrintPreviewModal } from "./PdfPrintPreviewModal";
import { t } from "../../../shared/locales";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExportSuccess?: (task: ExportTask) => void;
  customRows?: Array<Record<string, any>>;
  reportTitle?: string;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  onExportSuccess,
  customRows,
  reportTitle,
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
    previewData: storePreviewData,
  } = useReportBuilderStore();

  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.EXCEL);
  const [fileName, setFileName] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportTask | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setExportResult(null);
      setErrorMessage(null);
      setIsDownloading(false);
    }
  }, [isOpen]);

  if (!isOpen && !showPdfPreview) return null;

  const handleDownloadFile = async () => {
    if (!exportResult) return;
    setIsDownloading(true);
    try {
      await apiClient.downloadExportFile(
        exportResult.taskCode,
        exportResult.fileName
      );
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || err.message || t("messages.downloadError")
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExport = async () => {
    if (exportFormat === ExportFormat.PDF) {
      setShowPdfPreview(true);
      return;
    }

    setIsExporting(true);
    setErrorMessage(null);

    const isSqlMode = mode === QueryMode.SQL;
    const querySql = isSqlMode ? sqlQuery : convertGuiToSql();
    const configJson = !isSqlMode ? JSON.stringify(guiConfig) : undefined;

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

  const effectiveRows = (customRows && customRows.length > 0)
    ? customRows
    : (storePreviewData?.rows || []);

  const totalCalculatedRevenue = effectiveRows.reduce(
    (sum, r) => sum + Number(r.commission || r.HOA_HONG_THUC_NHAN || r.DOANH_THU || r.total_revenue || r.AMOUNT || r.SO_TIEN || 0),
    0
  );
  const totalCalculatedUnits = effectiveRows.reduce(
    (sum, r) => sum + Number(r.units || r.SO_DON_VI || r.total_count || r.total_txns || 1),
    0
  );

  const kpiStats = {
    totalRevenue: totalCalculatedRevenue,
    totalUnits: totalCalculatedUnits,
    distinctProvinces: effectiveRows.length,
    avgPerUnit: totalCalculatedUnits > 0 ? Math.round(totalCalculatedRevenue / totalCalculatedUnits) : 0,
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden text-sm animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2 font-bold text-slate-800 dark:text-slate-100">
                <Download className="w-4 h-4 text-blue-700 dark:text-blue-400" />
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
              {/* Format Selector: 3 Options (Excel, CSV, PDF) */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("export.selectFormatLabel")}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setExportFormat(ExportFormat.EXCEL)}
                    className={`flex flex-col items-center justify-center space-y-1.5 p-2.5 border rounded-xl font-medium text-xs transition-all cursor-pointer ${
                      exportFormat === ExportFormat.EXCEL
                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                    <span>Excel (.xlsx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat(ExportFormat.CSV)}
                    className={`flex flex-col items-center justify-center space-y-1.5 p-2.5 border rounded-xl font-medium text-xs transition-all cursor-pointer ${
                      exportFormat === ExportFormat.CSV
                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <FileText className="w-5 h-5 text-amber-600" />
                    <span>CSV UTF-8</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setExportFormat(ExportFormat.PDF)}
                    className={`flex flex-col items-center justify-center space-y-1.5 p-2.5 border rounded-xl font-medium text-xs transition-all cursor-pointer ${
                      exportFormat === ExportFormat.PDF
                        ? "border-blue-600 bg-blue-50/70 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 ring-2 ring-blue-500/20 font-bold"
                        : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Printer className="w-5 h-5 text-red-600" />
                    <span>PDF (A4)</span>
                  </button>
                </div>
              </div>

              {exportFormat === ExportFormat.PDF ? (
                <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-xl space-y-2 text-xs">
                  <div className="font-bold text-blue-900 dark:text-blue-200 flex items-center space-x-1.5">
                    <Printer className="w-4 h-4 text-blue-600" />
                    <span>{t("export.pdfNoticeTitle")}</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                    {t("export.pdfNoticeDesc")}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowPdfPreview(true)}
                    className="w-full py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center justify-center space-x-1.5"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{t("export.btnOpenPdfPreview")}</span>
                  </button>
                </div>
              ) : (
                /* File Name Input for Excel & CSV */
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
              )}

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

                  <button
                    type="button"
                    onClick={handleDownloadFile}
                    disabled={isDownloading}
                    className="flex items-center justify-center space-x-2 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-semibold text-xs shadow transition-all active:scale-95 cursor-pointer"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    <span>{isDownloading ? t("common.download") + "..." : t("export.downloadNow")}</span>
                  </button>

                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setExportResult(null);
                        setErrorMessage(null);
                      }}
                      className="flex-1 py-1.5 px-3 border border-emerald-300 dark:border-emerald-700/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Xuất file khác
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="py-1.5 px-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold transition-colors"
                    >
                      {t("common.close")}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {!exportResult && exportFormat !== ExportFormat.PDF && (
              <div className="flex items-center justify-end space-x-2 p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 rounded-lg text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t("common.cancel")}
                </button>

                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center space-x-2 px-5 py-2 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
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
      )}

      {/* PDF Print Preview Modal */}
      <PdfPrintPreviewModal
        isOpen={showPdfPreview}
        onClose={() => setShowPdfPreview(false)}
        title={reportTitle || guiConfig.metadata?.title || activeTemplate?.templateName || "Báo Cáo Tổng Hợp Doanh Thu & Hoa Hồng BHXH Theo Tỉnh"}
        category={guiConfig.metadata?.category || "FINANCE"}
        rows={effectiveRows}
        kpiStats={kpiStats}
      />
    </>
  );
};
