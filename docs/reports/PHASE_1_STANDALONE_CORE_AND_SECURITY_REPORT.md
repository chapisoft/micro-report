# BÁO CÁO NGHIỆM THU KỸ THUẬT: PHASE 1 - STANDALONE ENGINE CORE, MULTI-TENANCY & SECURITY SANDBOX

- **Pha thực hiện**: Pha 1 (Ngày 1 - Ngày 3)
- **Mục tiêu**: Xây dựng nền tảng Động cơ Báo cáo Độc lập (Standalone Microservice), kiến trúc Cô lập Đa người thuê (Multi-Tenancy), Quản lý kết nối CSDL động đa nền tảng và AST Security Sandbox.
- **Trạng thái**: ĐÃ HOÀN THÀNH VÀ KIỂM THỬ 100% PASS

---

## 1. Danh Sách Các Tính Năng Đã Triển Khai

### 1.1. DDL Migration & Schema Metadata Engine (Task 1.1)
- Xây dựng các script Flyway migration (`V1__init_report_engine_metadata.sql`, `V2__seed_datasources_and_templates.sql`).
- Thiết kế các bảng cốt lõi phục vụ vận hành độc lập:
  - `RPT_TENANTS`: Quản lý danh mục đối tác thuê hệ thống (`DIP_BHXH`, `NATCASH`, `MASCOM_ERP`).
  - `RPT_DATASOURCES`: Quản lý danh mục kết nối JDBC đa CSDL kèm mật khẩu mã hóa.
  - `RPT_TEMPLATES`: Quản lý cấu hình mẫu báo cáo (chế độ GUI JSON / SQL Query).
  - `RPT_EXPORT_TASKS`: Quản lý trạng thái và tiến độ các tác vụ xuất file nền.
  - `RPT_AUDIT_LOGS`: Ghi vết lịch sử truy vấn và kiểm toán bảo mật.

### 1.2. Cô Lập Đa Người Thuê & Xác Thực Phiên Làm Việc (Task 1.2)
- Xây dựng `TenantContext.java` lưu trữ định danh `tenantId`, `userId`, `userName`, `roles` theo ThreadLocal an toàn cho từng request.
- Xây dựng `TenantAuthFilter.java` trích xuất thông tin xác thực từ Delegated JWT Token (`Authorization: Bearer <token>`) hoặc API Key (`X-API-Key` & `X-Tenant-Id`).
- Chặn đứng 401 Unauthorized nếu yêu cầu không mang thông tin xác thực hợp lệ.

### 1.3. Trình Quản Lý Kết Nối CSDL Động Đa Nền Tảng (Task 1.3)
- Xây dựng `DynamicDataSourceManager.java` quản lý vòng đời connection pool HikariCP độc lập theo từng CSDL của từng Tenant.
- Hỗ trợ đa dạng các hệ quản trị CSDL: PostgreSQL, Oracle Database 21c XE, MySQL, SQL Server.
- Cưỡng chế cấu hình `isReadOnly = true` trên mọi pool kết nối nhằm ngăn chặn các hành vi ghi đè dữ liệu.
- Xây dựng `AesEncryptionService.java` mã hóa/giải mã mật khẩu CSDL bằng thuật toán AES-256-GCM.

### 1.4. AST Security Sandbox & Dynamic Parameter Binding (Task 1.4)
- Xây dựng `SqlSecurityAstValidator.java` dựa trên `JSqlParser`:
  - Phân tích cây cú pháp trừu tượng (AST) của câu lệnh SQL.
  - Chặn đứng 100% các câu lệnh phá hoại DML/DDL: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `GRANT`, `CALL` với `SecurityViolationException` (HTTP 403).
  - Chặn kỹ thuật tấn công Multiple Statements (ngăn chặn dấu `;` chèn lệnh thứ hai).
- Xây dựng `DynamicParameterBinder.java`: Chuyển đổi an toàn các tham số `{{params.var}}` thành Named Parameters `:param_var` chống SQL Injection.
- Xây dựng cơ chế đa hình phân trang `DatabaseDialect`:
  - PostgreSQL Dialect: `LIMIT :limit OFFSET :offset`.
  - Oracle Dialect: `WHERE ROWNUM <= :limit` hoặc `FETCH FIRST :limit ROWS ONLY`.

---

## 2. Bảng Chi Tiết File Thay Đổi & Lý Do Kỹ Thuật

| STT | Đường Dẫn File | Thao Tác | Nội Dung & Mục Đích Kỹ Thuật |
| :---: | :--- | :---: | :--- |
| 1 | `src/backend/.../resources/db/migration/V1__init_report_engine_metadata.sql` | NEW | Khởi tạo cấu trúc bảng metadata hệ thống báo cáo độc lập. |
| 2 | `src/backend/.../resources/db/migration/V2__seed_datasources_and_templates.sql` | NEW | Dữ liệu mẫu khởi tạo kết nối CSDL và template báo cáo doanh thu. |
| 3 | `src/backend/.../domain/model/TenantContext.java` | NEW | Quản lý định danh người thuê dạng ThreadLocal độc lập. |
| 4 | `src/backend/.../web/filter/TenantAuthFilter.java` | NEW | Bộ lọc xác thực JWT Token và API Key phân luồng Multi-Tenancy. |
| 5 | `src/backend/.../service/DynamicDataSourceManager.java` | NEW | Khởi tạo và quản lý HikariPool động cho từng kết nối CSDL. |
| 6 | `src/backend/.../security/AesEncryptionService.java` | NEW | Mã hóa mật khẩu CSDL an toàn bằng thuật toán AES-256-GCM. |
| 7 | `src/backend/.../security/SqlSecurityAstValidator.java` | NEW | AST Security Sandbox kiểm tra và chặn đứng các lệnh DML/DDL. |
| 8 | `src/backend/.../security/DynamicParameterBinder.java` | NEW | Trích xuất và bind tham số `{{params.var}}` sang Named Parameters. |
| 9 | `src/backend/.../dialect/DatabaseDialect.java` | NEW | Interface đa hình xử lý phân trang theo dialect CSDL. |
| 10 | `src/backend/.../dialect/OracleDialect.java` & `PostgresDialect.java` | NEW | Hiện thực cú pháp phân trang cho Oracle (ROWNUM) và Postgres (LIMIT). |
| 11 | `src/backend/.../service/QueryExecutionService.java` | NEW | Dịch vụ thực thi câu lệnh truy vấn preview và kiểm soát timeout. |
| 12 | `src/backend/.../web/DataSourceController.java` | NEW | RESTful API quản lý kết nối CSDL động. |
| 13 | `src/backend/.../security/SqlSecurityAstValidatorTest.java` | NEW | Bộ Unit Test kiểm thử AST Sandbox chặn DML/DDL và SQLi. |
| 14 | `src/backend/.../security/DynamicParameterBinderTest.java` | NEW | Bộ Unit Test kiểm thử tham số động Named Parameters. |
| 15 | `src/backend/.../security/DatabaseDialectTest.java` | NEW | Bộ Unit Test kiểm thử cú pháp phân trang Oracle và Postgres. |

---

## 3. Kết Quả Kiểm Thử & Nghiệm Thu (Verification)

| Hạng Mục Kiểm Thử | Lệnh Thực Thi | Kết Quả Đạt Được |
| :--- | :--- | :---: |
| Backend Unit Tests | `.\gradlew.bat test` | **BUILD SUCCESSFUL (100% PASS)** |
| AST Security Sandbox Test | 10 test cases chặn DML/DDL, Multiple Statements | **100% PASS** |
| Dynamic Parameter Binding Test | 5 test cases bind string, number, date params | **100% PASS** |
| Database Dialect Pagination Test | 4 test cases bọc phân trang Oracle & Postgres | **100% PASS** |
| AES-256 Encryption Test | Mã hóa và giải mã thông suốt | **100% PASS** |
