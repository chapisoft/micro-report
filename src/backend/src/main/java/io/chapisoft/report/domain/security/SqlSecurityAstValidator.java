package io.chapisoft.report.domain.security;

import io.chapisoft.report.domain.exception.SecurityViolationException;

import lombok.extern.slf4j.Slf4j;
import net.sf.jsqlparser.JSQLParserException;
import net.sf.jsqlparser.parser.CCJSqlParserUtil;
import net.sf.jsqlparser.statement.Statement;
import net.sf.jsqlparser.statement.Statements;
import net.sf.jsqlparser.statement.select.PlainSelect;
import net.sf.jsqlparser.statement.select.Select;
import net.sf.jsqlparser.statement.select.SetOperationList;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class SqlSecurityAstValidator {

    public void validateSafeSql(String sql) {
        if (sql == null || sql.trim().isEmpty()) {
            throw new SecurityViolationException("Câu lệnh SQL không được để trống.");
        }

        String cleanedSql = cleanSqlForValidation(sql);

        try {
            Statements statements = CCJSqlParserUtil.parseStatements(cleanedSql);

            if (statements.isEmpty()) {
                throw new SecurityViolationException("Không tìm thấy câu lệnh SQL hợp lệ.");
            }

            if (statements.size() > 1) {
                throw new SecurityViolationException("Chỉ cho phép thực thi một câu lệnh truy vấn đơn lẻ (Chặn multi-statement SQL).");
            }

            Statement statement = statements.get(0);

            if (!(statement instanceof Select selectStatement)) {
                log.warn("Blocked non-SELECT SQL statement: {}", statement.getClass().getSimpleName());
                throw new SecurityViolationException("Chỉ chấp nhận câu lệnh SELECT hoặc WITH ... SELECT. Phát hiện câu lệnh: " 
                        + statement.getClass().getSimpleName());
            }

            validateSelectStructure(selectStatement);

        } catch (JSQLParserException e) {
            log.error("SQL Parsing failed: {}", e.getMessage());
            throw new SecurityViolationException("Cú pháp SQL không hợp lệ hoặc chứa câu lệnh không an toàn: " + e.getMessage());
        }
    }

    private void validateSelectStructure(Select select) {
        if (select instanceof PlainSelect plainSelect) {
            if (plainSelect.getIntoTables() != null && !plainSelect.getIntoTables().isEmpty()) {
                throw new SecurityViolationException("Chặn mệnh đề SELECT INTO (Ghi dữ liệu trái phép).");
            }
        } else if (select instanceof SetOperationList setOperationList) {
            for (Select selectBody : setOperationList.getSelects()) {
                if (selectBody instanceof PlainSelect plainSelect && plainSelect.getIntoTables() != null && !plainSelect.getIntoTables().isEmpty()) {
                    throw new SecurityViolationException("Chặn mệnh đề SELECT INTO trong UNION/INTERSECT.");
                }
            }
        }
    }

    private String cleanSqlForValidation(String sql) {
        // Thay thế tạm các biến tham số dạng {{params.xyz}} bằng placeholder để JSqlParser parse cú pháp chuẩn
        return sql.replaceAll("\\{\\{params\\.[a-zA-Z0-9_]+\\}\\}", "'__PARAM_PLACEHOLDER__'");
    }
}
