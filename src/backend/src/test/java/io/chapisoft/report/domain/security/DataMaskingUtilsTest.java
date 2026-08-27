package io.chapisoft.report.domain.security;

import io.chapisoft.report.domain.model.TenantContext;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class DataMaskingUtilsTest {

    @Test
    @DisplayName("Làm mờ số điện thoại Việt Nam chuẩn 10 chữ số")
    void testMaskPhoneNumber_10Digits() {
        String raw = "0901234567";
        String masked = DataMaskingUtils.maskPhoneNumber(raw);
        assertEquals("090****567", masked);
    }

    @Test
    @DisplayName("Làm mờ số điện thoại có tiền tố +84")
    void testMaskPhoneNumber_InternationalPrefix() {
        String raw = "+84901234567";
        String masked = DataMaskingUtils.maskPhoneNumber(raw);
        assertEquals("+84-90****567", masked);
    }

    @Test
    @DisplayName("Làm mờ số CCCD 12 số")
    void testMaskIdNumber_CCCD12Digits() {
        String raw = "001099123456";
        String masked = DataMaskingUtils.maskIdNumber(raw);
        assertEquals("0010******56", masked);
    }

    @Test
    @DisplayName("Làm mờ số CMND 9 số")
    void testMaskIdNumber_CMND9Digits() {
        String raw = "012345678";
        String masked = DataMaskingUtils.maskIdNumber(raw);
        assertEquals("012***678", masked);
    }

    @Test
    @DisplayName("Làm mờ địa chỉ Email chuẩn")
    void testMaskEmail() {
        String raw = "hoangmelinh@gmail.com";
        String masked = DataMaskingUtils.maskEmail(raw);
        assertEquals("h***@gmail.com", masked);
    }

    @Test
    @DisplayName("Làm mờ Số tài khoản ngân hàng")
    void testMaskBankAccount() {
        String raw = "1903678912345";
        String masked = DataMaskingUtils.maskBankAccount(raw);
        assertTrue(masked.contains("******"));
        assertTrue(masked.startsWith("1903"));
    }

    @Test
    @DisplayName("Làm mờ dữ liệu theo tên cột tương ứng")
    void testMaskValue_ByColumnNames() {
        assertEquals("098****321", DataMaskingUtils.maskValue("SDT", "0987654321"));
        assertEquals("098****321", DataMaskingUtils.maskValue("phone_number", "0987654321"));
        assertEquals("0380******99", DataMaskingUtils.maskValue("so_cccd", "038099123499"));
        assertEquals("a***@company.vn", DataMaskingUtils.maskValue("contact_email", "admin@company.vn"));
    }

    @Test
    @DisplayName("Làm mờ toàn bộ dòng dữ liệu với nhiều trường PII")
    void testMaskRow() {
        Map<String, Object> row = new HashMap<>();
        row.put("full_name", "Nguyen Van A");
        row.put("phone", "0912345678");
        row.put("cccd", "001088123456");
        row.put("email", "nguyenvana@gmail.com");
        row.put("revenue", 5000000);

        Map<String, Object> maskedRow = DataMaskingUtils.maskRow(row, true);

        assertEquals("Nguyen Van A", maskedRow.get("full_name"));
        assertEquals("091****678", maskedRow.get("phone"));
        assertEquals("0010******56", maskedRow.get("cccd"));
        assertEquals("n***@gmail.com", maskedRow.get("email"));
        assertEquals(5000000, maskedRow.get("revenue"));
    }

    @Test
    @DisplayName("Admin / Super Admin không bị làm mờ dữ liệu")
    void testShouldMask_AdminBypass() {
        TenantContext adminCtx = TenantContext.builder()
                .tenantId("DIP_BHXH")
                .userId("admin_01")
                .roles(Set.of("ADMIN"))
                .build();

        assertFalse(DataMaskingUtils.shouldMask(adminCtx));

        TenantContext userCtx = TenantContext.builder()
                .tenantId("DIP_BHXH")
                .userId("user_01")
                .roles(Set.of("USER"))
                .build();

        assertTrue(DataMaskingUtils.shouldMask(userCtx));
    }
}
