package io.chapisoft.report.domain.security;

import io.chapisoft.report.domain.model.TenantContext;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

public final class DataMaskingUtils {

    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,6}$");
    private static final Pattern PHONE_PATTERN = Pattern.compile("^(\\+?84|0)(3|5|7|8|9)[0-9]{8}$");
    private static final Pattern CCCD_PATTERN = Pattern.compile("^[0-9]{9,12}$");

    private DataMaskingUtils() {
        // Utility class
    }

    public static boolean shouldMask(TenantContext context) {
        if (context == null) {
            return true;
        }
        return !context.isAdmin();
    }

    public static String maskPhoneNumber(String phone) {
        if (phone == null || phone.trim().isEmpty()) {
            return phone;
        }
        String clean = phone.trim().replaceAll("[\\s.-]", "");
        if (clean.length() < 7) {
            return clean;
        }
        if (clean.startsWith("+84") && clean.length() >= 11) {
            return "+84-" + clean.substring(3, 5) + "****" + clean.substring(clean.length() - 3);
        }
        if (clean.length() == 10) {
            return clean.substring(0, 3) + "****" + clean.substring(7);
        }
        if (clean.length() == 11) {
            return clean.substring(0, 4) + "****" + clean.substring(8);
        }
        return clean.substring(0, 3) + "****" + clean.substring(clean.length() - 3);
    }

    public static String maskIdNumber(String idNumber) {
        if (idNumber == null || idNumber.trim().isEmpty()) {
            return idNumber;
        }
        String clean = idNumber.trim();
        if (clean.length() >= 12) {
            // CCCD 12 số: 001099123456 -> 0010******56
            return clean.substring(0, 4) + "******" + clean.substring(clean.length() - 2);
        }
        if (clean.length() >= 9) {
            // CMND 9 số: 012345678 -> 012***678
            return clean.substring(0, 3) + "***" + clean.substring(clean.length() - 3);
        }
        return clean;
    }

    public static String maskEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return email;
        }
        String clean = email.trim();
        int atIndex = clean.indexOf('@');
        if (atIndex <= 0) {
            return clean;
        }
        String namePart = clean.substring(0, atIndex);
        String domainPart = clean.substring(atIndex);

        if (namePart.length() <= 1) {
            return namePart + "***" + domainPart;
        }
        return namePart.charAt(0) + "***" + domainPart;
    }

    public static String maskBankAccount(String account) {
        if (account == null || account.trim().isEmpty()) {
            return account;
        }
        String clean = account.trim();
        if (clean.length() >= 8) {
            // 1903678912345 -> 1903******2345
            int start = Math.min(4, clean.length() / 3);
            int end = clean.length() - Math.min(4, clean.length() / 3);
            return clean.substring(0, start) + "******" + clean.substring(end);
        }
        return clean;
    }

    public static Object maskValue(String columnName, Object rawValue) {
        if (rawValue == null) {
            return null;
        }
        String str = rawValue.toString();
        if (str.isEmpty()) {
            return str;
        }

        String col = columnName != null ? columnName.toLowerCase(Locale.ROOT) : "";

        // 1. Nhận diện theo tên cột
        if (col.contains("phone") || col.contains("tel") || col.contains("sdt") 
                || col.contains("dien_thoai") || col.contains("mobile")) {
            return maskPhoneNumber(str);
        }
        if (col.contains("cccd") || col.contains("cmnd") || col.contains("id_number") 
                || col.contains("identity") || col.contains("so_cccd")) {
            return maskIdNumber(str);
        }
        if (col.contains("email") || col.contains("mail") || col.contains("thu_dien_tu")) {
            return maskEmail(str);
        }
        if (col.contains("bank_account") || col.contains("account_no") 
                || col.contains("so_tai_khoan") || col.contains("card_number") || col.contains("stk")) {
            return maskBankAccount(str);
        }

        // 2. Nhận diện theo Regex pattern trên giá trị chuỗi
        if (EMAIL_PATTERN.matcher(str).matches()) {
            return maskEmail(str);
        }
        if (PHONE_PATTERN.matcher(str).matches()) {
            return maskPhoneNumber(str);
        }

        return rawValue;
    }

    public static Map<String, Object> maskRow(Map<String, Object> row, boolean isMasked) {
        if (!isMasked || row == null || row.isEmpty()) {
            return row;
        }
        Map<String, Object> masked = new LinkedHashMap<>();
        for (Map.Entry<String, Object> entry : row.entrySet()) {
            masked.put(entry.getKey(), maskValue(entry.getKey(), entry.getValue()));
        }
        return Collections.unmodifiableMap(masked);
    }
}
