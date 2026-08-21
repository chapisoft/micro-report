package io.chapisoft.report.adapter.in.web;

import io.chapisoft.report.adapter.out.persistence.DataSourceRepository;
import io.chapisoft.report.application.dto.DataSourceDto;
import io.chapisoft.report.domain.model.DataSourceConfig;
import io.chapisoft.report.domain.model.DataSourceStatus;
import io.chapisoft.report.domain.model.DatabaseType;
import io.chapisoft.report.domain.model.TenantContext;
import io.chapisoft.report.domain.security.AesEncryptionService;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Objects;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DataSourceControllerTest {

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
    @DisplayName("Tenant DIP_BHXH chỉ nhìn thấy DataSource thuộc DIP_BHXH")
    void shouldReturnOnlyTenantDataSources() {
        TenantContext.set(TenantContext.builder().tenantId("DIP_BHXH").build());

        DataSourceConfig ds1 = DataSourceConfig.builder()
                .datasourceCode("DIP_DWH")
                .tenantId("DIP_BHXH")
                .name("DIP DWH")
                .dbType(DatabaseType.POSTGRESQL)
                .jdbcUrl("jdbc:postgresql://host:5432/dip")
                .username("dip_user")
                .status(DataSourceStatus.ACTIVE)
                .build();

        when(dataSourceRepository.findByTenantId("DIP_BHXH")).thenReturn(List.of(ds1));

        ResponseEntity<List<DataSourceDto>> response = controller.listDataSources(null, null);

        List<DataSourceDto> body = Objects.requireNonNull(response.getBody());
        assertThat(body).hasSize(1);
        assertThat(body.get(0).getDatasourceCode()).isEqualTo("DIP_DWH");
    }

    @Test
    @DisplayName("Lọc theo tham số listDatasource chỉ trả về các DataSource hợp lệ trong danh sách")
    void shouldFilterByListDatasource() {
        TenantContext.set(TenantContext.builder().tenantId("DIP_BHXH").build());

        DataSourceConfig ds1 = DataSourceConfig.builder()
                .datasourceCode("DIP_DWH")
                .tenantId("DIP_BHXH")
                .name("DIP DWH")
                .dbType(DatabaseType.POSTGRESQL)
                .jdbcUrl("jdbc:postgresql://host:5432/dip")
                .username("dip_user")
                .status(DataSourceStatus.ACTIVE)
                .build();

        DataSourceConfig ds2 = DataSourceConfig.builder()
                .datasourceCode("DIP_CORE")
                .tenantId("DIP_BHXH")
                .name("DIP Core")
                .dbType(DatabaseType.POSTGRESQL)
                .jdbcUrl("jdbc:postgresql://host:5432/core")
                .username("dip_user")
                .status(DataSourceStatus.ACTIVE)
                .build();

        when(dataSourceRepository.findByTenantId("DIP_BHXH")).thenReturn(List.of(ds1, ds2));

        // Truyền listDatasource = "DIP_DWH"
        ResponseEntity<List<DataSourceDto>> filteredResponse = controller.listDataSources("DIP_DWH", null);

        List<DataSourceDto> filteredBody = Objects.requireNonNull(filteredResponse.getBody());
        assertThat(filteredBody).hasSize(1);
        assertThat(filteredBody.get(0).getDatasourceCode()).isEqualTo("DIP_DWH");

        // Truyền listDatasource = "all"
        ResponseEntity<List<DataSourceDto>> allResponse = controller.listDataSources("all", null);
        List<DataSourceDto> allBody = Objects.requireNonNull(allResponse.getBody());
        assertThat(allBody).hasSize(2);
    }
}
