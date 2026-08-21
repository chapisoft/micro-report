"use client";

import React, { useState } from "react";
import { KeyRound, Lock, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import { t } from "../../../shared/locales";

export interface PartnerAuthModalProps {
  isOpen: boolean;
  initialTenantId?: string;
  onAuthenticate: (credentials: {
    tenantId: string;
    apiKey?: string;
    authToken?: string;
  }) => Promise<boolean>;
}

export const PartnerAuthModal: React.FC<PartnerAuthModalProps> = ({
  isOpen,
  initialTenantId = "",
  onAuthenticate,
}) => {
  const [tenantId, setTenantId] = useState(initialTenantId);
  const [apiKey, setApiKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanTenant = tenantId.trim();
    if (!cleanTenant) {
      setErrorMessage(t("auth.requiredTenant"));
      return;
    }

    setLoading(true);
    try {
      const isAuthTypeJwt = apiKey.startsWith("eyJ");
      const success = await onAuthenticate({
        tenantId: cleanTenant,
        apiKey: !isAuthTypeJwt && apiKey.trim() ? apiKey.trim() : undefined,
        authToken: isAuthTypeJwt && apiKey.trim() ? apiKey.trim() : undefined,
      });

      if (!success) {
        setErrorMessage(t("auth.invalidCredentials"));
      }
    } catch (err: any) {
      setErrorMessage(err.message || t("auth.invalidCredentials"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center relative">
          <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-lg font-bold tracking-tight">
            {t("auth.modalTitle")}
          </h2>
          <p className="text-xs text-blue-100/90 mt-1 max-w-xs mx-auto">
            {t("auth.modalSubtitle")}
          </p>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-start space-x-2.5 text-rose-700 dark:text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
              <span className="flex items-center space-x-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>{t("auth.tenantLabel")}</span>
              </span>
            </label>
            <input
              type="text"
              required
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              placeholder={t("auth.tenantPlaceholder")}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-slate-900 dark:text-slate-100 font-mono"
            />
            {/* Quick Chips */}
            <div className="flex items-center space-x-1.5 mt-2">
              <span className="text-[10px] text-slate-400">Gợi ý:</span>
              <button
                type="button"
                onClick={() => setTenantId("DIP_BHXH")}
                className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded border border-slate-200 dark:border-slate-700 transition-colors"
              >
                DIP_BHXH
              </button>
              <button
                type="button"
                onClick={() => setTenantId("MICRO_CRM")}
                className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded border border-slate-200 dark:border-slate-700 transition-colors"
              >
                MICRO_CRM
              </button>
              <button
                type="button"
                onClick={() => setTenantId("NATCASH_PAYMENT")}
                className="text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950 text-slate-600 dark:text-slate-300 hover:text-blue-600 rounded border border-slate-200 dark:border-slate-700 transition-colors"
              >
                NATCASH_PAYMENT
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center space-x-1.5">
              <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
              <span>{t("auth.apiKeyLabel")}</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t("auth.apiKeyPlaceholder")}
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center space-x-2 transition-all active:scale-[0.98] disabled:opacity-50"
          >
            <span>{loading ? t("common.loading") : t("auth.submitButton")}</span>
            {!loading && <ArrowRight className="w-3.5 h-3.5" />}
          </button>
        </form>
      </div>
    </div>
  );
};
