"use client";

import React, { useEffect, useState } from "react";
import {
  Code,
  Download,
  Layers,
  Moon,
  Save,
  Sparkles,
  Sun,
} from "lucide-react";
import { useReportBuilderStore } from "../model/useReportBuilderStore";
import { SchemaTreeExplorer } from "./SchemaTreeExplorer";
import { VisualGuiBuilder } from "./VisualGuiBuilder";
import { MonacoSqlEditor } from "./MonacoSqlEditor";
import { LiveDataPreviewTable } from "./LiveDataPreviewTable";
import { ExportModal } from "./ExportModal";
import { ExportTask, QueryMode, ThemeMode, BUILDER_CONSTANTS } from "../model/types";
import { t } from "../../../shared/locales";
import { toast } from "../../../shared/hooks/useToast";

export interface DynamicReportBuilderProps {
  engineUrl?: string;
  tenantId?: string;
  authToken?: string;
  apiKey?: string;
  theme?: "light" | "dark";
  defaultDatasourceCode?: string;
  allowedDatasources?: string[] | string;
  listDatasource?: string[] | string;
  onExportSuccess?: (task: ExportTask) => void;
}

export const DynamicReportBuilder: React.FC<DynamicReportBuilderProps> = ({
  engineUrl = "",
  tenantId = BUILDER_CONSTANTS.DEFAULT_TENANT_ID,
  authToken,
  apiKey,
  theme = ThemeMode.LIGHT,
  defaultDatasourceCode,
  allowedDatasources,
  listDatasource,
  onExportSuccess,
}) => {
  const {
    initSession,
    mode,
    setMode,
    theme: currentTheme,
    setTheme,
    saveCurrentTemplate,
    activeTemplate,
  } = useReportBuilderStore();

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState(
    activeTemplate?.templateName || BUILDER_CONSTANTS.DEFAULT_TEMPLATE_NAME
  );
  const [templateCode, setTemplateCode] = useState(
    activeTemplate?.templateCode || `RPT_${Date.now()}`
  );
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    initSession({
      engineUrl,
      tenantId,
      authToken,
      apiKey,
      theme,
      defaultDatasourceCode,
      allowedDatasources,
      listDatasource,
    });
  }, [
    engineUrl,
    tenantId,
    authToken,
    apiKey,
    theme,
    defaultDatasourceCode,
    allowedDatasources,
    listDatasource,
    initSession,
  ]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveCurrentTemplate(templateName, templateCode);
      toast.success(t("messages.templateSavedSuccess"));
    } catch (err: any) {
      toast.error(t("messages.templateSaveError") + (err.message || err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className={`flex flex-col h-screen w-full overflow-hidden ${
        currentTheme === "dark" ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Top Navigation & Mode Switcher Bar */}
      <header className="h-14 flex items-center justify-between px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md font-black text-sm">
              MR
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                <span>{t("builder.title")}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-mono rounded">
                  v4.0
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 font-mono">
                Tenant: {tenantId}
              </p>
            </div>
          </div>
        </div>

        {/* Center: Dual-Mode Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setMode(QueryMode.GUI)}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === QueryMode.GUI
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{t("builder.modeNoCode")}</span>
          </button>

          <button
            onClick={() => setMode(QueryMode.SQL)}
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              mode === QueryMode.SQL
                ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>{t("builder.modeLowCode")}</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() =>
              setTheme(currentTheme === "dark" ? "light" : "dark")
            }
            className="p-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Theme Switcher"
          >
            {currentTheme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 transition-all active:scale-95"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? t("common.saving") : t("builder.saveTemplate")}</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t("builder.exportData")}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Schema Tree Explorer */}
        <SchemaTreeExplorer />

        {/* Center / Right: Builder Canvas + Live Preview Table */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {mode === "GUI" ? <VisualGuiBuilder /> : <MonacoSqlEditor />}
          <LiveDataPreviewTable
            onOpenExportModal={() => setIsExportModalOpen(true)}
          />
        </main>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportSuccess={onExportSuccess}
      />
    </div>
  );
};
