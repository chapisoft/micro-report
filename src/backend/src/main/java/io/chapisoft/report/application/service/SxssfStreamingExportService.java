package io.chapisoft.report.application.service;

import io.chapisoft.report.adapter.out.persistence.ExportTaskRepository;
import io.chapisoft.report.application.dto.ExportRequest;
import io.chapisoft.report.application.dto.ExportTaskDto;
import io.chapisoft.report.domain.exception.ReportEngineException;
import io.chapisoft.report.domain.exception.SecurityViolationException;
import io.chapisoft.report.domain.export.PoiStyleFactory;
import io.chapisoft.report.domain.model.ExportTask;
import io.chapisoft.report.domain.model.QueryMode;
import io.chapisoft.report.domain.model.ReportConstants;
import io.chapisoft.report.domain.model.TaskStatus;
import io.chapisoft.report.domain.model.TenantContext;
import io.chapisoft.report.domain.security.BoundSql;
import io.chapisoft.report.domain.security.DataMaskingUtils;
import io.chapisoft.report.domain.security.DynamicParameterBinder;
import io.chapisoft.report.domain.security.SqlSecurityAstValidator;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.util.CellReference;
import org.apache.poi.xssf.streaming.SXSSFSheet;
import org.apache.poi.xssf.streaming.SXSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.BufferedWriter;
import java.io.File;
import java.io.FileOutputStream;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.sql.ResultSetMetaData;
import java.sql.Types;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Objects;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Slf4j
@Service
public class SxssfStreamingExportService {

    private final DynamicDataSourceManager dataSourceManager;
    private final ExportTaskRepository exportTaskRepository;
    private final SqlSecurityAstValidator sqlSecurityAstValidator;
    private final DynamicParameterBinder parameterBinder;
    private final QueryExecutionService queryExecutionService;

    @Value("${report.export.storage-dir:${report.export.temp-dir:./temp_exports}}")
    private String exportTempDir;

    @Value("${report.export.streaming-window-size:500}")
    private int streamingWindowSize;

    public SxssfStreamingExportService(
            DynamicDataSourceManager dataSourceManager,
            ExportTaskRepository exportTaskRepository,
            SqlSecurityAstValidator sqlSecurityAstValidator,
            DynamicParameterBinder parameterBinder,
            QueryExecutionService queryExecutionService) {
        this.dataSourceManager = dataSourceManager;
        this.exportTaskRepository = exportTaskRepository;
        this.sqlSecurityAstValidator = sqlSecurityAstValidator;
        this.parameterBinder = parameterBinder;
        this.queryExecutionService = queryExecutionService;
    }

    public ExportTaskDto exportToExcel(String tenantId, String createdBy, ExportRequest request) {
        String taskCode = ReportConstants.PREFIX_TASK_CODE + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String fileName = (request.getFileName() != null && !request.getFileName().trim().isEmpty())
                ? request.getFileName().trim()
                : "Report_" + taskCode;

        if (!fileName.endsWith(".xlsx")) {
            fileName += ".xlsx";
        }

        File targetDir = new File(exportTempDir);
        if (!targetDir.exists()) {
            targetDir.mkdirs();
        }
        File targetFile = new File(targetDir, taskCode + "_" + fileName);

        ExportTask task = ExportTask.builder()
                .taskCode(taskCode)
                .tenantId(tenantId)
                .templateId(request.getTemplateId())
                .fileName(fileName)
                .filePath(targetFile.getAbsolutePath())
                .status(TaskStatus.PROCESSING)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(ReportConstants.DEFAULT_EXPORT_EXPIRATION_HOURS, ChronoUnit.HOURS))
                .createdBy(createdBy != null ? createdBy : ReportConstants.CREATED_BY_SYSTEM)
                .build();

        exportTaskRepository.save(task);

        try {
            // 0. Kiểm tra phân quyền truy cập DataSource theo phiên (listDatasource)
            TenantContext ctx = TenantContext.get();
            if (ctx != null && !ctx.getAllowedDataSources().isEmpty()) {
                if (!ctx.getAllowedDataSources().contains(request.getDatasourceCode())) {
                    throw new SecurityViolationException("Truy cập bị từ chối: Nguồn dữ liệu '" 
                            + request.getDatasourceCode() + "' không nằm trong danh sách được ủy quyền cho phiên làm việc này.");
                }
            }

            String rawSql = resolveSql(request);
            sqlSecurityAstValidator.validateSafeSql(rawSql);
            BoundSql boundSql = parameterBinder.bind(rawSql, request.getParams());

            NamedParameterJdbcTemplate jdbcTemplate = dataSourceManager.getJdbcTemplate(tenantId, request.getDatasourceCode());
            AtomicInteger rowCount = new AtomicInteger(0);
            boolean shouldMask = DataMaskingUtils.shouldMask(ctx);

            try (SXSSFWorkbook workbook = new SXSSFWorkbook(streamingWindowSize);
                 FileOutputStream fos = new FileOutputStream(targetFile)) {

                workbook.setCompressTempFiles(true);
                Sheet sheet = workbook.createSheet(ReportConstants.DEFAULT_SHEET_NAME);
                if (sheet instanceof SXSSFSheet sxSheet) {
                    sxSheet.trackAllColumnsForAutoSizing();
                }

                PoiStyleFactory poiStyles = new PoiStyleFactory(workbook);

                jdbcTemplate.query(
                        Objects.requireNonNull(boundSql.sql()),
                        Objects.requireNonNull(boundSql.parameterSource()),
                        rs -> {
                    ResultSetMetaData metaData = rs.getMetaData();
                    int colCount = metaData.getColumnCount();

                    boolean[] isNumericCol = new boolean[colCount];
                    boolean[] isCurrencyCol = new boolean[colCount];
                    boolean[] isDateCol = new boolean[colCount];

                    // Header Row
                    Row headerRow = sheet.createRow(0);
                    headerRow.setHeightInPoints(24);

                    for (int i = 1; i <= colCount; i++) {
                        Cell cell = headerRow.createCell(i - 1);
                        String label = metaData.getColumnLabel(i);
                        cell.setCellValue(label);
                        cell.setCellStyle(poiStyles.getHeaderStyle());

                        int colType = metaData.getColumnType(i);
                        String upperLabel = label != null ? label.toUpperCase() : "";

                        isNumericCol[i - 1] = (colType == Types.INTEGER || colType == Types.BIGINT
                                || colType == Types.NUMERIC || colType == Types.DECIMAL
                                || colType == Types.DOUBLE || colType == Types.FLOAT || colType == Types.REAL);

                        isCurrencyCol[i - 1] = isNumericCol[i - 1] && (
                                upperLabel.contains("AMOUNT") || upperLabel.contains("TOTAL")
                                || upperLabel.contains("REVENUE") || upperLabel.contains("PRICE")
                                || upperLabel.contains("FEE") || upperLabel.contains("COMMISSION")
                                || upperLabel.contains("TIỀN") || upperLabel.contains("TIEN")
                                || upperLabel.contains("DOANH THU") || upperLabel.contains("DOANH_THU")
                                || upperLabel.contains("CHI PHÍ") || upperLabel.contains("CHI_PHI")
                        );

                        isDateCol[i - 1] = (colType == Types.DATE || colType == Types.TIMESTAMP || colType == Types.TIME);
                    }

                    // Data Rows
                    while (rs.next()) {
                        int rIdx = rowCount.incrementAndGet();
                        Row row = sheet.createRow(rIdx);
                        row.setHeightInPoints(18);

                        for (int i = 1; i <= colCount; i++) {
                            Cell cell = row.createCell(i - 1);
                            Object val = rs.getObject(i);
                            String colLabel = metaData.getColumnLabel(i);

                            if (shouldMask && val != null && !isNumericCol[i - 1] && !isDateCol[i - 1]) {
                                val = DataMaskingUtils.maskValue(colLabel, val);
                            }

                            if (val instanceof Number num) {
                                cell.setCellValue(num.doubleValue());
                                if (isCurrencyCol[i - 1]) {
                                    cell.setCellStyle(poiStyles.getCurrencyStyle());
                                } else {
                                    cell.setCellStyle(poiStyles.getNumberStyle());
                                }
                            } else if (val != null) {
                                cell.setCellValue(val.toString());
                                if (isDateCol[i - 1]) {
                                    cell.setCellStyle(poiStyles.getDateStyle());
                                } else {
                                    cell.setCellStyle(poiStyles.getTextStyle());
                                }
                            } else {
                                cell.setCellValue("");
                                cell.setCellStyle(poiStyles.getTextStyle());
                            }
                        }
                    }

                    // Tự động chèn dòng TỔNG CỘNG (Grand Total Row) nếu có ít nhất 1 dòng dữ liệu
                    int totalDataRows = rowCount.get();
                    if (totalDataRows > 0) {
                        int totalRowIdx = rowCount.incrementAndGet();
                        Row totalRow = sheet.createRow(totalRowIdx);
                        totalRow.setHeightInPoints(22);

                        Cell labelCell = totalRow.createCell(0);
                        labelCell.setCellValue("TỔNG CỘNG");
                        labelCell.setCellStyle(poiStyles.getTotalHeaderStyle());

                        for (int c = 1; c < colCount; c++) {
                            Cell totalCell = totalRow.createCell(c);
                            if (isNumericCol[c]) {
                                String colLetter = CellReference.convertNumToColString(c);
                                String sumFormula = "SUM(" + colLetter + "2:" + colLetter + (totalDataRows + 1) + ")";
                                totalCell.setCellFormula(sumFormula);
                                if (isCurrencyCol[c]) {
                                    totalCell.setCellStyle(poiStyles.getTotalCurrencyStyle());
                                } else {
                                    totalCell.setCellStyle(poiStyles.getTotalNumberStyle());
                                }
                            } else {
                                totalCell.setCellValue("");
                                totalCell.setCellStyle(poiStyles.getTotalHeaderStyle());
                            }
                        }
                    }

                    // Áp dụng Freeze Top Row và AutoFilter
                    PoiStyleFactory.applySheetFeatures(sheet, totalDataRows, colCount);

                    // Tự động căn chỉnh độ rộng cột tối thiểu để hiển thị rõ ràng số tiền và tiêu đề
                    for (int c = 0; c < colCount; c++) {
                        int colWidth = isCurrencyCol[c] ? 6500 : isDateCol[c] ? 5500 : 4800;
                        sheet.setColumnWidth(c, colWidth);
                    }

                    return null;
                });

                workbook.write(fos);
                workbook.dispose(); // Dọn dẹp file tạm trên ổ đĩa
            }

            long fileSizeBytes = targetFile.length();
            exportTaskRepository.updateStatus(taskCode, TaskStatus.READY, fileSizeBytes, rowCount.get());

            return ExportTaskDto.builder()
                    .taskCode(taskCode)
                    .tenantId(tenantId)
                    .fileName(fileName)
                    .filePath(targetFile.getAbsolutePath())
                    .fileSizeBytes(fileSizeBytes)
                    .rowCount(rowCount.get())
                    .status(TaskStatus.READY)
                    .createdAt(task.getCreatedAt())
                    .expiresAt(task.getExpiresAt())
                    .createdBy(task.getCreatedBy())
                    .downloadUrl("/api/v1/reports/export/download/" + taskCode)
                    .build();

        } catch (Exception e) {
            log.error("Lỗi khi xuất file Excel SXSSF: {}", e.getMessage(), e);
            exportTaskRepository.updateStatus(taskCode, TaskStatus.FAILED, 0L, 0);
            throw new ReportEngineException("Xuất file báo cáo thất bại: " + e.getMessage(), e);
        }
    }

    public ExportTaskDto exportToCsv(String tenantId, String createdBy, ExportRequest request) {
        String taskCode = ReportConstants.PREFIX_TASK_CODE + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        String fileName = (request.getFileName() != null && !request.getFileName().trim().isEmpty())
                ? request.getFileName().trim()
                : "Report_" + taskCode;

        if (!fileName.endsWith(".csv")) {
            fileName += ".csv";
        }

        File targetDir = new File(exportTempDir);
        if (!targetDir.exists()) {
            targetDir.mkdirs();
        }
        File targetFile = new File(targetDir, taskCode + "_" + fileName);

        ExportTask task = ExportTask.builder()
                .taskCode(taskCode)
                .tenantId(tenantId)
                .templateId(request.getTemplateId())
                .fileName(fileName)
                .filePath(targetFile.getAbsolutePath())
                .status(TaskStatus.PROCESSING)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(ReportConstants.DEFAULT_EXPORT_EXPIRATION_HOURS, ChronoUnit.HOURS))
                .createdBy(createdBy != null ? createdBy : ReportConstants.CREATED_BY_SYSTEM)
                .build();

        exportTaskRepository.save(task);

        try {
            // 0. Kiểm tra phân quyền truy cập DataSource theo phiên (listDatasource)
            TenantContext ctx = TenantContext.get();
            if (ctx != null && !ctx.getAllowedDataSources().isEmpty()) {
                if (!ctx.getAllowedDataSources().contains(request.getDatasourceCode())) {
                    throw new SecurityViolationException("Truy cập bị từ chối: Nguồn dữ liệu '" 
                            + request.getDatasourceCode() + "' không nằm trong danh sách được ủy quyền cho phiên làm việc này.");
                }
            }

            String rawSql = resolveSql(request);
            sqlSecurityAstValidator.validateSafeSql(rawSql);
            BoundSql boundSql = parameterBinder.bind(rawSql, request.getParams());

            NamedParameterJdbcTemplate jdbcTemplate = dataSourceManager.getJdbcTemplate(tenantId, request.getDatasourceCode());
            AtomicInteger rowCount = new AtomicInteger(0);
            boolean shouldMask = DataMaskingUtils.shouldMask(ctx);

            try (BufferedWriter writer = new BufferedWriter(new FileWriter(targetFile, StandardCharsets.UTF_8))) {
                // Thêm UTF-8 BOM để Excel mở CSV tiếng Việt không bị lỗi font
                writer.write(ReportConstants.UTF8_BOM);

                jdbcTemplate.query(
                        Objects.requireNonNull(boundSql.sql()),
                        Objects.requireNonNull(boundSql.parameterSource()),
                        rs -> {
                    ResultSetMetaData metaData = rs.getMetaData();
                    int colCount = metaData.getColumnCount();

                    // Header Row
                    StringBuilder header = new StringBuilder();
                    for (int i = 1; i <= colCount; i++) {
                        if (i > 1) header.append(",");
                        header.append(escapeCsv(metaData.getColumnLabel(i)));
                    }
                    header.append("\n");
                    try {
                        writer.write(header.toString());
                    } catch (IOException e) {
                        throw new RuntimeException(e);
                    }

                    // Data Rows
                    while (rs.next()) {
                        rowCount.incrementAndGet();
                        StringBuilder row = new StringBuilder();
                        for (int i = 1; i <= colCount; i++) {
                            if (i > 1) row.append(",");
                            Object val = rs.getObject(i);
                            String colLabel = metaData.getColumnLabel(i);
                            if (shouldMask && val != null) {
                                val = DataMaskingUtils.maskValue(colLabel, val);
                            }
                            row.append(escapeCsv(val != null ? val.toString() : ""));
                        }
                        row.append("\n");
                        try {
                            writer.write(row.toString());
                        } catch (IOException e) {
                            throw new RuntimeException(e);
                        }
                    }
                    return null;
                });
            }

            long fileSizeBytes = targetFile.length();
            exportTaskRepository.updateStatus(taskCode, TaskStatus.READY, fileSizeBytes, rowCount.get());

            return ExportTaskDto.builder()
                    .taskCode(taskCode)
                    .tenantId(tenantId)
                    .fileName(fileName)
                    .filePath(targetFile.getAbsolutePath())
                    .fileSizeBytes(fileSizeBytes)
                    .rowCount(rowCount.get())
                    .status(TaskStatus.READY)
                    .createdAt(task.getCreatedAt())
                    .expiresAt(task.getExpiresAt())
                    .createdBy(task.getCreatedBy())
                    .downloadUrl("/api/v1/reports/export/download/" + taskCode)
                    .build();

        } catch (Exception e) {
            log.error("Lỗi khi xuất file CSV: {}", e.getMessage(), e);
            exportTaskRepository.updateStatus(taskCode, TaskStatus.FAILED, 0L, 0);
            throw new ReportEngineException("Xuất file CSV thất bại: " + e.getMessage(), e);
        }
    }

    private String resolveSql(ExportRequest request) {
        if (request.getMode() == QueryMode.SQL && request.getSql() != null && !request.getSql().trim().isEmpty()) {
            return request.getSql();
        }
        if (request.getConfigJson() != null && !request.getConfigJson().trim().isEmpty()) {
            return queryExecutionService.generateSqlFromGuiConfig(request.getConfigJson());
        }
        throw new ReportEngineException("Không tìm thấy câu lệnh SQL để xuất dữ liệu.");
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
