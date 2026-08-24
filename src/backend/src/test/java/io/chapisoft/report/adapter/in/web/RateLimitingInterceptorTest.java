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
    @DisplayName("Cho phép tối đa 10 request/phút cho 1 User, chặn request thứ 11 với mã 429 (GAP-06)")
    void shouldEnforceRateLimitPerUser() throws Exception {
        TenantContext context = TenantContext.builder()
                .tenantId("DIP_BHXH")
                .userId("user_test_01")
                .roles(Collections.singleton(ReportConstants.DEFAULT_ROLE_USER))
                .build();
        TenantContext.set(context);

        // 10 request đầu tiên phải thành công
        for (int i = 1; i <= 10; i++) {
            MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/reports/datasources");
            MockHttpServletResponse response = new MockHttpServletResponse();

            boolean allowed = interceptor.preHandle(request, response, new Object());
            assertThat(allowed).as("Request " + i + " phải được cho phép").isTrue();
            assertThat(response.getStatus()).isEqualTo(200);
        }

        // Request thứ 11 phải bị từ chối với HTTP 429
        MockHttpServletRequest request11 = new MockHttpServletRequest("GET", "/api/v1/reports/datasources");
        MockHttpServletResponse response11 = new MockHttpServletResponse();

        boolean allowed11 = interceptor.preHandle(request11, response11, new Object());
        assertThat(allowed11).as("Request 11 phải bị chặn").isFalse();
        assertThat(response11.getStatus()).isEqualTo(429);
        assertThat(response11.getContentAsString()).contains("TOO_MANY_REQUESTS");
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
        // User 1 dùng hết 10 tokens
        TenantContext.set(TenantContext.builder().tenantId("DIP_BHXH").userId("user_1").build());
        for (int i = 1; i <= 10; i++) {
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
