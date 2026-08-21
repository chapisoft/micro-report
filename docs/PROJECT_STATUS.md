# BÁO CÁO THỰC TRẠNG TIẾN ĐỘ DỰ ÁN (PROJECT STATUS DASHBOARD)
## MICRO-REPORT — STANDALONE HYBRID DYNAMIC REPORT ENGINE

**Dự án:** Phân hệ Báo Cáo Động Độc Lập (Standalone Hybrid Dynamic Report Engine)  
**Tài liệu:** Bảng Theo Dõi Thực Trạng Tiến Độ & Kiểm Định Chất Lượng Dự Án  
**Thời điểm cập nhật:** 21/08/2026  
**Trạng thái tổng thể:** 🟢 **HOÀN THÀNH TOÀN BỘ 4 PHA (100% CORE FEATURES DELIVERED)**  
**Kết quả kiểm định Local CI:** 🟢 **100% PASS (Tài liệu Mermaid, Unit Tests Backend & ESLint Frontend)**  
**Đơn vị thực hiện:** Core Architecture Team MASCOM / Chapisoft  

---

## 1. TỔNG QUAN TIẾN ĐỘ DỰ ÁN (EXECUTIVE SUMMARY)

```
[██████████████████████████████████████████████████] 100% HOÀN THÀNH
```

| Hạng Mục / Giai Đoạn | Tỷ Lệ Hoàn Thành | Trạng Thái | Kết Quả Kiểm Định |
|---|:---:|:---:|:---:|
| **Pha 1: Backend Core, Multi-Tenancy & AST Security** | **100%** | 🟢 HOÀN THÀNH | Đạt 20/20 Unit Tests, AST Sandbox chặn 100% DML/DDL |
| **Pha 2: Reusable UI Builder, Embed SDK & Pages** | **100%** | 🟢 HOÀN THÀNH | Đạt 100% ESLint & TypeScript, Dual-Mode hoạt động trơn tru |
| **Pha 3: SXSSF Streaming Export & ShedLock Housekeeping** | **100%** | 🟢 HOÀN THÀNH | SXSSF Window 500 dòng, RAM $< 50\text{MB}$, 2 ShedLock Cronjobs |
| **Pha 4: Deployment, Unit Tests & Local CI Verification** | **100%** | 🟢 HOÀN THÀNH | Docker Compose đầy đủ, `./scripts/local_ci.sh` PASS 100% |

---

## 2. BẢNG THEO DÕI CHI TIẾT TỪNG NHIỆM VỤ (DETAILED WBS TRACKING MATRIX)

### 🔹 PHA 1: BACKEND CORE, MULTI-TENANCY & AST SECURITY SANDBOX

| Mã Task | Hạng Mục Công Việc | File Mã Nguồn Đã Triển Khai | Trạng Thái | Ghi Chú Kỹ Thuật |
|---|---|---|:---:|---|
| **T1.1** | Flyway Migration DDL Metadata Schema | [`V1__init_report_engine_metadata.sql`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/resources/db/migration/V1__init_report_engine_metadata.sql) | 🟢 Xong | Tạo 4 bảng metadata + `shedlock`, seed sẵn tenant mặc định. |
| **T1.2** | Multi-Tenant Context & JWT/API-Key Filter | [`TenantAuthFilter.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/adapter/in/web/filter/TenantAuthFilter.java) | 🟢 Xong | Trích xuất `tenant_id` từ JWT Claims hoặc Header `X-Tenant-Id` + `X-API-Key`. |
| **T1.3** | JSqlParser AST Security Sandbox | [`SqlSecurityAstValidator.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/domain/security/SqlSecurityAstValidator.java) | 🟢 Xong | Chặn 100% DML/DDL (`DROP`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `SELECT INTO`). |
| **T1.4** | Dynamic Parameter Binding Engine | [`DynamicParameterBinder.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/domain/security/DynamicParameterBinder.java) | 🟢 Xong | Regex `{{params.var}}` $\rightarrow$ Named Parameter `:param_var` chống SQL Injection. |
| **T1.5** | Mã Hóa Mật Khẩu AES-256 | [`AesEncryptionService.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/domain/security/AesEncryptionService.java) | 🟢 Xong | Mã hóa mật khẩu CSDL trước khi lưu và giải mã an toàn khi khởi tạo pool. |
| **T1.6** | Dynamic HikariPool DataSource Manager | [`DynamicDataSourceManager.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/application/service/DynamicDataSourceManager.java) | 🟢 Xong | Quản lý pool kết nối đa CSDL, kích hoạt cờ `isReadOnly = true`. |
| **T1.7** | Schema Tree Explorer Service | [`SchemaExplorerService.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/application/service/SchemaExplorerService.java) | 🟢 Xong | Quét Bảng, Cột, Kiểu dữ liệu, Khóa chính qua JDBC metadata. |
| **T1.8** | Report Template CRUD Service | [`ReportTemplateService.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/application/service/ReportTemplateService.java) | 🟢 Xong | CRUD mẫu báo cáo cô lập theo Tenant, kiểm tra cú pháp query an toàn. |
| **T1.9** | Query Preview Execution Service | [`QueryExecutionService.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/application/service/QueryExecutionService.java) | 🟢 Xong | Thực thi truy vấn preview giới hạn 50 dòng, timeout 30s. |
| **T1.10**| REST Controllers & Swagger API Docs | [`DataSourceController.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/adapter/in/web/DataSourceController.java) | 🟢 Xong | Chuẩn OpenAPI 3.0 tại `/swagger-ui.html`. |

---

### 🔹 PHA 2: FRONTEND UI DUAL-MODE BUILDER, EMBED SDK & PAGES

| Mã Task | Hạng Mục Công Việc | File Mã Nguồn Đã Triển Khai | Trạng Thái | Ghi Chú Kỹ Thuật |
|---|---|---|:---:|---|
| **T2.1** | Store Quản Lý State Tập Trung Zustand | [`useReportBuilderStore.ts`](file:///Users/micro/Source/chapisoft/micro-report/src/frontend/src/features/dynamic-builder/model/useReportBuilderStore.ts) | 🟢 Xong | Quản lý session tenant, active datasource, dual-mode, live preview. |
| **T2.2** | Cây Duyệt CSDL SchemaTreeExplorer | [`SchemaTreeExplorer.tsx`](file:///Users/micro/Source/chapisoft/micro-report/src/frontend/src/features/dynamic-builder/ui/SchemaTreeExplorer.tsx) | 🟢 Xong | Duyệt bảng/cột, tìm kiếm nhanh, đánh dấu khóa chính. |
| **T2.3** | Chế Độ No-Code Visual GUI Builder | [`VisualGuiBuilder.tsx`](file:///Users/micro/Source/chapisoft/micro-report/src/frontend/src/features/dynamic-builder/ui/VisualGuiBuilder.tsx) | 🟢 Xong | Chọn cột, alias, aggregation, Visual Join, Filter, nút 1-click **Convert GUI to SQL**. |
| **T2.4** | Chế Độ Low-Code Monaco SQL Editor | [`MonacoSqlEditor.tsx`](file:///Users/micro/Source/chapisoft/micro-report/src/frontend/src/features/dynamic-builder/ui/MonacoSqlEditor.tsx) | 🟢 Xong | Monaco Editor chuẩn VS Code, tự động quét tham số `{{params.var}}` ra form input. |
| **T2.5** | DataTable Xem Trước Chuẩn 4 Cột | [`LiveDataPreviewTable.tsx`](file:///Users/micro/Source/chapisoft/micro-report/src/frontend/src/features/dynamic-builder/ui/LiveDataPreviewTable.tsx) | 🟢 Xong | Đúng thứ tự quy chuẩn: `Checkbox` $\rightarrow$ `STT` $\rightarrow$ `Thao tác` $\rightarrow$ `Dữ liệu`. |
| **T2.6** | Reusable SDK Package | [`src/sdk/package.json`](file:///Users/micro/Source/chapisoft/micro-report/src/sdk/package.json) | 🟢 Xong | `@mascom/dynamic-report-builder` sẵn sàng import vào React/Next.js. |
| **T2.7** | Trang Nhúng Standalone Iframe | [`page.tsx`](file:///Users/micro/Source/chapisoft/micro-report/src/frontend/src/app/(embed)/embed/reports/builder/page.tsx) | 🟢 Xong | Hỗ trợ nhúng Iframe cho Vue, Angular kèm `postMessage` Event Bridge. |
| **T2.8** | Trang Quản Trị Danh Sách Mẫu | [`page.tsx`](file:///Users/micro/Source/chapisoft/micro-report/src/frontend/src/app/(admin)/reports/templates/page.tsx) | 🟢 Xong | Quản lý danh sách mẫu báo cáo, tìm kiếm, chạy thử và xóa mẫu. |

---

### 🔹 PHA 3: SXSSF STREAMING EXPORT, HOUSEKEEPING & SYNC DASHBOARD

| Mã Task | Hạng Mục Công Việc | File Mã Nguồn Đã Triển Khai | Trạng Thái | Ghi Chú Kỹ Thuật |
|---|---|---|:---:|---|
| **T3.1** | SXSSF Streaming Export Engine | [`SxssfStreamingExportService.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/application/service/SxssfStreamingExportService.java) | 🟢 Xong | Xuất Excel (.xlsx) & CSV UTF-8 (.csv) tới 100.000 dòng, RAM $< 50\text{MB}$. |
| **T3.2** | 3-Tier Lifecycle Housekeeping SchedLock | [`HousekeepingScheduler.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/adapter/in/scheduler/HousekeepingScheduler.java) | 🟢 Xong | Xóa file tạm hết hạn 24h lúc 01:00 AM, đóng băng mẫu không dùng 90 ngày lúc 02:00 AM. |
| **T3.3** | DWH Synchronization Scheduler | [`DwhSyncScheduler.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/adapter/in/scheduler/DwhSyncScheduler.java) | 🟢 Xong | Batch Sync bù 60 phút, Nightly Reconcile lúc 00:30 AM, Refresh MV mỗi 15 phút. |
| **T3.4** | DWH Sync Monitoring Dashboard | [`page.tsx`](file:///Users/micro/Source/chapisoft/micro-report/src/frontend/src/app/(admin)/configs/dwh-sync/page.tsx) | 🟢 Xong | Giao diện theo dõi các kênh sync và nút bấm kích hoạt đồng bộ bù theo khoảng ngày. |

---

### 🔹 PHA 4: DEPLOYMENT, UNIT TESTS & LOCAL CI VERIFICATION

| Mã Task | Hạng Mục Công Việc | File Mã Nguồn Đã Triển Khai | Trạng Thái | Ghi Chú Kỹ Thuật |
|---|---|---|:---:|---|
| **T4.1** | Unit Tests AST Sandbox & SQL Security | [`SqlSecurityAstValidatorTest.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/test/java/io/chapisoft/report/domain/security/SqlSecurityAstValidatorTest.java) | 🟢 Xong | 20 test cases kiểm thử chặn 100% lệnh DML/DDL và stacked queries. |
| **T4.2** | Unit Tests Parameter Binder & AES | [`DynamicParameterBinderTest.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/test/java/io/chapisoft/report/domain/security/DynamicParameterBinderTest.java) | 🟢 Xong | Kiểm thử bind regex tham số động và mã hóa/giải mã AES toàn vẹn. |
| **T4.3** | Dockerfiles & Docker Compose | [`docker-compose.yml`](file:///Users/micro/Source/chapisoft/micro-report/deploy/docker-compose.yml) | 🟢 Xong | Đóng gói Backend Spring Boot (Java 21), Frontend Next.js 14, PostgreSQL metadata DB. |
| **T4.4** | Local CI Verification Script | [`scripts/local_ci.sh`](file:///Users/micro/Source/chapisoft/micro-report/scripts/local_ci.sh) | 🟢 Xong | Đạt kết quả **100% PASS** cho toàn bộ tài liệu, test backend và ESLint frontend. |

---

### 🔹 PHA 5: CODE AUDIT, I18N TOAST SYSTEM & DEDICATED MENU PUBLISHING

| Mã Task | Hạng Mục Công Việc | File Mã Nguồn Đã Triển Khai | Trạng Thái | Ghi Chú Kỹ Thuật |
|---|---|---|:---:|---|
| **T5.1** | Kiểm Toán Mock Data & Enums Toàn Diện | [`TenantStatus.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/domain/model/TenantStatus.java), [`DataSourceStatus.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/domain/model/DataSourceStatus.java), [`types.ts`](file:///Users/micro/Source/chapisoft/micro-report/src/frontend/src/features/dynamic-builder/model/types.ts) | 🟢 Xong | 100% Zero mock data trong production code; chuẩn hóa toàn bộ Enums Backend & Frontend. |
| **T5.2** | Hệ Thống I18n & Toast Notification | [`vi.ts`](file:///Users/micro/Source/chapisoft/micro-report/src/frontend/src/shared/locales/vi.ts), [`en.ts`](file:///Users/micro/Source/chapisoft/micro-report/src/frontend/src/shared/locales/en.ts), [`useToast.ts`](file:///Users/micro/Source/chapisoft/micro-report/src/frontend/src/shared/hooks/useToast.ts), [`ToastContainer.tsx`](file:///Users/micro/Source/chapisoft/micro-report/src/frontend/src/shared/ui/ToastContainer.tsx) | 🟢 Xong | Bỏ 100% `alert()`/`confirm()` thô sơ; hỗ trợ đa ngôn ngữ `t(...)` toàn bộ components. |
| **T5.3** | Giải Pháp Xuất Bản Menu Riêng & Standalone Viewer | [`CMS_REPORT_INTEGRATION_GUIDE.md`](file:///Users/micro/Source/chapisoft/micro-report/docs/integration/CMS_REPORT_INTEGRATION_GUIDE.md) | 🟢 Xong | Đặc tả tích hợp Menu tĩnh và Menu động vào CMS DIP & Micro-CRM kèm Delegated Token & RLS. |
| **T5.4** | Triển Khai Tên Miền Độc Lập (`rpe.microtec.vn` & `rpf.microtec.vn`) | [`host-report-vhost.conf`](file:///Users/micro/Source/chapisoft/micro-report/deploy/nginx/host-report-vhost.conf), [`DEPLOYMENT_PLAN_DIP.md`](file:///Users/micro/Source/chapisoft/micro-report/deploy/DEPLOYMENT_PLAN_DIP.md) | 🟢 Xong | Khai báo và deploy Nginx Virtual Hosts cho Backend (`rpe.microtec.vn`) và Frontend (`rpf.microtec.vn`). |
| **T5.5** | Phân Quyền CSDL (`listDatasource`) & Chuẩn Hóa Zero-Hardcode | [`ReportConstants.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/domain/model/ReportConstants.java), [`DataSourceController.java`](file:///Users/micro/Source/chapisoft/micro-report/src/backend/src/main/java/io/chapisoft/report/adapter/in/web/DataSourceController.java) | 🟢 Xong | Cô lập 100% Tenant, lọc `listDatasource` theo phiên và loại bỏ toàn bộ magic strings/numbers. |

---

## 3. MA TRẬN SẴN SÀNG TÍCH HỢP ĐA HỆ THỐNG (INTEGRATION READINESS MATRIX)

| Hệ Thống Tích HỢp | Phương Thức Tích Hợp | Tên Miền / URL Kết Nối | Trạng Thái Sẵn Sàng | Cách Thức Nhúng Thực Tế |
|---|---|---|:---:|---|
| **1. DIP Platform (Thu hộ BHXH)** | **Mode 1 & Mode 2 (Standalone Viewer)** | `https://rpf.microtec.vn/embed/reports/viewer/*` | 🟢 **SẴN SÀNG (100%)** | Nhúng `<iframe src="https://rpf.microtec.vn/embed/reports/viewer/RPT_DIP_DOSSIERS_SUMMARY?tenant=DIP_BHXH" />` vào CMS DIP. |
| **2. Natcash (Ví điện tử)** | **Mode 2 (Embedded Iframe URL)** | `https://rpf.microtec.vn/embed/reports/viewer/*` | 🟢 **SẴN SÀNG (100%)** | Nhúng Iframe kèm `listDatasource=NATCASH_DWH` và Delegated Token. |
| **3. Micro-CRM** | **Mode 1 hoặc Mode 2 (Dynamic Menu Sync)** | `https://rpe.microtec.vn/api/v1/reports/templates/published` | 🟢 **SẴN SÀNG (100%)** | Tự động gọi API lấy danh mục Menu báo cáo đã xuất bản của Tenant `MICRO_CRM`. |
| **4. Các Hệ Thống Backend Ngoại Vi** | **Mode 3 (Headless REST APIs)** | `https://rpe.microtec.vn/api/v1/reports/*` | 🟢 **SẴN SÀNG (100%)** | Gọi API Streaming Export Excel / CSV qua REST API với Header `X-Tenant-Id`. |

---

## 4. KẾ HOẠCH BÀN GIAO & CÁC BƯỚC TIẾP THEO (NEXT STEPS)

1. **Khởi chạy môi trường Dev / Local:**
   ```bash
   cd deploy && docker compose up -d
   ```
2. **Kiểm tra Swagger UI:** Truy cập `https://rpe.microtec.vn/swagger-ui/index.html` (hoặc `http://localhost:8080/swagger-ui.html`).
3. **Kiểm tra Giao diện Web:** Truy cập `https://rpf.microtec.vn/reports/builder` (hoặc `http://localhost:3000/reports/builder`).
4. **Đóng gói NPM Package:** Chạy lệnh `npm publish` trong thư mục `src/sdk` khi cần phát hành lên kho lưu trữ npm nội bộ của MASCOM.
