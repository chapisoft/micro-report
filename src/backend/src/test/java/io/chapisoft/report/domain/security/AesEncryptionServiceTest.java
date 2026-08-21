package io.chapisoft.report.domain.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AesEncryptionServiceTest {

    private AesEncryptionService aesService;

    @BeforeEach
    void setUp() {
        aesService = new AesEncryptionService("MySecretKeyForTestingAES256Secret123!");
    }

    @Test
    @DisplayName("Mã hóa và giải mã chuỗi mật khẩu toàn vẹn")
    void shouldEncryptAndDecryptSuccessfully() {
        String originalPassword = "P@ssw0rdSecure_2026_Oracle#";
        String encrypted = aesService.encrypt(originalPassword);

        assertThat(encrypted).isNotEqualTo(originalPassword);

        String decrypted = aesService.decrypt(encrypted);
        assertThat(decrypted).isEqualTo(originalPassword);
    }
}
