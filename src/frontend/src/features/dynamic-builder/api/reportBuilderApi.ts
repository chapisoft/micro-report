import axios, { AxiosInstance } from "axios";
import {
  BUILDER_CONSTANTS,
  DataSource,
  ExportTask,
  QueryPreviewResponse,
  ReportTemplate,
  SchemaInfo,
} from "../model/types";

export class ReportBuilderApiClient {
  private client: AxiosInstance;

  constructor(
    private engineUrl: string = "",
    private tenantId: string = BUILDER_CONSTANTS.DEFAULT_TENANT_ID,
    private authToken?: string,
    private apiKey?: string
  ) {
    this.client = axios.create({
      baseURL: this.engineUrl,
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Id": this.tenantId,
        ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
        ...(this.apiKey ? { "X-API-Key": this.apiKey } : {}),
      },
    });
  }

  public updateConfig(
    engineUrl: string,
    tenantId: string,
    authToken?: string,
    apiKey?: string
  ) {
    this.engineUrl = engineUrl;
    this.tenantId = tenantId;
    this.authToken = authToken;
    this.apiKey = apiKey;

    this.client = axios.create({
      baseURL: this.engineUrl,
      headers: {
        "Content-Type": "application/json",
        "X-Tenant-Id": this.tenantId,
        ...(this.authToken ? { Authorization: `Bearer ${this.authToken}` } : {}),
        ...(this.apiKey ? { "X-API-Key": this.apiKey } : {}),
      },
    });
  }

  public async getDataSources(allowedDatasources?: string[] | string): Promise<DataSource[]> {
    const listParam = Array.isArray(allowedDatasources)
      ? allowedDatasources.join(",")
      : allowedDatasources;
    const url = listParam
      ? `/api/v1/reports/datasources?listDatasource=${encodeURIComponent(listParam)}`
      : "/api/v1/reports/datasources";
    const res = await this.client.get<DataSource[]>(url);
    return res.data;
  }

  public async getSchema(datasourceCode: string): Promise<SchemaInfo> {
    const res = await this.client.get<SchemaInfo>(
      `/api/v1/reports/schema/${datasourceCode}`
    );
    return res.data;
  }

  public async previewQuery(payload: {
    datasourceCode: string;
    mode: "GUI" | "SQL";
    sql?: string;
    configJson?: string;
    transformJs?: string;
    params?: Record<string, any>;
    limit?: number;
  }): Promise<QueryPreviewResponse> {
    const res = await this.client.post<QueryPreviewResponse>(
      "/api/v1/reports/preview",
      payload
    );
    return res.data;
  }

  public async getTemplates(status?: string): Promise<ReportTemplate[]> {
    const res = await this.client.get<ReportTemplate[]>(
      "/api/v1/reports/templates",
      {
        params: status ? { status } : {},
      }
    );
    return res.data;
  }

  public async getPublishedTemplates(): Promise<ReportTemplate[]> {
    const res = await this.client.get<ReportTemplate[]>(
      "/api/v1/reports/templates/published"
    );
    return res.data;
  }

  public async getTemplate(templateCode: string): Promise<ReportTemplate> {
    const res = await this.client.get<ReportTemplate>(
      `/api/v1/reports/templates/${templateCode}`
    );
    return res.data;
  }

  public async saveTemplate(template: ReportTemplate): Promise<ReportTemplate> {
    if (template.id) {
      const res = await this.client.put<ReportTemplate>(
        `/api/v1/reports/templates/${template.templateCode}`,
        template
      );
      return res.data;
    } else {
      const res = await this.client.post<ReportTemplate>(
        "/api/v1/reports/templates",
        template
      );
      return res.data;
    }
  }

  public async exportExcel(payload: {
    datasourceCode: string;
    templateId?: number;
    mode: "GUI" | "SQL";
    sql?: string;
    configJson?: string;
    params?: Record<string, any>;
    fileName?: string;
  }): Promise<ExportTask> {
    const res = await this.client.post<ExportTask>(
      "/api/v1/reports/export/excel",
      payload
    );
    return res.data;
  }

  public async exportCsv(payload: {
    datasourceCode: string;
    templateId?: number;
    mode: "GUI" | "SQL";
    sql?: string;
    configJson?: string;
    params?: Record<string, any>;
    fileName?: string;
  }): Promise<ExportTask> {
    const res = await this.client.post<ExportTask>(
      "/api/v1/reports/export/csv",
      payload
    );
    return res.data;
  }

  public async getExportTasks(): Promise<ExportTask[]> {
    const res = await this.client.get<ExportTask[]>("/api/v1/reports/export/tasks");
    return res.data;
  }

  public async manualDwhSync(payload: {
    datasourceCode: string;
    tableName?: string;
    fromDate?: string;
    toDate?: string;
    refreshMaterializedViews?: boolean;
  }): Promise<{ status: string; message: string }> {
    const res = await this.client.post<{ status: string; message: string }>(
      "/api/v1/reports/dwh/sync/manual",
      payload
    );
    return res.data;
  }
}

export const defaultApiClient = new ReportBuilderApiClient();
