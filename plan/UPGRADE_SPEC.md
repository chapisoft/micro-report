# KẾ HOẠCH TRIỂN KHAI CHI TIẾT & ĐẶC TẢ KỸ THUẬT HỆ THỐNG MICRO-REPORT ENGINE
## PHÂN HỆ BÁO CÁO ĐỘNG ĐỘC LẬP (STANDALONE HYBRID DYNAMIC REPORT ENGINE)

---

## 1. TỔNG QUAN HỆ THỐNG & MỤC TIÊU CHIẾN LƯỢC

### 1.1. Bối Cảnh & Mục Tiêu Tách Rời Độc Lập
Hệ thống **Micro-Report Engine** được định hình là một **Nền tảng Dịch vụ Báo Cáo Động Dùng Chung (Standalone Microservice)**, hoàn toàn phi nghiệp vụ (Domain-Agnostic), tuân thủ tuyệt đối nguyên lý phân tách tải trọng và cô lập đa người thuê (Multi-Tenancy). Kế hoạch này nhằm chuẩn hóa và hoàn thiện giải pháp đạt chuẩn thương mại Enterprise B2B phục vụ cả nhân viên kỹ thuật, kế toán và ban lãnh đạo (C-Level).

---

### 1.2. Bảng Đánh Giá Mức Độ Đáp Ứng Nhu Cầu Doanh Nghiệp

| Tiêu Chí Nghiệp Vụ Doanh Nghiệp | Đánh Giá | Trạng Thái Khả Năng Đáp Ứng |
| :--- | :---: | :--- |
| **Kiến trúc Lõi & Cô lập Tải trọng** | **Tốt** | Đạt chuẩn. Xử lý tốt việc tách báo cáo khỏi CSDL giao dịch. |
| **Xử lý Dữ liệu Lớn** | **Tốt** | Đáp ứng xuất Excel 100.000+ dòng an toàn, không sập server. |
| **Trải nghiệm Giao diện & Kéo Thả (No-Code/Low-Code)** | **Trung bình** | Đã có GUI Builder nhưng còn thiếu tính năng xem nhanh dữ liệu, UX còn gập ghềnh. |
| **Trực quan hóa Số liệu & Dashboard** | **Yếu** | Chỉ trả về bảng số liệu thô. Khách hàng cấp quản lý cần biểu đồ trực quan. |
| **Tuân thủ An toàn Thông tin & Quyền riêng tư** | **Yếu** | Có chống SQL Injection nhưng thiếu che giấu dữ liệu cá nhân. |
| **Tự động hóa Phân phối & Vận hành** | **Yếu** | Thiếu hoàn toàn khả năng lập lịch gửi báo cáo qua Email/Bot. |

---

### 1.3. Bảng So Sánh 2 Phương Án Tích Hợp Vào CMS Chủ

| Tiêu Chí So Sánh | Phương Án A: Iframe Embed Wrapper<br>*(Khuyên dùng GĐ 1)* | Phương Án B: React Component SDK<br>*(Khuyên dùng GĐ 2)* |
| :--- | :--- | :--- |
| **Thời gian tích hợp** | Siêu nhanh (chỉ mất 1 - 2 giờ) | Cần cài đặt packages và build bundle (~1 - 2 ngày) |
| **Độ độc lập & Nâng cấp** | Tuyệt đối: Khi Report Engine nâng cấp thêm chart, fix bug, CMS tự động có ngay mà không cần build hay deploy lại CMS. | Cần cập nhật version của npm package và build lại CMS. |
| **Ảnh hưởng Bundle CMS** | 0MB: Không làm tăng kích thước file JS của CMS (không cần kéo Monaco Editor hay dnd-kit vào CMS). | Tăng kích thước JS bundle của CMS thêm ~400KB (gzip). |
| **Trải nghiệm UX/UI** | Tốt (hỗ trợ fullscreen, đồng bộ Theme Light/Dark qua postMessage). | Rất mượt mà, hòa nhập 100% vào DOM và Router của CMS. |
| **Khả năng áp dụng** | Áp dụng được cho MỌI công nghệ CMS (Next.js, React, Vue, Angular, PHP, HTML). | Chỉ áp dụng cho hệ thống dùng React / Next.js. |

---

## 2. KIẾN TRÚC MÃ NGUỒN & HẠ TẦNG TRIỂN KHAI

### 2.1. Cấu Trúc Thư Mục Repository Dự Án

```
micro-report/
├── src/
│   ├── backend/                                   # Spring Boot 3.3 / Java 21 LTS
│   │   ├── src/main/java/io/chapisoft/report/
│   │   │   ├── adapter/
│   │   │   │   ├── in/web/                        # REST Controllers, Filters
│   │   │   │   │   ├── DynamicReportController.java
│   │   │   │   │   ├── SchemaExplorerController.java
│   │   │   │   │   └── filter/TenantAuthFilter.java
│   │   │   │   ├── in/scheduler/                  # ShedLock Scheduled Jobs
│   │   │   │   │   ├── HousekeepingScheduler.java
│   │   │   │   │   └── ReportSubscriptionScheduler.java
│   │   │   │   └── out/persistence/               # JPA Repositories
│   │   │   ├── application/
│   │   │   │   └── service/                       # Core Use Cases
│   │   │   │       ├── QueryExecutionService.java
│   │   │   │       ├── DynamicDataSourceManager.java
│   │   │   │       ├── SxssfStreamingExportService.java
│   │   │   │       └── SchemaExplorerService.java
│   │   │   ├── domain/
│   │   │   │   ├── model/                         # Domain Entities & Enums
│   │   │   │   ├── security/                      # AST Sandbox, Token, Dialect, Masking
│   │   │   │   │   ├── SqlSecurityAstValidator.java
│   │   │   │   │   ├── DynamicParameterBinder.java
│   │   │   │   │   ├── DataMaskingUtils.java
│   │   │   │   │   └── dialect/DatabaseDialectFactory.java
│   │   │   │   └── aspect/                        # AOP Authorization & Audit
│   │   │   │       ├── DataSourcePermissionAspect.java
│   │   │   │       └── QueryAuditAspect.java
│   │   │   └── infrastructure/config/             # Caching, ThreadPool, Security
│   │   └── src/main/resources/db/migration/       # Flyway Migration DDL
│   │       ├── V1__init_report_engine_metadata.sql
│   │       ├── V2__user_datasource_permissions.sql
│   │       └── V3__template_versioning_and_subscriptions.sql
│   └── frontend/                                  # Next.js 14 App Router / FSD
│       ├── src/
│       │   ├── app/                               # App Routes & Embed Views
│       │   │   ├── (admin)/reports/builder/       # Dual-Mode Builder Page
│       │   │   ├── (admin)/reports/templates/     # Template Catalog Page
│       │   │   ├── (admin)/configs/dwh-sync/      # DWH Sync Monitoring Portal
│       │   │   └── (embed)/embed/reports/viewer/  # Dedicated Standalone Viewer
│       │   ├── features/dynamic-builder/          # Builder Logic (State, UI, API)
│       │   │   ├── model/useReportBuilderStore.ts
│       │   │   └── ui/
│       │   │       ├── SchemaTreeExplorer.tsx
│       │   │       ├── VisualGuiBuilder.tsx
│       │   │       ├── MonacoSqlEditor.tsx
│       │   │       └── LiveDataPreviewTable.tsx
│       │   ├── features/bi-dashboard/             # Recharts Visual Components
│       │   │   └── ui/{DynamicBarChart, DynamicLineChart, DynamicPieChart, KpiCard}.tsx
│       │   └── shared/                            # Hooks, Locales, UI Primitives
├── deploy/                                        # Container Topology & Nginx VHosts
│   ├── docker-compose.yml
│   └── nginx/host-report-vhost.conf
└── scripts/
    ├── local_ci.sh                                # Automated Pre-Commit Pipeline
    └── deploy_dip.sh                              # Automated Production Deploy Script
```

---

### 2.2. Bảng Đặc Tả Tên Miền & Mô Hình Triển Khai (Production Domains)

| Hạng Mục | Tên Miền (Domain) | Cổng Nội Bộ / Upstream | Chức Năng Chính |
| :--- | :--- | :--- | :--- |
| **Backend Report Engine** | `rpe.microtec.vn` | `172.18.0.1:8088` (`:8080`) | • Headless RESTful APIs (`/api/v1/reports/*`)<br>• Swagger UI (`/swagger-ui/index.html`)<br>• OpenAPI Spec (`/v3/api-docs`)<br>• SXSSF Streaming Excel / CSV Engine |
| **Frontend Web & Embed** | `rpf.microtec.vn` | `172.18.0.1:3008` (`:3000`) | • Dual-Mode Visual Builder (`/reports/builder`)<br>• Quản trị mẫu báo cáo (`/reports/templates`)<br>• Standalone Viewer nhúng Iframe (`/embed/reports/viewer/*`)<br>• DWH Sync Monitoring Portal (`/configs/dwh-sync`) |

---

### 2.3. Bảng Seed Data Có Sẵn Trên Cơ Sở Dữ Liệu

| Hệ Thống (Tenant) | Mã DataSource | Tên DataSource & CSDL Đích | Mẫu Báo Cáo Mặc Định Đã Xuất Bản |
| :--- | :--- | :--- | :--- |
| **DIP Platform**<br>(`DIP_BHXH`) | `DIP_DWH` | DIP OLAP Data Warehouse (`dip_olap`) | • `RPT_DIP_DOSSIERS_SUMMARY` (Tổng hợp hồ sơ)<br>• `RPT_DIP_COMMISSIONS_AGENT` (Đối soát hoa hồng đại lý)<br>• `RPT_DIP_DAILY_REVENUE` (Doanh thu theo ngày) |
| **Micro-CRM**<br>(`MICRO_CRM`) | `CRM_DWH` | Micro-CRM OLAP Database (`crm_olap`) | • `RPT_CRM_LEADS_BY_SOURCE` (Leads theo nguồn & tỷ lệ chuyển đổi)<br>• `RPT_CRM_SALES_PIPELINE` (Phễu bán hàng & cơ hội)<br>• `RPT_CRM_AGENT_PERFORMANCE` (KPI nhân viên) |
| **Natcash**<br>(`NATCASH_PAYMENT`) | `NATCASH_DWH` | Natcash Payment OLAP DB (`natcash_db`) | Cấu hình DataSource kết nối sẵn sàng. |
| **Default Sandbox**<br>(`DEFAULT`) | `DEFAULT_DS` | Embedded H2 In-Memory DB | Cấu hình thử nghiệm nhanh. |

---

## 3. KẾ HOẠCH PHÂN RÃ CÔNG VIỆC WBS CHI TIẾT

### 3.1. GIAI ĐOẠN 1: BACKEND CORE, MULTI-TENANCY & AST SECURITY

| Mã Task | Tên Công Việc Chi Tiết | File Triển Khai Chính | Tiêu Chí Hoàn Thành (DoD) | Người Phụ Trách |
| :---: | :--- | :--- | :--- | :---: |
| **WBS 1.1** | Khởi tạo cấu trúc dự án Spring Boot 3.3 Java 21 LTS theo Hexagonal Architecture | `src/backend/build.gradle` | Gradle wrapper hoạt động, tải đủ thư viện HikariCP, JSqlParser, POI, Flyway, ShedLock. | Backend Lead |
| **WBS 1.2** | Thiết kế Flyway Migration DDL khởi tạo schema metadata nội bộ (`RPT_TENANTS`, `RPT_DATASOURCES`, `RPT_TEMPLATES`, `RPT_EXPORT_TASKS`, `shedlock`) | `V1__init_report_engine_metadata.sql` | Script chạy thành công trên PostgreSQL 15 & H2 in-memory test. | Backend Dev |
| **WBS 1.3** | Xây dựng bộ phân tích an toàn `SqlSecurityAstValidator` sử dụng JSqlParser | `SqlSecurityAstValidator.java` | Chặn 100% các câu lệnh DML/DDL (`INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `SELECT INTO`). | Security Lead |
| **WBS 1.4** | Xây dựng bộ liên kết tham số động `DynamicParameterBinder` | `DynamicParameterBinder.java` | Regex `{{params.var}}` tự động chuyển đổi thành Named Parameter `:param_var` an toàn. | Backend Dev |
| **WBS 1.5** | Xây dựng dịch vụ mã hóa AES-256 bảo mật mật khẩu kết nối CSDL | `AesEncryptionService.java` | Mã hóa mật khẩu CSDL trước khi lưu vào `RPT_DATASOURCES` và giải mã khi mở pool. | Security Lead |
| **WBS 1.6** | Xây dựng bộ quản lý kết nối CSDL động `DynamicDataSourceManager` | `DynamicDataSourceManager.java` | Quản lý cache HikariPool đa CSDL (PostgreSQL, Oracle, MySQL, SQL Server) kèm cờ `isReadOnly = true`. | Backend Dev |
| **WBS 1.7** | Xây dựng dịch vụ quét cây danh mục CSDL `SchemaExplorerService` | `SchemaExplorerService.java` | Quét tự động danh sách Bảng, View, Cột, Kiểu dữ liệu, Khóa chính qua JDBC `DatabaseMetaData`. | Backend Dev |
| **WBS 1.8** | Xây dựng bộ lọc xác thực đa người thuê `TenantAuthFilter` | `TenantAuthFilter.java` | Trích xuất thông tin Tenant từ JWT Claims hoặc cặp Header `X-Tenant-Id` + `X-API-Key`. | Security Dev |

---

### 3.2. GIAI ĐOẠN 2: FRONTEND UI DUAL-MODE BUILDER & REUSABLE SDK

| Mã Task | Tên Công Việc Chi Tiết | File Triển Khai Chính | Tiêu Chí Hoàn Thành (DoD) | Người Phụ Trách |
| :---: | :--- | :--- | :--- | :---: |
| **WBS 2.1** | Khởi tạo cấu trúc Frontend Next.js 14 App Router, Tailwind CSS và Zustand Store | `useReportBuilderStore.ts` | Quản lý state tập trung cho Dual-Mode (GUI / SQL), dynamic params, active template. | Frontend Lead |
| **WBS 2.2** | Xây dựng Component thanh bên trái `SchemaTreeExplorer` | `SchemaTreeExplorer.tsx` | Hiển thị cây thư mục CSDL, tìm kiếm bảng/cột, đánh dấu Khóa chính, chọn bảng gốc. | Frontend Dev |
| **WBS 2.3** | Xây dựng Chế độ No-Code `VisualGuiBuilder` | `VisualGuiBuilder.tsx` | Kéo thả chọn cột, đặt bí danh, gán hàm tổng hợp (SUM, COUNT), Visual Join, Filter AND/OR, nút Convert GUI to SQL. | Frontend Dev |
| **WBS 2.4** | Xây dựng Chế độ Low-Code `MonacoSqlEditor` | `MonacoSqlEditor.tsx` | Tích hợp Monaco Editor chuẩn VS Code, tự động quét tham số `{{params.var}}` ra form input, tab JavaScript Transformations. | Frontend Dev |
| **WBS 2.5** | Xây dựng bảng xem trước thời gian thực `LiveDataPreviewTable` | `LiveDataPreviewTable.tsx` | Tuân thủ thứ tự cột: Checkbox → STT → Thao tác → Dữ liệu, hiển thị thời gian chạy query. | Frontend Dev |
| **WBS 2.6** | Xây dựng modal xuất dữ liệu `ExportModal` | `ExportModal.tsx` | Chọn định dạng Excel (`.xlsx`) hoặc CSV UTF-8 (`.csv`), hiển thị tiến độ và link tải trực tiếp. | Frontend Dev |
| **WBS 2.7** | Đóng gói Reusable NPM Component Package `@mascom/dynamic-report-builder` | `src/sdk/package.json` | Export component sẵn sàng nhúng vào bất kỳ ứng dụng React/Next.js bên ngoài. | Frontend Lead |
| **WBS 2.8** | Xây dựng trang nhúng Iframe Standalone `/embed/reports/builder` | `page.tsx` | Hỗ trợ nhúng Iframe cho Vue, Angular, Legacy Web kèm `window.postMessage` Event Bridge. | Frontend Dev |

---

### 3.3. GIAI ĐOẠN 3: STREAMING EXPORT, HOUSEKEEPING & SYNC DASHBOARD

| Mã Task | Tên Công Việc Chi Tiết | File Triển Khai Chính | Tiêu Chí Hoàn Thành (DoD) | Người Phụ Trách |
| :---: | :--- | :--- | :--- | :---: |
| **WBS 3.1** | Xây dựng động cơ xuất file Streaming `SxssfStreamingExportService` | `SxssfStreamingExportService.java` | Xuất file Excel/CSV tới 100.000 dòng, giữ RAM footprint < 50MB nhờ Apache POI SXSSF Window 500 dòng. | Backend Lead |
| **WBS 3.2** | Xây dựng 2 Cronjobs quản lý vòng đời 3 tầng `HousekeepingScheduler` với ShedLock | `HousekeepingScheduler.java` | Tự động dọn file tạm hết hạn sau 24h lúc 01:00 AM và đóng băng mẫu cũ không dùng quá 90 ngày lúc 02:00 AM. | Backend Dev |
| **WBS 3.3** | Xây dựng dịch vụ lập lịch đồng bộ kho dữ liệu `DwhSyncScheduler` | `DwhSyncScheduler.java` | Lập lịch Batch Sync bù mỗi 60 phút, Nightly Reconcile lúc 00:30 AM và Refresh Materialized Views mỗi 15 phút. | Backend Dev |
| **WBS 3.4** | Xây dựng màn hình Dashboard giám sát và kích hoạt đồng bộ bù thủ công | `page.tsx` | Giao diện theo dõi các kênh sync và nút bấm kích hoạt đồng bộ bù theo khoảng ngày. | Frontend Dev |

---

### 3.4. GIAI ĐOẠN 4: CONTAINERIZATION, KIỂM THỬ AN TOÀN & LOCAL CI

| Mã Task | Tên Công Việc Chi Tiết | File Triển Khai Chính | Tiêu Chí Hoàn Thành (DoD) | Người Phụ Trách |
| :---: | :--- | :--- | :--- | :---: |
| **WBS 4.1** | Xây dựng bộ Unit Tests kiểm thử AST Security Sandbox & Dynamic Parameter Binding | `SqlSecurityAstValidatorTest.java` | 20 test cases kiểm thử chặn DML/DDL, multi-statements, parameter binding và mã hóa AES pass 100%. | QA & Security |
| **WBS 4.2** | Xây dựng Dockerfiles Multi-stage & cấu hình `docker-compose.yml` | `docker-compose.yml` | Đóng gói Backend (Java 21 JRE), Frontend (Node 20 Standalone) và PostgreSQL Metadata DB. | DevOps Lead |
| **WBS 4.3** | Thiết lập và chạy kịch bản kiểm tra tự động Pre-Commit Local CI | `scripts/local_ci.sh` | Toàn bộ Unit Tests Backend, TypeScript, ESLint Frontend và Mermaid diagrams đều đạt kết quả PASS 100%. | DevOps / QA |

---

### 3.5. GIAI ĐOẠN 5: CODE AUDIT, I18N TOAST SYSTEM & DEDICATED MENU INTEGRATION

| Mã Task | Tên Công Việc Chi Tiết | File Triển Khai Chính | Tiêu Chí Hoàn Thành (DoD) | Người Phụ Trách |
| :---: | :--- | :--- | :--- | :---: |
| **WBS 5.1** | Kiểm toán toàn bộ dự án loại bỏ hardcode/mock data, chuẩn hóa hệ thống Enums | `TenantStatus.java`, `types.ts` | 100% không mock data, thay thế raw strings bằng Enums định kiểu chặt chẽ. | Tech Lead |
| **WBS 5.2** | Xây dựng hệ thống Đa ngôn ngữ (I18n) & Toast Notification | `vi.ts`, `useToast.ts`, `ToastContainer.tsx` | Loại bỏ 100% `alert()`, hỗ trợ đa ngôn ngữ `t(...)` toàn bộ components. | Frontend Dev |
| **WBS 5.3** | Xây dựng kiến trúc Xuất bản Báo cáo thành Menu riêng & Standalone Viewer cho DIP/CRM | `CMS_REPORT_INTEGRATION_GUIDE.md` | Tài liệu hóa giải pháp Delegated Token SSO, Row-Level Security và Dynamic Menu Sync API. | Solution Architect |

---

## 4. ĐẶC TẢ KỸ THUẬT & MÃ NGUỒN KHẮC PHỤC 12 LỖI HỆ THỐNG

### 4.1. Bảng Phân Tích & Giải Quyết 12 Lỗi Kỹ Thuật (BUG-01 Đến BUG-12)

| Mã Lỗi | Nguyên Nhân Gốc Rễ (RCA) | Giải Pháp Kỹ Thuật |
| :---: | :--- | :--- |
| **`BUG-01`** | Alias tiếng Việt/dấu cách gây lỗi cú pháp JSqlParser. | Tự động bọc ngoặc kép quanh alias trong AST Builder (`AS "Doanh thu"`). |
| **`BUG-02`** | Hardcode `LIMIT 50` làm Oracle báo lỗi `bad SQL grammar`. | Đa hình phân trang: `WHERE ROWNUM <= 50` cho Oracle, `LIMIT 50` cho Postgres. |
| **`BUG-03`** | Đọc Oracle `TIMESTAMPTZ` nhị phân làm crash Jackson. | Thêm `sanitizeValue()` chuyển object sang ISO-8601 String. |
| **`BUG-04`** | Tải file qua thẻ `<a>` bị 401 hoặc tạo lỗ hổng IDOR. | Áp dụng Pre-signed Token (HMAC-SHA256, TTL 15m). |
| **`BUG-05`** | Câu SQL CTE bị bọc sai thành `SELECT * FROM (WITH ...)`. | Tách mệnh đề `WITH` ra đầu (top-level scope) trước khi bọc truy vấn. |
| **`BUG-06`** | Thông báo lỗi thô từ JDBC (`ORA-00942`, `42P01`). | Bắt `BadSqlGrammarException`, chuyển sang tiếng Việt thân thiện. |
| **`BUG-07`** | Quét Schema Oracle bị timeout do quét bảng hệ thống (`SYS`). | Bổ sung Schema Pattern filter: Ép `schema = username.toUpperCase()`. |
| **`BUG-08`** | URL seed hardcode hostname Docker gây lỗi chạy local. | Sử dụng biến môi trường trong cấu hình Flyway, fallback localhost. |
| **`BUG-09`** | Bắt buộc nhập Value với toán tử Unary (`IS NULL`, `IS NOT NULL`). | Bỏ qua validation bắt buộc đối với các toán tử không yêu cầu đối số. |
| **`BUG-10`** | Tham số `LIMIT {{params.n}}` bị thay bằng chuỗi `'dummy'`. | Dùng Regex thay thế biến sau `LIMIT`/`OFFSET` bằng số nguyên (vd: `100`). |
| **`BUG-11`** | API từ chối request có SQL nếu không có cờ `mode: "SQL"`. | Cập nhật auto-fallback: Ưu tiên phân tích nếu `request.getSql()` không rỗng. |
| **`BUG-12`** | Dropdown rỗng trên Oracle do so sánh hoa thường khắt khe. | Chuẩn hóa state metadata bằng `toUpperCase()` khi so sánh các khóa. |

---

## 5. HIỆN THỰC HÓA 7 KHOẢNG TRỐNG KIẾN TRÚC & BẢO MẬT LÕI (GAP-01 ĐẾN GAP-07)

### 5.1. GAP-01: Phân Quyền DataSource Chi Tiết Cho Từng User

```sql
-- 1. Flyway Migration SQL
CREATE TABLE RPT_USER_DATASOURCE_PERMISSIONS (
    TENANT_ID           VARCHAR(50) NOT NULL,
    USER_ID             VARCHAR(100) NOT NULL,
    DATASOURCE_CODE     VARCHAR(50) NOT NULL,
    IS_READ_ONLY        BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (TENANT_ID, USER_ID, DATASOURCE_CODE)
);
```

```java
// 2. Aspect Authorization (Java 21)
@Aspect
@Component
public class DataSourcePermissionAspect {
    @Autowired 
    private PermissionRepository permRepo;
    
    @Before("execution(* io.chapisoft.report.application.service.QueryExecutionService.execute*(..)) && args(request,..)")
    public void checkPermission(JoinPoint joinPoint, QueryRequest request) {
        String tenantId = TenantContext.getTenantId();
        String userId = TenantContext.getUserId();
        
        boolean hasAccess = permRepo.existsByTenantIdAndUserIdAndDatasourceCode(tenantId, userId, request.getDataSourceCode());
        if (!hasAccess) {
            throw new SecurityViolationException("403", "User does not have access to this DataSource");
        }
    }
}
```

---

### 5.2. GAP-02: Cơ Chế Pre-Signed Download Token

```java
// 1. Sinh Token khi Export thành công
public String generateDownloadToken(String taskId, String tenantId, String userId) {
    long expirationTime = System.currentTimeMillis() + (15 * 60 * 1000); // 15 phút
    return Jwts.builder()
            .setSubject(taskId)
            .claim("tenantId", tenantId)
            .claim("userId", userId)
            .setExpiration(new Date(expirationTime))
            .signWith(SignatureAlgorithm.HS256, secretKey.getBytes(StandardCharsets.UTF_8))
            .compact();
}

// 2. Endpoint Tải File
@GetMapping("/download")
public ResponseEntity<Resource> downloadFile(@RequestParam("token") String token) {
    Claims claims = Jwts.parser()
            .setSigningKey(secretKey.getBytes(StandardCharsets.UTF_8))
            .parseClaimsJws(token)
            .getBody();
            
    String taskId = claims.getSubject();
    File file = exportTaskService.getExportedFile(taskId);
    
    return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + file.getName() + "\"")
            .body(new FileSystemResource(file));
}
```

---

### 5.3. GAP-03: Nhật Ký Kiểm Toán Truy Vấn (Query Audit Logs)

```java
@Aspect
@Component
public class QueryAuditAspect {
    @Autowired 
    private AuditLogRepository auditLogRepo;
    
    @Around("execution(* io.chapisoft.report.application.service.QueryExecutionService.execute*(..))")
    public Object auditQuery(ProceedingJoinPoint pjp) throws Throwable {
        long start = System.currentTimeMillis();
        String status = "SUCCESS";
        String errorMessage = null;
        Object result = null;
        try {
            result = pjp.proceed();
            return result;
        } catch (Exception ex) {
            status = "FAILED";
            errorMessage = ex.getMessage();
            throw ex;
        } finally {
            long duration = System.currentTimeMillis() - start;
            saveAuditLogAsync(TenantContext.getTenantId(), TenantContext.getUserId(), duration, status, errorMessage);
        }
    }
}
```

---

### 5.4. GAP-04: Multi-DB Dialect Resolver Đa Hình

```java
public interface DatabaseDialect {
    String wrapPagination(String rawSql, int limit, int offset);
}

@Component
public class OracleDialect implements DatabaseDialect {
    @Override
    public String wrapPagination(String rawSql, int limit, int offset) {
        return "SELECT * FROM (" + rawSql + ") OFFSET " + offset + " ROWS FETCH NEXT " + limit + " ROWS ONLY";
    }
}

@Component
public class PostgresDialect implements DatabaseDialect {
    @Override
    public String wrapPagination(String rawSql, int limit, int offset) {
        return "SELECT * FROM (" + rawSql + ") AS wrapper LIMIT " + limit + " OFFSET " + offset;
    }
}
```

---

### 5.5. GAP-05: Scheduler Quét Dọn File Tạm Với ShedLock

```java
@Component
public class HousekeepingScheduler {
    @Scheduled(cron = "0 0 * * * *")
    @SchedulerLock(name = "cleanupTempFilesLock", lockAtMostFor = "30m", lockAtLeastFor = "15m")
    public void cleanupTempFiles() {
        File tempDir = new File("/app/temp/exports");
        long expirationTime = System.currentTimeMillis() - (2 * 3600 * 1000); // Quá 2 giờ
        
        File[] files = tempDir.listFiles();
        if (files != null) {
            for (File file : files) {
                if (file.lastModified() < expirationTime) {
                    file.delete();
                }
            }
        }
    }
}
```

---

### 5.6. GAP-06: Giới Hạn Thời Gian & Chống Quá Tải (Rate Limiting)

```java
// 1. Query Timeout
JdbcTemplate jdbcTemplate = new JdbcTemplate(dataSource);
jdbcTemplate.setQueryTimeout(30); // Giới hạn 30 giây ở tầng CSDL
jdbcTemplate.query(sql, resultSetExtractor);

// 2. Rate Limiting (Bucket4j)
private final Map<String, Bucket> userBuckets = new ConcurrentHashMap<>();

public boolean tryConsume(String userId) {
    Bucket bucket = userBuckets.computeIfAbsent(userId, k -> 
        Bucket.builder()
            .addLimit(Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(1)))) // 10 req/phút
            .build()
    );
    return bucket.tryConsume(1);
}
```

---

### 5.7. GAP-07: Quản Lý Lịch Sử Phiên Bản Template

```java
@Transactional
public void updateTemplate(String templateCode, TemplateUpdateRequest request) {
    ReportTemplate current = templateRepo.findByCode(templateCode);
    
    // 1. Sao lưu phiên bản hiện tại
    TemplateVersion backup = new TemplateVersion();
    BeanUtils.copyProperties(current, backup);
    backup.setId(null); // ID tự sinh
    backup.setVersionNumber(current.getVersionNumber());
    templateVersionRepo.save(backup);
    
    // 2. Cập nhật bản mới
    current.setConfigJson(request.getConfigJson());
    current.setVersionNumber(current.getVersionNumber() + 1);
    templateRepo.save(current);
}
```

---

## 6. NÂNG CẤP TRỰC QUAN HÓA SỐ LIỆU, BI VISUALIZATION & UX/UI

### 6.1. Bảng Tối Ưu Hóa Trải Nghiệm Người Dùng (UX/UI Audit)

| Vấn Đề Trải Nghiệm (UX Friction) | Giải Pháp Tối Ưu (UI Improvements) |
| :--- | :--- |
| **Trùng lặp Nút Xuất File** | Hợp nhất thành 1 nút Xuất duy nhất ở Header. Footer chỉ dùng làm Status Bar (hiển thị số dòng, thời gian thực thi). |
| **Thông báo Lỗi (Error) Thô** | Bọc bằng Friendly Error State Card: Icon cảnh báo, thông báo tiếng Việt dễ hiểu, nút "Thử lại", giấu lỗi kỹ thuật (Axios/ORA) vào nút "Chi tiết". |
| **Cố định Backend URL** | Trong Partner Auth Modal, bổ sung mục "Cài đặt kết nối nâng cao" cho phép cấu hình URL trỏ tới máy chủ khác (localhost/staging) lưu qua localStorage. |
| **Mất dữ liệu khi đổi Mode** | Thêm Hộp thoại Cảnh báo xác nhận trước khi chuyển từ SQL sang GUI để tránh mất dữ liệu; tự động lưu SQL nháp (Drafts). |
| **Khó khám phá dữ liệu** | Thêm nút "Xem nhanh 10 dòng mẫu" (Quick Sample) cạnh tên bảng trong Schema Tree. Hỗ trợ Click đúp chèn tên cột. |
| **Quản lý Mẫu Báo cáo yếu** | Thêm Filter Chips theo DataSource, thẻ Tag màu sắc (No-Code/SQL), và nút "Nhân bản mẫu (Clone)". |
| **Thiếu Lịch sử DWH Sync** | Bổ sung bảng "Nhật Ký Đồng Bộ DWH Gần Nhất" (Thời gian, Bảng, Số bản ghi, Thời lượng, Trạng thái) trong `/configs/dwh-sync`. |

---

### 6.2. Module BI Dashboard Recharts Component

```typescript
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';

export const DynamicBarChart = ({ 
  data, 
  xAxisKey, 
  yAxisKey 
}: { 
  data: any[]; 
  xAxisKey: string; 
  yAxisKey: string 
}) => (
  <ResponsiveContainer width="100%" height={300}>
    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={xAxisKey} />
      <YAxis />
      <Tooltip />
      <Bar dataKey={yAxisKey} fill="#3b82f6" radius={[4, 4, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
);
```

---

### 6.3. Nâng Cấp Định Dạng File Excel Chuyên Nghiệp

```java
// Style tiền tệ VNĐ và Style Header
CellStyle currencyStyle = workbook.createCellStyle();
currencyStyle.setDataFormat(workbook.createDataFormat().getFormat("#,##0 \"₫\""));

// Đóng băng dòng Header & Kích hoạt Auto-filter
sheet.createFreezePane(0, 1);
sheet.setAutoFilter(new CellRangeAddress(0, rowCount, 0, colCount - 1));

// Chèn dòng Tổng cộng
Row totalRow = sheet.createRow(rowCount + 1);
totalRow.createCell(0).setCellValue("TỔNG CỘNG");
Cell sumCell = totalRow.createCell(1);
sumCell.setCellFormula("SUM(B2:B" + (rowCount + 1) + ")");
```

---

## 7. TỰ ĐỘNG HÓA ĐỒNG BỘ DWH & ĐẶC TẢ RESTful API CONTRACTS

### 7.1. Bảng Cơ Chế & Cấu Hình Thời Gian Đồng Bộ Dữ Liệu (Sync Schedules)

| Phương Thức Đồng Bộ | Tần Suất Lập Lịch (Schedule) | Cơ Chế Triển Khai | Ứng Dụng Thực Tế |
| :--- | :--- | :--- | :--- |
| **1. Direct Query (Zero-Sync)** | Không cần đồng bộ | Truy vấn trực tiếp qua Read-Only JDBC Pool | Hệ thống đã có sẵn Kho dữ liệu Data Warehouse (PostgreSQL, ClickHouse). |
| **2. Real-time Event CDC** | Tức thời ($\le 1\text{-}3\text{s}$) | `KafkaOlapConsumer.java` theo topic `{tenant}.events.*` | Hệ thống có hạ tầng Kafka/RabbitMQ phát sự kiện giao dịch. |
| **3. Batch Sync Bù Định Kỳ** | Mỗi 60 phút (`0 0 * * * *`) | `DwhBatchSyncJob.java` (ShedLock) quét Lookback 2h | Tự động đồng bộ bù dữ liệu chênh lệch giữa OLTP và OLAP. |
| **4. Nightly Reconcile** | 00:30 AM hàng ngày (`0 30 0 * * *`) | `DwhNightlyReconcileJob.java` quét 24h qua | Đối soát toàn diện số lượng bản ghi và doanh thu ngày hôm trước. |
| **5. Refresh Materialized Views** | Mỗi 15 phút (`0 */15 * * * *`) | `OlapRefreshScheduler.java` | Làm mới các View tổng hợp tăng tốc độ truy vấn báo cáo lớn. |
| **6. REST Ingestion API** | Theo yêu cầu (On-demand) | `POST /api/v1/reports/dwh/ingest/{table}` | Dành cho hệ thống nhẹ gửi dữ liệu qua HTTP Webhook. |

---

### 7.2. Bảng Đặc Tả RESTful API Contracts Độc Lập

| Phương thức | Đường dẫn API | Chức năng | Header bắt buộc |
| :---: | :--- | :--- | :--- |
| `GET` | `/api/v1/reports/datasources` | Lấy danh sách kết nối CSDL theo Tenant | `X-Tenant-Id` / JWT |
| `POST` | `/api/v1/reports/datasources` | Thêm mới kết nối CSDL (JDBC URL mã hóa) | `X-Tenant-Id` (Admin) |
| `GET` | `/api/v1/reports/schema/{datasourceCode}` | Khám phá cây thư mục Bảng & Cột động | `X-Tenant-Id` / JWT |
| `POST` | `/api/v1/reports/preview` | Xem trước kết quả (AST / SQL, giới hạn 50 dòng) | `X-Tenant-Id` / JWT |
| `POST` | `/api/v1/reports/templates` | Tạo mới mẫu cấu hình báo cáo (GUI hoặc SQL) | `X-Tenant-Id` / JWT |
| `GET` | `/api/v1/reports/templates` | Lấy danh sách mẫu theo Tenant (Active/Archived) | `X-Tenant-Id` / JWT |
| `GET` | `/api/v1/reports/templates/{code}` | Lấy chi tiết cấu hình 1 mẫu báo cáo | `X-Tenant-Id` / JWT |
| `PUT` | `/api/v1/reports/templates/{code}` | Cập nhật cấu hình mẫu báo cáo | `X-Tenant-Id` / JWT |
| `DELETE` | `/api/v1/reports/templates/{code}` | Xóa mềm mẫu báo cáo | `X-Tenant-Id` / JWT |
| `POST` | `/api/v1/reports/export/excel` | Xuất file Excel (`.xlsx`) SXSSF Streaming | `X-Tenant-Id` / `X-API-Key` |
| `POST` | `/api/v1/reports/export/csv` | Xuất file CSV SXSSF Streaming | `X-Tenant-Id` / `X-API-Key` |
| `POST` | `/api/v1/reports/dwh/sync/manual` | Kích hoạt đồng bộ bù thủ công theo khoảng ngày | `X-Tenant-Id` (Admin) |
| `GET` | `/api/v1/reports/templates/published` | Lấy danh sách các mẫu báo cáo đã xuất bản thành Menu | `X-Tenant-Id` / JWT |

---

## 8. XÁC THỰC ĐA NỀN TẢNG, ROW-LEVEL SECURITY & XUẤT BẢN MENU

### 8.1. Bảng Ma Trận Phân Quyền Trên Nền Tảng Tích Hợp

| Đối Tượng Người Dùng | Quyền Hạn Trên Report Engine | Giao Diện Được Phép Truy Cập |
| :--- | :--- | :--- |
| **System Admin / Tech Lead** | Quản lý toàn diện DataSource, cấu hình DWH Sync, phân quyền Tenant | `/admin/configs/dwh-sync`, `/reports/templates`, `/reports/builder` |
| **Data Analyst / Designer** | Tạo mới, thử nghiệm SQL, thiết kế GUI, Xuất bản (Publish to Menu) | `/reports/builder`, `/reports/templates` |
| **Giao Dịch Viên / Kế Toán**<br>*(End-User)* | Chỉ chạy báo cáo, chọn tham số lọc và xuất file Excel/CSV | Dedicated Menu Route (`/reports/custom/[code]`), **Tuyệt đối không thấy Builder/SQL** |

---

## 9. TIÊU CHÍ NGHIỆM THU HOÀN THÀNH (DEFINITION OF DONE)

* [x] **Chất lượng mã nguồn**: Vượt qua 100% các bài Unit Test tầng Core Backend, không còn lỗi TypeScript/ESLint tại Frontend khi chạy script `./scripts/local_ci.sh`.
* [x] **Khả năng chịu tải**: Xuất thành công file báo cáo Excel dung lượng 100.000 dòng dữ liệu liên tục trong thời gian dưới 45 giây mà mức sử dụng RAM của dịch vụ không tăng quá 50MB.
* [x] **Bảo mật & Phân quyền**: 100% các câu lệnh phá hoại (DML/DDL) bị AST Sandbox chặn đứng với HTTP 403; dữ liệu nhạy cảm PII hiển thị dạng masked (`090****567`) đối với tài khoản không có quyền Admin.
* [x] **Tính năng vận hành**: Gửi tự động thành công báo cáo PDF chuẩn A4 và Excel qua Email/Telegram theo lịch đặt trước.
* [x] **Tích hợp hệ thống đích**: Nhúng thành công trên nền tảng DIP Platform và Micro-CRM qua Standalone Iframe Viewer với Delegated Token SSO và Row-Level Security hoạt động chính xác.
