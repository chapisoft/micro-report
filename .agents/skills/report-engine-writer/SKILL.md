---
name: report-engine-writer
description: Sinh code Java Spring Boot (Backend) cho phân hệ Báo Cáo Động Độc Lập (Micro-Report Engine).
  Sử dụng khi cần tạo API quản lý kết nối CSDL động (DataSource Manager), bộ phân tích an toàn SQL (JSqlParser AST Sandbox),
  bộ liên kết tham số động (Dynamic Parameter Binder), cơ chế xuất file Excel dung lượng lớn (SXSSF Streaming),
  hoặc các tác vụ lập lịch dọn dẹp vòng đời 3 tầng (ShedLock Housekeeping).
---

# Micro-Report Engine Backend Writer Skill

Skill này hướng dẫn sinh mã nguồn Java Spring Boot 3 chất lượng cao, an toàn và tối ưu cho phân hệ **Micro-Report Engine (Standalone Reporting Service)**.

## 1. Nguyên Tắc Kiến Trúc Bắt Buộc
1. **Kiến Trúc Hexagonal:**
   * `domain`: Models, DTOs, Enums, Exceptions, Validators (ví dụ: `SqlSecurityAstValidator`, `DynamicParameterBinder`).
   * `application/service`: Logic điều phối nghiệp vụ (ví dụ: `SchemaExplorerService`, `DynamicQueryExecutorService`, `SxssfStreamingExportService`).
   * `adapter/in/web`: REST Controllers (Multi-tenant context).
   * `adapter/in/scheduler`: ShedLock Scheduled Cronjobs.
   * `adapter/out/persistence`: Metadata Repository & Dynamic DataSource Connection Pools.
2. **Multi-Tenancy & Read-Only Enforcement:**
   * Mọi câu lệnh truy vấn metadata bắt buộc kèm `WHERE TENANT_ID = :tenantId`.
   * Mọi kết nối đến CSDL báo cáo ngoại vi phải kích hoạt `isReadOnly = true`.
3. **JSqlParser AST Sandbox:**
   * 100% câu lệnh SQL phải được phân tích cú pháp qua `JSqlParser`.
   * Chặn tuyệt đối: `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE`, `GRANT`, `REVOKE`, `EXECUTE`, `CALL`.
   * Chỉ cho phép `SELECT` hoặc `WITH ... SELECT`.

---

## 2. Quy Chuẩn Code & Clean Imports
* Tuân thủ quy chuẩn 4 nhóm import, không để import thừa, không dùng FQN:
  ```java
  package io.chapisoft.report.application.service;

  import io.chapisoft.report.domain.model.ReportTemplate;
  import io.chapisoft.report.domain.security.SqlSecurityAstValidator;

  import org.springframework.stereotype.Service;
  import org.springframework.transaction.annotation.Transactional;

  import java.util.List;
  import java.util.Map;
  ```

---

## 3. Mẫu Code Chuẩn Cho Các Thành Phần Cốt Lõi

### 3.1. Dynamic Parameter Binder
```java
public class DynamicParameterBinder {
    private static final Pattern PARAM_PATTERN = Pattern.compile("\\{\\{params\\.([a-zA-Z0-9_]+)\\}\\}");

    public BoundSql bind(String rawSql, Map<String, Object> inputParams) {
        Matcher matcher = PARAM_PATTERN.matcher(rawSql);
        StringBuffer sqlBuffer = new StringBuffer();
        MapSqlParameterSource paramSource = new MapSqlParameterSource();

        while (matcher.find()) {
            String paramName = matcher.group(1);
            Object paramValue = inputParams.get(paramName);
            String namedParam = "param_" + paramName;
            matcher.appendReplacement(sqlBuffer, ":" + namedParam);
            paramSource.addValue(namedParam, paramValue);
        }
        matcher.appendTail(sqlBuffer);
        return new BoundSql(sqlBuffer.toString(), paramSource);
    }
}
```

### 3.2. SXSSF Streaming Excel Exporter
```java
public void exportStreaming(String sql, MapSqlParameterSource params, OutputStream outputStream) throws IOException {
    try (SXSSFWorkbook workbook = new SXSSFWorkbook(500)) { // Giữ 500 dòng trên RAM, còn lại flush ra đĩa tạm
        Sheet sheet = workbook.createSheet("Report Data");
        
        olapJdbcTemplate.query(sql, params, (ResultSet rs) -> {
            ResultSetMetaData meta = rs.getMetaData();
            int colCount = meta.getColumnCount();
            
            // Header Row
            Row headerRow = sheet.createRow(0);
            for (int i = 1; i <= colCount; i++) {
                headerRow.createCell(i - 1).setCellValue(meta.getColumnLabel(i));
            }
            
            // Data Rows
            int rowIndex = 1;
            while (rs.next()) {
                Row row = sheet.createRow(rowIndex++);
                for (int i = 1; i <= colCount; i++) {
                    Object val = rs.getObject(i);
                    Cell cell = row.createCell(i - 1);
                    if (val instanceof Number num) {
                        cell.setCellValue(num.doubleValue());
                    } else if (val != null) {
                        cell.setCellValue(val.toString());
                    }
                }
            }
            return null;
        });

        workbook.write(outputStream);
        workbook.dispose(); // Xóa file tạm đĩa
    }
}
```
