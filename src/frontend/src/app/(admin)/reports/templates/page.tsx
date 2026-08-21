"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Code,
  FileSpreadsheet,
  Layers,
  Play,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { defaultApiClient } from "@/features/dynamic-builder/api/reportBuilderApi";
import { QueryMode, ReportTemplate } from "@/features/dynamic-builder/model/types";
import { t } from "@/shared/locales";
import { toast } from "@/shared/hooks/useToast";

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const list = await defaultApiClient.getTemplates();
      setTemplates(list);
    } catch (e) {
      console.error(e);
      toast.error(t("messages.queryError"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateCode: string) => {
    try {
      setTemplates((prev) => prev.filter((tItem) => tItem.templateCode !== templateCode));
      toast.success(t("messages.deleteTemplateSuccess"));
    } catch (e: any) {
      toast.error(t("messages.deleteTemplateError") + (e.message || e));
    }
  };

  const filtered = templates.filter(
    (tItem) =>
      tItem.templateName.toLowerCase().includes(search.toLowerCase()) ||
      tItem.templateCode.toLowerCase().includes(search.toLowerCase())
  );

  const toggleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filtered.map((tItem) => tItem.templateCode)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelect = (code: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-blue-600" />
            <span>{t("templates.title")}</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t("templates.subtitle")}
          </p>
        </div>

        <Link
          href="/reports/builder"
          className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t("templates.createButton")}</span>
        </Link>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
        <div className="relative w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={t("templates.searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
          />
        </div>
      </div>

      {/* DataTable (Thứ tự cột: Checkbox -> STT -> Thao tác -> Dữ liệu) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
            <tr>
              {/* 1. Checkbox */}
              <th className="w-10 px-3 py-3 text-center">
                <input
                  aria-label={t("common.selectAll")}
                  type="checkbox"
                  checked={
                    filtered.length > 0 && selectedIds.size === filtered.length
                  }
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>

              {/* 2. STT */}
              <th className="w-14 px-3 py-3 text-center font-mono">{t("common.orderNumber")}</th>

              {/* 3. Thao tác / Hành động */}
              <th className="w-28 px-3 py-3 text-center">{t("common.actions")}</th>

              {/* 4. Các cột dữ liệu */}
              <th className="px-4 py-3 font-mono">{t("templates.colCode")}</th>
              <th className="px-4 py-3">{t("templates.colName")}</th>
              <th className="px-4 py-3 font-mono">{t("templates.colDatasource")}</th>
              <th className="px-4 py-3 text-center">{t("templates.colMode")}</th>
              <th className="px-4 py-3 text-center">{t("templates.colStatus")}</th>
              <th className="px-4 py-3 text-center">Hits</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
            {loading ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  {t("common.loading")}
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-400">
                  {t("common.noData")}
                </td>
              </tr>
            ) : (
              filtered.map((tpl, idx) => (
                <tr
                  key={tpl.templateCode}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* 1. Checkbox */}
                  <td className="px-3 py-3 text-center">
                    <input
                      aria-label={`Select ${tpl.templateName}`}
                      type="checkbox"
                      checked={selectedIds.has(tpl.templateCode)}
                      onChange={() => toggleSelect(tpl.templateCode)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>

                  {/* 2. STT */}
                  <td className="px-3 py-3 text-center text-slate-400 font-mono">
                    {idx + 1}
                  </td>

                  {/* 3. Thao tác / Hành động */}
                  <td className="px-3 py-3 text-center">
                    <div className="flex items-center justify-center space-x-1.5">
                      <Link
                        href={`/reports/builder?code=${tpl.templateCode}`}
                        className="p-1 text-slate-500 hover:text-blue-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        title={t("templates.actionRun")}
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </Link>
                      <button
                        onClick={() => handleDelete(tpl.templateCode)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                        title={t("templates.actionDelete")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* 4. Các cột dữ liệu */}
                  <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                    {tpl.templateCode}
                  </td>
                  <td className="px-4 py-3 font-sans font-medium text-slate-700 dark:text-slate-300">
                    {tpl.templateName}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {tpl.datasourceCode}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                        tpl.mode === QueryMode.GUI
                          ? "bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300"
                          : "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                      }`}
                    >
                      {tpl.mode === QueryMode.GUI ? (
                        <Layers className="w-3 h-3" />
                      ) : (
                        <Code className="w-3 h-3" />
                      )}
                      <span>{tpl.mode}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded text-[10px] font-semibold">
                      {tpl.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-slate-500 font-mono">
                    {tpl.accessCount || 0}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
