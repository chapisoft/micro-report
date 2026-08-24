"use client";

import React, { useEffect, useState } from "react";
import { Database, Eye, Table as TableIcon, X } from "lucide-react";
import { useReportBuilderStore } from "../model/useReportBuilderStore";
import { QueryMode } from "../model/types";
import { t } from "../../../shared/locales";

interface QuickSampleModalProps {
  isOpen: boolean;
  tableName: string;
  onClose: () => void;
}

export const QuickSampleModal: React.FC<QuickSampleModalProps> = ({
  isOpen,
  tableName,
  onClose,
}) => {
  const { apiClient, activeDatasourceCode } = useReportBuilderStore();
  const [sampleRows, setSampleRows] = useState<Record<string, any>[]>([]);
  const [sampleColumns, setSampleColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !tableName || !activeDatasourceCode) return;

    const fetchSample = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiClient.previewQuery({
          datasourceCode: activeDatasourceCode,
          mode: QueryMode.SQL,
          sql: `SELECT * FROM ${tableName}`,
          limit: 10,
        });
        setSampleColumns(res.columns || []);
        setSampleRows(res.rows || []);
      } catch (err: any) {
        setError(err.message || "Lỗi tải dữ liệu mẫu");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSample();
  }, [isOpen, tableName, activeDatasourceCode, apiClient]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[80vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-2">
                <span>{t("quickSample.modalTitle")}</span>
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-xs rounded-md">
                  {tableName}
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {t("quickSample.modalSubtitle")} {tableName} ({activeDatasourceCode})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 space-y-3">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
              <p className="text-xs text-slate-500 font-medium">{t("quickSample.loading")}</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 text-xs rounded-xl border border-red-200 dark:border-red-900">
              {error}
            </div>
          ) : sampleRows.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              {t("quickSample.noData")}
            </div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[11px] font-semibold sticky top-0">
                  <tr>
                    <th className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 w-10 text-center">
                      #
                    </th>
                    {sampleColumns.map((col) => (
                      <th
                        key={col}
                        className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 font-mono"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {sampleRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-950/30 transition-colors"
                    >
                      <td className="px-3 py-2 text-center text-slate-400 text-[10px]">
                        {idx + 1}
                      </td>
                      {sampleColumns.map((col) => (
                        <td
                          key={col}
                          className="px-3 py-2 text-slate-800 dark:text-slate-200 whitespace-nowrap max-w-[200px] truncate"
                          title={String(row[col] ?? "")}
                        >
                          {row[col] === null || row[col] === undefined ? (
                            <span className="text-slate-400 italic">null</span>
                          ) : typeof row[col] === "number" ? (
                            new Intl.NumberFormat("vi-VN").format(row[col])
                          ) : (
                            String(row[col])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <span>Tự động giới hạn tối đa 10 dòng mẫu</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold transition-colors"
          >
            {t("common.close")}
          </button>
        </div>
      </div>
    </div>
  );
};
