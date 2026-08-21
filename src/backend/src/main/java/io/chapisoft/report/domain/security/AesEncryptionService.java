package io.chapisoft.report.domain.security;

import io.chapisoft.report.domain.exception.ReportEngineException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Base64;

@Service
public class AesEncryptionService {

    private final SecretKeySpec secretKey;

    public AesEncryptionService(@Value("${report.security.aes-secret-key:MascomReportEngineSecureSecretKey2026!#}") String secret) {
        try {
            byte[] key = secret.getBytes(StandardCharsets.UTF_8);
            MessageDigest sha = MessageDigest.getInstance("SHA-256");
            key = sha.digest(key);
            key = Arrays.copyOf(key, 16); // 128-bit AES Key
            this.secretKey = new SecretKeySpec(key, "AES");
        } catch (Exception e) {
            throw new ReportEngineException("Khởi tạo khóa mã hóa AES thất bại", e);
        }
    }

    public String encrypt(String strToEncrypt) {
        if (strToEncrypt == null || strToEncrypt.isEmpty()) {
            return strToEncrypt;
        }
        try {
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            return Base64.getEncoder().encodeToString(cipher.doFinal(strToEncrypt.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new ReportEngineException("Mã hóa thông tin kết nối thất bại", e);
        }
    }

    public String decrypt(String strToDecrypt) {
        if (strToDecrypt == null || strToDecrypt.isEmpty()) {
            return strToDecrypt;
        }
        try {
            Cipher cipher = Cipher.getInstance("AES/ECB/PKCS5Padding");
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            return new String(cipher.doFinal(Base64.getDecoder().decode(strToDecrypt)), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new ReportEngineException("Giải mã thông tin kết nối thất bại", e);
        }
    }
}
