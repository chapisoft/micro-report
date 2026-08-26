"use client";

import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Check,
  Eye,
  FileText,
  Printer,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { BUILDER_CONSTANTS } from "../model/types";
import { t } from "../../../shared/locales";

export interface PdfPrintPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  category?: string;
  tenantName?: string;
  appliedFilters?: Record<string, string>;
  rows: Array<Record<string, any>>;
  columns?: string[];
  kpiStats?: {
    totalRevenue: number;
    totalUnits: number;
    distinctProvinces: number;
    avgPerUnit: number;
  };
}

export const PdfPrintPreviewModal: React.FC<PdfPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  title,
  tenantName = BUILDER_CONSTANTS.DEFAULT_TENANT_NAME,
  appliedFilters = {},
  rows = [],
  kpiStats: propKpiStats,
}) => {
  // View states
  const [orientation, setOrientation] = useState<"portrait" | "landscape">("portrait");
  const [showCustomizer, setShowCustomizer] = useState(false);

  // Customizable content states
  const [customTenantName, setCustomTenantName] = useState<string>(tenantName);
  const [customTitle, setCustomTitle] = useState<string>(title || t("pdf.defaultReportTitle"));
  const [customReportNumber, setCustomReportNumber] = useState<string>(BUILDER_CONSTANTS.DEFAULT_REPORT_NUMBER);
  const [customPeriodFrom, setCustomPeriodFrom] = useState<string>(appliedFilters.fromDate || "-");
  const [customPeriodTo, setCustomPeriodTo] = useState<string>(appliedFilters.toDate || "-");
  const [customLocation, setCustomLocation] = useState<string>(t("pdf.defaultLocation"));

  // Signer names states
  const [signerName, setSignerName] = useState<string>(BUILDER_CONSTANTS.DEFAULT_SIGNER_NAME);
  const [accountantName, setAccountantName] = useState<string>(BUILDER_CONSTANTS.DEFAULT_ACCOUNTANT_NAME);
  const [directorName, setDirectorName] = useState<string>(BUILDER_CONSTANTS.DEFAULT_DIRECTOR_NAME);

  // Signer title/role states (fully customizable per AGENTS.md Zero-Hardcode)
  const [signerTitle, setSignerTitle] = useState<string>(BUILDER_CONSTANTS.DEFAULT_SIGNER_TITLE);
  const [accountantTitle, setAccountantTitle] = useState<string>(BUILDER_CONSTANTS.DEFAULT_ACCOUNTANT_TITLE);
  const [directorTitle, setDirectorTitle] = useState<string>(BUILDER_CONSTANTS.DEFAULT_DIRECTOR_TITLE);

  // Section visibility toggles
  const [showNationalHeader, setShowNationalHeader] = useState(true);
  const [showKpiCards, setShowKpiCards] = useState(true);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showMetaBadge, setShowMetaBadge] = useState(true);

  // Format Helpers
  const formatCurrency = (val: any) => {
    if (val === null || val === undefined || isNaN(Number(val))) return "0 ₫";
    return new Intl.NumberFormat("vi-VN").format(Number(val)) + " ₫";
  };

  const formatNumber = (val: any) => {
    if (val === null || val === undefined || isNaN(Number(val))) return "0";
    return new Intl.NumberFormat("vi-VN").format(Number(val));
  };

  // Generic extraction of row data
  const extractRowData = (r: Record<string, any>, idx: number) => {
    const name =
      r.name ||
      r.TEN_TINH ||
      r.TINH ||
      r.TEN_DON_VI ||
      r.LOAI_HO_SO ||
      r.dossier_type ||
      r.MA_DAI_LY ||
      r.agent_user_id ||
      t("pdf.unitFallback").replace("{index}", String(idx + 1));

    const revenue = Number(
      r.commission ??
      r.HOA_HONG_THUC_NHAN ??
      r.DOANH_THU ??
      r.total_revenue ??
      r.total_commission ??
      r.AMOUNT ??
      r.SO_TIEN ??
      r.value ??
      0
    );

    const units = Number(
      r.units ??
      r.SO_DON_VI ??
      r.total_count ??
      r.total_txns ??
      r.SO_LUONG ??
      1
    );

    const notes = r.DANH_GIA || r.notes || r.status || t("pdf.noteMatched");

    return { name, revenue, units, notes };
  };

  // Process rows dynamically from props
  const processedRows = useMemo(() => {
    return (rows || []).map((r, idx) => extractRowData(r, idx));
  }, [rows]);

  const totalCalculatedRevenue = useMemo(() => {
    return processedRows.reduce((sum, r) => sum + r.revenue, 0);
  }, [processedRows]);

  const totalCalculatedUnits = useMemo(() => {
    return processedRows.reduce((sum, r) => sum + r.units, 0);
  }, [processedRows]);

  const kpiStats = useMemo(() => {
    if (propKpiStats && propKpiStats.totalRevenue > 0) return propKpiStats;
    const avg = totalCalculatedUnits > 0 ? Math.round(totalCalculatedRevenue / totalCalculatedUnits) : 0;
    return {
      totalRevenue: totalCalculatedRevenue,
      totalUnits: totalCalculatedUnits,
      distinctProvinces: processedRows.length,
      avgPerUnit: avg,
    };
  }, [propKpiStats, totalCalculatedRevenue, totalCalculatedUnits, processedRows.length]);

  const handleResetDefaults = () => {
    setCustomTenantName(tenantName || BUILDER_CONSTANTS.DEFAULT_TENANT_NAME);
    setCustomTitle(title || t("pdf.defaultReportTitle"));
    setCustomReportNumber(BUILDER_CONSTANTS.DEFAULT_REPORT_NUMBER);
    setCustomPeriodFrom(appliedFilters.fromDate || "-");
    setCustomPeriodTo(appliedFilters.toDate || "-");
    setCustomLocation(t("pdf.defaultLocation"));
    setSignerName(BUILDER_CONSTANTS.DEFAULT_SIGNER_NAME);
    setAccountantName(BUILDER_CONSTANTS.DEFAULT_ACCOUNTANT_NAME);
    setDirectorName(BUILDER_CONSTANTS.DEFAULT_DIRECTOR_NAME);
    setSignerTitle(BUILDER_CONSTANTS.DEFAULT_SIGNER_TITLE);
    setAccountantTitle(BUILDER_CONSTANTS.DEFAULT_ACCOUNTANT_TITLE);
    setDirectorTitle(BUILDER_CONSTANTS.DEFAULT_DIRECTOR_TITLE);
    setShowNationalHeader(true);
    setShowKpiCards(true);
    setShowSignatures(true);
    setShowMetaBadge(true);
  };

  if (!isOpen) return null;

  const currentDate = new Date();
  const dateStr = t("pdf.locationDate")
    .replace("{location}", customLocation || t("pdf.defaultLocation"))
    .replace("{day}", String(currentDate.getDate()))
    .replace("{month}", String(currentDate.getMonth() + 1))
    .replace("{year}", String(currentDate.getFullYear()));

  const handlePrint = () => {
    window.print();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-sm overflow-y-auto">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-document-root,
          #print-document-root * {
            visibility: visible !important;
          }
          #print-document-root {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print-area {
            display: none !important;
          }
          @page {
            size: ${orientation === "portrait" ? "A4 portrait" : "A4 landscape"};
            margin: 12mm 15mm 15mm 15mm;
          }
        }
      `}</style>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-6xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden font-sans animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar (Screen Only) */}
        <div className="no-print-area flex items-center justify-between px-6 py-3.5 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex-wrap gap-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                <span>{t("pdf.modalTitle")}</span>
                <span className="text-[10px] px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded font-semibold uppercase">
                  {t("pdf.badgeAdministrative")}
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                {t("pdf.printSubtitleDesc")}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 flex-wrap">
            {/* Toggle Customizer Drawer Button */}
            <button
              type="button"
              onClick={() => setShowCustomizer(!showCustomizer)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                showCustomizer
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 ring-2 ring-blue-500/20"
                  : "border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{t("pdf.btnCustomize")}</span>
            </button>

            {/* Orientation Toggle */}
            <div className="flex items-center space-x-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => setOrientation("portrait")}
                className={`px-3 py-1 rounded font-semibold transition-all cursor-pointer ${
                  orientation === "portrait"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {t("pdf.portrait")}
              </button>
              <button
                type="button"
                onClick={() => setOrientation("landscape")}
                className={`px-3 py-1 rounded font-semibold transition-all cursor-pointer ${
                  orientation === "landscape"
                    ? "bg-slate-900 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
                }`}
              >
                {t("pdf.landscape")}
              </button>
            </div>

            {/* Print / Save PDF Button */}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-1.5 px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{t("pdf.btnPrint")}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area with Optional Customizer Drawer */}
        <div className="flex-1 flex overflow-hidden">
          {/* Customizer Sidebar Panel (Screen Only) */}
          {showCustomizer && (
            <div className="no-print-area w-80 bg-slate-50 dark:bg-slate-900/90 border-r border-slate-200 dark:border-slate-800 p-4 overflow-y-auto space-y-5 text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center space-x-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t("pdf.customizerTitle")}</span>
                </div>
                <button
                  type="button"
                  onClick={handleResetDefaults}
                  className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                  title={t("pdf.btnResetCustom")}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Group 1: General Info */}
              <div className="space-y-2.5">
                <label className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-wider">
                  {t("pdf.customizerGroup1")}
                </label>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500">{t("pdf.labelTenantName")}:</span>
                  <input
                    type="text"
                    value={customTenantName}
                    onChange={(e) => setCustomTenantName(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-500">{t("pdf.labelReportTitle")}:</span>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200 focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">{t("pdf.labelReportNumber")}:</span>
                    <input
                      type="text"
                      value={customReportNumber}
                      onChange={(e) => setCustomReportNumber(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">{t("pdf.labelLocation")}:</span>
                    <input
                      type="text"
                      value={customLocation}
                      onChange={(e) => setCustomLocation(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">{t("pdf.labelPeriodFrom")}:</span>
                    <input
                      type="text"
                      value={customPeriodFrom}
                      onChange={(e) => setCustomPeriodFrom(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">{t("pdf.labelPeriodTo")}:</span>
                    <input
                      type="text"
                      value={customPeriodTo}
                      onChange={(e) => setCustomPeriodTo(e.target.value)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Group 2: Signers — tên + chức danh, 100% tự chỉnh được */}
              <div className="space-y-2.5">
                <label className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-wider">
                  {t("pdf.customizerGroup2")}
                </label>

                {/* Signer 1 */}
                <div className="space-y-1 rounded border border-slate-200 dark:border-slate-700 p-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">①</span>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">{t("pdf.labelSignerTitle1")}:</span>
                    <input
                      type="text"
                      value={signerTitle}
                      onChange={(e) => setSignerTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">{t("pdf.labelSigner1")}:</span>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Signer 2 */}
                <div className="space-y-1 rounded border border-slate-200 dark:border-slate-700 p-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">②</span>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">{t("pdf.labelSignerTitle2")}:</span>
                    <input
                      type="text"
                      value={accountantTitle}
                      onChange={(e) => setAccountantTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">{t("pdf.labelSigner2")}:</span>
                    <input
                      type="text"
                      value={accountantName}
                      onChange={(e) => setAccountantName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>

                {/* Signer 3 */}
                <div className="space-y-1 rounded border border-slate-200 dark:border-slate-700 p-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">③</span>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">{t("pdf.labelSignerTitle3")}:</span>
                    <input
                      type="text"
                      value={directorTitle}
                      onChange={(e) => setDirectorTitle(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500">{t("pdf.labelSigner3")}:</span>
                    <input
                      type="text"
                      value={directorName}
                      onChange={(e) => setDirectorName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Section Visibility Toggles */}
              <div className="space-y-2">
                <label className="font-bold text-slate-800 dark:text-slate-200 uppercase text-[10px] tracking-wider">
                  {t("pdf.customizerGroup3")} {t("pdf.labelSectionVisibility")}
                </label>

                <div className="space-y-1.5 pt-0.5">
                  <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showNationalHeader}
                      onChange={(e) => setShowNationalHeader(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>{t("pdf.toggleNationalHeader")}</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showKpiCards}
                      onChange={(e) => setShowKpiCards(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>{t("pdf.toggleKpiCards")}</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showSignatures}
                      onChange={(e) => setShowSignatures(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>{t("pdf.toggleSignatures")}</span>
                  </label>

                  <label className="flex items-center space-x-2 cursor-pointer text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={showMetaBadge}
                      onChange={(e) => setShowMetaBadge(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>{t("pdf.toggleMetaBadge")}</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Scrollable Paper Canvas */}
          <div className="flex-1 overflow-y-auto p-6 bg-slate-200/80 dark:bg-slate-950 flex justify-center">
            <div
              id="print-document-root"
              className={`bg-white text-black shadow-xl border border-slate-400 p-10 transition-all font-sans leading-normal ${
                orientation === "portrait" ? "w-[210mm] min-h-[297mm]" : "w-[297mm] min-h-[210mm]"
              }`}
              style={{ color: "#000000" }}
            >
              {/* Header: Đơn Vị Chủ Quản & Quốc Hiệu Chuẩn Văn Bản Nhà Nước */}
              <div className="grid grid-cols-12 gap-4 pb-4 border-b border-black">
                <div className="col-span-6 text-left space-y-1">
                  <div className="font-bold text-xs uppercase tracking-wider text-black">
                    {customTenantName}
                  </div>
                  <div className="text-[11px] text-black">
                    {t("pdf.systemSubtitle")}
                  </div>
                  <div className="text-[11px] text-black">
                    {t("pdf.reportNumberLabel")} <b>{customReportNumber}</b>
                  </div>
                </div>

                {showNationalHeader && (
                  <div className="col-span-6 text-center space-y-0.5">
                    <div className="font-bold text-xs uppercase tracking-wider text-black">
                      {t("pdf.nationalHeader")}
                    </div>
                    <div className="font-bold text-[11px] text-black">
                      {t("pdf.nationalMotto")}
                    </div>
                    <div className="text-[10px] text-black tracking-tighter">
                      ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯
                    </div>
                  </div>
                )}
              </div>

              {/* Document Title */}
              <div className="text-center my-6 space-y-1.5">
                <h1 className="text-xl font-bold uppercase text-black tracking-tight">
                  {customTitle}
                </h1>
                <p className="text-xs text-black italic">
                  {t("pdf.periodFromTo")
                    .replace("{from}", customPeriodFrom)
                    .replace("{to}", customPeriodTo)}
                </p>
                {showMetaBadge && (
                  <div className="text-[10px] text-black uppercase font-medium tracking-wider">
                    {t("pdf.templateCodeBadge")}
                  </div>
                )}
              </div>

              {/* 4 KPI Summary Boxes (Tối giản đen trắng, viền 1px nét mảnh) */}
              {showKpiCards && (
                <div className="grid grid-cols-4 gap-3 my-5">
                  <div className="p-3 border border-black rounded-xs space-y-0.5 text-center">
                    <div className="text-[10px] font-bold uppercase text-black">{t("pdf.kpiTotalRevenue")}</div>
                    <div className="text-sm font-bold font-mono text-black">
                      {formatCurrency(kpiStats.totalRevenue)}
                    </div>
                  </div>
                  <div className="p-3 border border-black rounded-xs space-y-0.5 text-center">
                    <div className="text-[10px] font-bold uppercase text-black">{t("pdf.kpiTotalUnits")}</div>
                    <div className="text-sm font-bold font-mono text-black">
                      {formatNumber(kpiStats.totalUnits)} {t("pdf.unitCountSuffix")}
                    </div>
                  </div>
                  <div className="p-3 border border-black rounded-xs space-y-0.5 text-center">
                    <div className="text-[10px] font-bold uppercase text-black">{t("pdf.kpiDistinctProvinces")}</div>
                    <div className="text-sm font-bold font-mono text-black">
                      {kpiStats.distinctProvinces} {t("pdf.provinceSuffix")}
                    </div>
                  </div>
                  <div className="p-3 border border-black rounded-xs space-y-0.5 text-center">
                    <div className="text-[10px] font-bold uppercase text-black">{t("pdf.kpiAvgRevenue")}</div>
                    <div className="text-sm font-bold font-mono text-black">
                      {formatCurrency(kpiStats.avgPerUnit)}
                    </div>
                  </div>
                </div>
              )}

              {/* Main Business Data Table (Chuẩn kế toán: Viền đen 1px solid, không nền màu) */}
              <div className="my-5">
                <table className="w-full text-xs border-collapse border border-black" style={{ border: "1px solid #000" }}>
                  <thead>
                    <tr className="bg-slate-100 text-black font-bold uppercase text-[10px] tracking-wider border-b border-black">
                      <th className="border border-black w-12 py-2 px-2 text-center">{t("pdf.colStt")}</th>
                      <th className="border border-black py-2 px-3 text-left">{t("pdf.colProvinceName")}</th>
                      <th className="border border-black py-2 px-3 text-right w-44">{t("pdf.colCommission")}</th>
                      <th className="border border-black py-2 px-3 text-right w-28">{t("pdf.colUnits")}</th>
                      <th className="border border-black py-2 px-3 text-center w-32">{t("pdf.colNotes")}</th>
                    </tr>
                  </thead>
                  <tbody className="text-black divide-y divide-black">
                    {processedRows.map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="border border-black py-2 px-2 text-center font-mono">{idx + 1}</td>
                        <td className="border border-black py-2 px-3 font-semibold text-black">{r.name}</td>
                        <td className="border border-black py-2 px-3 text-right font-mono font-bold text-black">
                          {formatCurrency(r.revenue)}
                        </td>
                        <td className="border border-black py-2 px-3 text-right font-mono text-black">{formatNumber(r.units)}</td>
                        <td className="border border-black py-2 px-3 text-center text-[10px] text-black">
                          {r.notes}
                        </td>
                      </tr>
                    ))}
                    {processedRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-black">{t("common.noData")}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="font-bold border-t-2 border-black">
                    <tr className="bg-slate-50">
                      <td colSpan={2} className="border border-black py-2.5 px-3 text-left uppercase text-black font-bold">
                        {t("pdf.grandTotalPrefix").replace("{count}", String(processedRows.length))}
                      </td>
                      <td className="border border-black py-2.5 px-3 text-right font-mono text-black text-sm font-bold">
                        {formatCurrency(kpiStats.totalRevenue)}
                      </td>
                      <td className="border border-black py-2.5 px-3 text-right font-mono text-black font-bold">
                        {formatNumber(kpiStats.totalUnits)}
                      </td>
                      <td className="border border-black py-2.5 px-3 text-center text-[10px] text-black font-bold">
                        {t("pdf.note100Percent")}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* 3 Official Signatures Section (Chuẩn Công Văn Ký Tá) */}
              {showSignatures && (
                <div className="mt-10 pt-4 space-y-4">
                  <div className="text-right text-xs italic text-black">
                    {dateStr}
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-1">
                      <div className="font-bold text-xs uppercase text-black">{signerTitle}</div>
                      <div className="text-[11px] text-black italic">{t("pdf.signerSubtitleDefault")}</div>
                      <div className="h-20" />
                      <div className="font-bold text-xs text-black">{signerName || "\u00a0"}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold text-xs uppercase text-black">{accountantTitle}</div>
                      <div className="text-[11px] text-black italic">{t("pdf.signerSubtitleDefault")}</div>
                      <div className="h-20" />
                      <div className="font-bold text-xs text-black">{accountantName || "\u00a0"}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="font-bold text-xs uppercase text-black">{directorTitle}</div>
                      <div className="text-[11px] text-black italic">{t("pdf.directorSubtitleDefault")}</div>
                      <div className="h-20" />
                      <div className="font-bold text-xs text-black">{directorName || "\u00a0"}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  , document.body);
};
