package io.chapisoft.report.domain.security;

import io.chapisoft.report.adapter.in.web.DataSourceController;
import io.chapisoft.report.adapter.out.persistence.DataSourceRepository;
import io.chapisoft.report.application.dto.DataSourceDto;
import io.chapisoft.report.domain.exception.SecurityViolationException;
import io.chapisoft.report.domain.model.DataSourceConfig;
import io.chapisoft.report.domain.model.DataSourceStatus;
import io.chapisoft.report.domain.model.DatabaseType;
import io.chapisoft.report.domain.model.TenantContext;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataSourcePermissionTest {

    @Mock
    private DataSourceRepository dataSourceRepository;

    @Mock
    private AesEncryptionService aesEncryptionService;

    private DataSourceController controller;

    @BeforeEach
    void setUp() {
        controller = new DataSourceController(dataSourceRepository, aesEncryptionService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Lọc danh sách DataSource theo sessionAllowed từ TenantContext")
    void testListDataSource_FilteredBySessionAllowed() {
        TenantContext context = TenantContext.builder()
                .tenantId("DIP_BHXH")
                .userId("user_dwh")
                .roles(Set.of("USER"))
                .allowedDataSources(Set.of("DIP_DWH"))
                .build();
        TenantContext.set(context);

        DataSourceConfig ds1 = DataSourceConfig.builder()
                .datasourceCode("DIP_ORACLE")
                .tenantId("DIP_BHXH")
                .name("Oracle OLTP")
                .dbType(DatabaseType.ORACLE)
                .status(DataSourceStatus.ACTIVE)
                .build();

        DataSourceConfig ds2 = DataSourceConfig.builder()
                .datasourceCode("DIP_DWH")
                .tenantId("DIP_BHXH")
                .name("DWH Postgres")
                .dbType(DatabaseType.POSTGRESQL)
                .status(DataSourceStatus.ACTIVE)
                .build();

        when(dataSourceRepository.findByTenantId("DIP_BHXH")).thenReturn(List.of(ds1, ds2));

        ResponseEntity<List<DataSourceDto>> response = controller.listDataSources(null, null);

        List<DataSourceDto> body = response.getBody();
        assertNotNull(body);
        assertEquals(1, body.size());
        assertEquals("DIP_DWH", body.get(0).getDatasourceCode());
    }

    @Test
    @DisplayName("Ném SecurityViolationException khi DataSource không nằm trong danh sách ủy quyền")
    void testSecurityViolation_WhenDataSourceNotAllowed() {
        TenantContext context = TenantContext.builder()
                .tenantId("DIP_BHXH")
                .userId("user_restricted")
                .roles(Set.of("USER"))
                .allowedDataSources(Set.of("DIP_DWH"))
                .build();
        TenantContext.set(context);

        String targetDs = "DIP_ORACLE";
        boolean isAllowed = context.getAllowedDataSources().contains(targetDs);

        assertFalse(isAllowed);
        assertThrows(SecurityViolationException.class, () -> {
            if (!isAllowed) {
                throw new SecurityViolationException("Truy cập bị từ chối: Nguồn dữ liệu " + targetDs + " không được phép.");
            }
        });
    }
}
