"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  SlidersHorizontal,
} from "lucide-react";
import { t } from "../../../shared/locales";

interface FriendlyErrorCardProps {
  errorMessage: string;
  onRetry?: () => void;
  onOpenAuth?: () => void;
}

export const FriendlyErrorCard: React.FC<FriendlyErrorCardProps> = ({
  errorMessage,
  onRetry,
  onOpenAuth,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const getFriendlyExplanation = (msg: string) => {
    const lower = msg.toLowerCase();
    if (lower.includes("ora-00942") || lower.includes("42p01") || lower.includes("relation") || lower.includes("table or view does not exist")) {
      return t("friendlyError.tableNotFound");
    }
    if (lower.includes("ora-00904") || lower.includes("bad sql grammar") || lower.includes("invalid identifier") || lower.includes("syntax error") || lower.includes("column")) {
      return t("friendlyError.syntaxError");
    }
    if (lower.includes("timeout") || lower.includes("canceling statement due to user request")) {
      return t("friendlyError.timeoutError");
    }
    return t("friendlyError.genericDesc");
  };

  const friendlyDesc = getFriendlyExplanation(errorMessage);

  return (
    <div className="m-3 p-4 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl space-y-3">
      <div className="flex items-start space-x-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-lg shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
            {t("friendlyError.title")}
          </h4>
          <p className="text-xs text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
            {friendlyDesc}
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 pt-1">
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{t("friendlyError.retryBtn")}</span>
          </button>
        )}

        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium transition-all"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>{t("friendlyError.authSettingsBtn")}</span>
          </button>
        )}

        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex items-center space-x-1 px-2.5 py-1.5 text-amber-700 dark:text-amber-400 hover:text-amber-900 text-xs font-medium transition-colors"
        >
          <span>{showDetails ? t("friendlyError.hideTechDetails") : t("friendlyError.showTechDetails")}</span>
          {showDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Technical Details Accordion */}
      {showDetails && (
        <div className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto border border-slate-800 break-all select-all">
          {errorMessage}
        </div>
      )}
    </div>
  );
};
