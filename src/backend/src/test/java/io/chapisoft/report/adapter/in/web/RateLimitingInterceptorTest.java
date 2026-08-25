package io.chapisoft.report.adapter.in.web;

import io.chapisoft.report.adapter.in.web.interceptor.RateLimitingInterceptor;
import io.chapisoft.report.domain.model.ReportConstants;
import io.chapisoft.report.domain.model.TenantContext;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimitingInterceptorTest {

    private RateLimitingInterceptor interceptor;

    @BeforeEach
    void setUp() {
        interceptor = new RateLimitingInterceptor();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Cho phép tối đa request theo cấu hình cho 1 User, chặn request vượt mức với mã 429 (GAP-06)")
    void shouldEnforceRateLimitPerUser() throws Exception {
        TenantContext context = TenantContext.builder()
                .tenantId("DIP_BHXH")
                .userId("user_test_01")
                .roles(Collections.singleton(ReportConstants.DEFAULT_ROLE_USER))
                .build();
        TenantContext.set(context);

        int capacity = ReportConstants.DEFAULT_RATE_LIMIT_CAPACITY;

        // Các request đầu tiên trong dung lượng bucket phải thành công
        for (int i = 1; i <= capacity; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/reports/datasources");
            MockHttpServletResponse response = new MockHttpServletResponse();

            boolean allowed = interceptor.preHandle(request, response, new Object());
            assertThat(allowed).as("Request " + i + " phải được cho phép").isTrue();
            assertThat(response.getStatus()).isEqualTo(200);
        }

        // Request kế tiếp phải bị từ chối với HTTP 429
        MockHttpServletRequest blockedRequest = new MockHttpServletRequest("GET", "/api/v1/reports/datasources");
        MockHttpServletResponse blockedResponse = new MockHttpServletResponse();

        boolean allowedExceeded = interceptor.preHandle(blockedRequest, blockedResponse, new Object());
        assertThat(allowedExceeded).as("Request vượt hạn mức phải bị chặn").isFalse();
        assertThat(blockedResponse.getStatus()).isEqualTo(429);
        assertThat(blockedResponse.getContentAsString()).contains("TOO_MANY_REQUESTS");
    }

    @Test
    @DisplayName("Bỏ qua kiểm tra Rate Limit đối với HTTP OPTIONS (Preflight)")
    void shouldBypassOptionsRequests() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("OPTIONS", "/api/v1/reports/datasources");
        MockHttpServletResponse response = new MockHttpServletResponse();

        boolean allowed = interceptor.preHandle(request, response, new Object());
        assertThat(allowed).isTrue();
    }

    @Test
    @DisplayName("Các User khác nhau có bucket độc lập")
    void shouldIsolateRateLimitsBetweenDifferentUsers() throws Exception {
        int capacity = ReportConstants.DEFAULT_RATE_LIMIT_CAPACITY;

        // User 1 dùng hết tokens
        TenantContext.set(TenantContext.builder().tenantId("DIP_BHXH").userId("user_1").build());
        for (int i = 1; i <= capacity; i++) {
            interceptor.preHandle(new MockHttpServletRequest(), new MockHttpServletResponse(), new Object());
        }

        // User 2 vẫn phải gửi được bình thường
        TenantContext.set(TenantContext.builder().tenantId("DIP_BHXH").userId("user_2").build());
        MockHttpServletResponse user2Response = new MockHttpServletResponse();
        boolean user2Allowed = interceptor.preHandle(new MockHttpServletRequest(), user2Response, new Object());

        assertThat(user2Allowed).isTrue();
        assertThat(user2Response.getStatus()).isEqualTo(200);
    }
}
