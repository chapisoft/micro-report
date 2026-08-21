export interface DynamicReportBuilderProps {
  engineUrl: string;
  tenantId: string;
  authToken?: string;
  apiKey?: string;
  theme?: "light" | "dark";
  defaultDatasourceCode?: string;
  allowedDatasources?: string[] | string;
  listDatasource?: string[] | string;
  onExportSuccess?: (taskInfo: any) => void;
}

export interface StandaloneReportViewerProps {
  templateCode?: string;
  engineUrl?: string;
  tenantId?: string;
  authToken?: string;
  apiKey?: string;
  theme?: "light" | "dark";
  allowedDatasources?: string[] | string;
  listDatasource?: string[] | string;
  onExportSuccess?: (taskInfo: any) => void;
}

export * from "../../frontend/src/features/dynamic-builder/model/types";
