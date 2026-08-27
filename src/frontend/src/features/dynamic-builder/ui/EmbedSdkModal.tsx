"use client";

import React, { useState } from "react";
import { Check, Copy, ExternalLink, X } from "lucide-react";
import { t } from "../../../shared/locales";
import { toast } from "../../../shared/hooks/useToast";

interface EmbedSdkModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId?: string;
  templateCode?: string;
}

export const EmbedSdkModal: React.FC<EmbedSdkModalProps> = ({
  isOpen,
  onClose,
  tenantId = "DIP_BHXH",
  templateCode = "BC_DOANH_THU_BHXH_TINH",
}) => {
  const [embedMode, setEmbedMode] = useState<"iframe" | "react" | "rest">("iframe");
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const baseUrl =
    typeof window !== "undefined" ? window.location.origin : "https://report.mascom.vn";

  const getEmbedSnippet = () => {
    if (embedMode === "iframe") {
      return `<iframe 
  src="${baseUrl}/embed/reports/viewer?tenant=${tenantId}&templateCode=${templateCode}&token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  width="100%" 
  height="750px" 
  frameborder="0"
  allow="clipboard-write">
</iframe>`;
    }

    if (embedMode === "react") {
      return `import { StandaloneReportViewer } from "@mascom/dynamic-report-builder";

export function AgencyReportPage() {
  return (
    <StandaloneReportViewer
      engineUrl="${baseUrl}/api/v1/reports"
      tenantId="${tenantId}"
      templateCode="${templateCode}"
      authToken="YOUR_PARTNER_JWT_TOKEN"
      theme="light"
      onExportSuccess={(task) => console.log("Exported:", task)}
    />
  );
}`;
    }

    return `curl -X POST "${baseUrl}/api/v1/reports/query/execute" \\
  -H "X-Tenant-Id: ${tenantId}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "templateCode": "${templateCode}",
    "parameters": {
      "fromDate": "2026-01-01",
      "toDate": "2026-08-25"
    },
    "limit": 1000
  }'`;
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getEmbedSnippet());
    setCopied(true);
    toast.success(t("messages.copiedToClipboard") || "Đã sao chép mã nhúng vào clipboard!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl w-full max-w-xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Mã Nhúng Tích Hợp Đa Nền Tảng (Embed SDK)
              </h3>
              <p className="text-[11px] text-slate-500">
                Tích hợp báo cáo vào Portal quản trị, CRM hoặc Natcash ERP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Chọn phương thức tích hợp
            </label>
            <select
              value={embedMode}
              onChange={(e) => setEmbedMode(e.target.value as any)}
              className="w-full h-9 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
            >
              <option value="iframe">Chế độ 1: Iframe URL với JWT Token (DIP CMS / Natcash)</option>
              <option value="react">Chế độ 2: React Component NPM (@mascom/dynamic-report-builder)</option>
              <option value="rest">Chế độ 3: Headless REST API (Backend to Backend)</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Mã nhúng tương ứng
              </label>
              <span className="text-[10px] font-mono text-slate-400">
                {embedMode === "iframe" ? "HTML" : embedMode === "react" ? "TypeScript / JSX" : "cURL"}
              </span>
            </div>
            <pre className="p-3 bg-slate-950 text-sky-400 font-mono text-xs rounded-xl border border-slate-800 overflow-x-auto max-h-48 leading-relaxed whitespace-pre-wrap selection:bg-blue-800">
              {getEmbedSnippet()}
            </pre>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Đóng
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "Đã Sao Chép!" : "Sao Chép Mã Nhúng"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
