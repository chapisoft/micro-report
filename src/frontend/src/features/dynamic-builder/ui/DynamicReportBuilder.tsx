"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  Code,
  Download,
  ExternalLink,
  Layers,
  Layout,
  Monitor,
  Moon,
  RotateCcw,
  Save,
  Sun,
} from "lucide-react";
import { useReportBuilderStore } from "../model/useReportBuilderStore";
import { SchemaTreeExplorer } from "./SchemaTreeExplorer";
import { VisualGuiBuilder } from "./VisualGuiBuilder";
import { MonacoSqlEditor } from "./MonacoSqlEditor";
import { LiveDataPreviewTable } from "./LiveDataPreviewTable";
import { BiDashboardView } from "./bi/BiDashboardView";
import { StandaloneReportViewer } from "./StandaloneReportViewer";
import { ExportModal } from "./ExportModal";
import { EmbedSdkModal } from "./EmbedSdkModal";
import { PartnerAuthModal } from "./PartnerAuthModal";
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
  tenantId,
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
    convertGuiToSql,
    datasources,
    activeDatasourceCode,
  } = useReportBuilderStore();

  const selectedDatasource = datasources.find((d) => d.datasourceCode === activeDatasourceCode);


  const [activeView, setActiveView] = useState<"builder" | "bi" | "viewer">("builder");
  const [currentTenant, setCurrentTenant] = useState<string>(tenantId || "");
  const [currentApiKey, setCurrentApiKey] = useState<string | undefined>(apiKey);
  const [currentAuthToken, setCurrentAuthToken] = useState<string | undefined>(authToken);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isEmbedModalOpen, setIsEmbedModalOpen] = useState(false);
  const [templateName, setTemplateName] = useState(
    activeTemplate?.templateName || BUILDER_CONSTANTS.DEFAULT_TEMPLATE_NAME
  );
  const [templateCode, setTemplateCode] = useState(
    activeTemplate?.templateCode || `BC_DOANH_THU_BHXH_TINH`
  );
  const [isSaving, setIsSaving] = useState(false);
  const isInitializedRef = React.useRef(false);

  useEffect(() => {
    // 1. Kiểm tra thông tin xác thực từ props hoặc localStorage
    const savedTenant = typeof window !== "undefined" ? localStorage.getItem("report_tenant_id") : null;
    const savedApiKey = typeof window !== "undefined" ? localStorage.getItem("report_api_key") : null;
    const savedAuthToken = typeof window !== "undefined" ? localStorage.getItem("report_auth_token") : null;

    const effectiveTenant = tenantId || savedTenant;
    const effectiveApiKey = apiKey || (savedApiKey || undefined);
    const effectiveAuthToken = authToken || (savedAuthToken || undefined);

    if (!effectiveTenant) {
      setIsAuthModalOpen(true);
      return;
    }

    setCurrentTenant(effectiveTenant);
    setCurrentApiKey(effectiveApiKey);
    setCurrentAuthToken(effectiveAuthToken);
    setIsAuthModalOpen(false);

    if (!isInitializedRef.current) {
      isInitializedRef.current = true;
      initSession({
        engineUrl,
        tenantId: effectiveTenant,
        authToken: effectiveAuthToken,
        apiKey: effectiveApiKey,
        theme,
        defaultDatasourceCode,
        allowedDatasources,
        listDatasource,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    engineUrl,
    tenantId,
    authToken,
    apiKey,
    theme,
    defaultDatasourceCode,
  ]);


  const handleAuthenticate = async (credentials: {
    tenantId: string;
    apiKey?: string;
    authToken?: string;
  }): Promise<boolean> => {
    try {
      await initSession({
        engineUrl,
        tenantId: credentials.tenantId,
        authToken: credentials.authToken,
        apiKey: credentials.apiKey,
        theme,
        defaultDatasourceCode,
        allowedDatasources,
        listDatasource,
      });

      setCurrentTenant(credentials.tenantId);
      setCurrentApiKey(credentials.apiKey);
      setCurrentAuthToken(credentials.authToken);
      setIsAuthModalOpen(false);

      if (typeof window !== "undefined") {
        localStorage.setItem("report_tenant_id", credentials.tenantId);
        if (credentials.apiKey) localStorage.setItem("report_api_key", credentials.apiKey);
        if (credentials.authToken) localStorage.setItem("report_auth_token", credentials.authToken);
      }

      toast.success(t("auth.authSuccess"));
      return true;
    } catch (err: any) {
      toast.error(t("auth.invalidCredentials"));
      return false;
    }
  };

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("report_tenant_id");
      localStorage.removeItem("report_api_key");
      localStorage.removeItem("report_auth_token");
    }
    setCurrentTenant("");
    setCurrentApiKey(undefined);
    setCurrentAuthToken(undefined);
    setIsAuthModalOpen(true);
  };

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

  const [previewHeight, setPreviewHeight] = useState<number>(320);
  const isDraggingRef = React.useRef(false);
  const startYRef = React.useRef(0);
  const startHeightRef = React.useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startYRef.current = e.clientY;
    startHeightRef.current = previewHeight;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDraggingRef.current) return;
    const deltaY = startYRef.current - e.clientY;
    const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, 140), window.innerHeight - 160);
    setPreviewHeight(newHeight);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={`flex flex-col h-screen w-full overflow-hidden ${
        currentTheme === "dark" ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* Modal Yêu Cầu Xác Thực Đối Tác */}
      <PartnerAuthModal
        isOpen={isAuthModalOpen}
        initialTenantId={currentTenant}
        onAuthenticate={handleAuthenticate}
      />

      {/* TOPBAR NAVIGATION THEO NGUYÊN MẪU PROTOTYPE V2 */}
      <header className="h-14 min-h-[56px] flex items-center justify-between px-4 lg:px-5 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 z-20 shadow-xs gap-3 overflow-x-auto">
        {/* Left: Brand Section */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center font-extrabold text-xs shadow-xs tracking-tight shrink-0">
            MR
          </div>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap">
                Hệ Thống Báo Cáo Động
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 tracking-wider whitespace-nowrap">
                ĐỐI TÁC: {currentTenant || "DIP_BHXH"}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse shrink-0" />
              <span className="truncate max-w-[200px]">
                {selectedDatasource?.name || "Oracle XE (DIP Core OLTP)"} &bull; Chỉ Đọc (Read-Only)
              </span>
            </div>
          </div>
        </div>

        {/* Center: 3 Top-Level View Switchers */}
        <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 gap-0.5 shrink-0">
          <button
            onClick={() => setActiveView("builder")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
              activeView === "builder"
                ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Layout className="w-3.5 h-3.5 shrink-0" />
            <span>Thiết Kế Báo Cáo</span>
          </button>

          <button
            onClick={() => setActiveView("bi")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
              activeView === "bi"
                ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 shrink-0" />
            <span>Cấu Hình Trực Quan BI</span>
          </button>

          <button
            onClick={() => setActiveView("viewer")}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all ${
              activeView === "viewer"
                ? "bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Monitor className="w-3.5 h-3.5 shrink-0" />
            <span>Xem Trước Báo Cáo (End-User)</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() =>
              setTheme(currentTheme === "dark" ? "light" : "dark")
            }
            className="w-8 h-8 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors border border-slate-200 dark:border-slate-700 shrink-0 cursor-pointer"
            title="Chuyển đổi giao diện Sáng / Tối"
          >
            {currentTheme === "dark" ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={() => setIsEmbedModalOpen(true)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs transition-all whitespace-nowrap cursor-pointer"
            title="Mã nhúng SDK & Iframe"
          >
            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            <span>Mã Nhúng (SDK)</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center space-x-1 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 shrink-0" />
            <span>{isSaving ? t("common.saving") : "Lưu Mẫu"}</span>
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Xuất Dữ Liệu</span>
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE VIEW ROUTER */}
      {activeView === "viewer" ? (
        /* VIEW 3: CLEAN STANDALONE REPORT VIEWER (END-USER) */
        <div className="flex-1 overflow-y-auto bg-slate-100 dark:bg-slate-950 p-5">
          <div className="max-w-[1440px] mx-auto">
            <StandaloneReportViewer
              engineUrl={engineUrl}
              tenantId={currentTenant}
              templateCode={templateCode}
              authToken={currentAuthToken}
              theme={currentTheme}
              onExportSuccess={onExportSuccess}
            />
          </div>
        </div>
      ) : (
        /* VIEW 1 & VIEW 2: STUDIO WORKSPACE */
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Schema Tree Explorer */}
          <SchemaTreeExplorer />

          {/* Center: Workspace Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            {activeView === "bi" ? (
              /* VIEW 2: BI VISUAL CONFIGURATOR */
              <div className="flex-1 overflow-y-auto p-5 bg-slate-50 dark:bg-slate-950">
                <div className="max-w-[1440px] mx-auto">
                  <BiDashboardView onSwitchToViewer={() => setActiveView("viewer")} />
                </div>
              </div>
            ) : (
              /* VIEW 1: DUAL-MODE REPORT BUILDER STUDIO */
              <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                {/* Dual-Mode Sub-bar */}
                <div className="flex items-center justify-between px-5 py-2 bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0 flex-wrap gap-2">
                  <div className="flex items-center bg-white dark:bg-slate-800 p-0.5 rounded border border-slate-200 dark:border-slate-700 gap-0.5 shrink-0">
                    <button
                      onClick={() => setMode(QueryMode.GUI)}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                        mode === QueryMode.GUI
                          ? "bg-blue-700 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>No-Code GUI Builder</span>
                    </button>

                    <button
                      onClick={() => setMode(QueryMode.SQL)}
                      className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold whitespace-nowrap transition-all ${
                        mode === QueryMode.SQL
                          ? "bg-blue-700 text-white shadow-xs"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      <span>Low-Code Monaco SQL</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => {
                        convertGuiToSql();
                        setMode(QueryMode.SQL);
                        toast.success("Đã đồng bộ GUI sang câu lệnh SQL AST!");
                      }}
                      className="flex items-center space-x-1 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 rounded border border-slate-200 dark:border-slate-700 shadow-xs transition-colors whitespace-nowrap"
                      title="Biên dịch giao diện GUI sang Monaco SQL"
                    >
                      <RotateCcw className="w-3 h-3 text-blue-600" />
                      <span>Đồng Bộ GUI ➔ SQL</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50 dark:bg-slate-950 p-5">
                  <div className="max-w-[1440px] mx-auto">
                    {mode === QueryMode.GUI ? <VisualGuiBuilder /> : <MonacoSqlEditor />}
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      )}


      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExportSuccess={onExportSuccess}
      />

      {/* Embed SDK Modal */}
      <EmbedSdkModal
        isOpen={isEmbedModalOpen}
        onClose={() => setIsEmbedModalOpen(false)}
        tenantId={currentTenant}
        templateCode={templateCode}
      />
    </div>
  );
};
