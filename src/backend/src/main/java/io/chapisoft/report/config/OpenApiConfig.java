package io.chapisoft.report.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Micro-Report Standalone Dynamic Report Engine API")
                        .version("4.0.0")
                        .description("REST API phân hệ Báo Cáo Động Độc Lập — Phục vụ đa người thuê (Multi-Tenancy) và đa CSDL.")
                        .contact(new Contact().name("MASCOM / Chapisoft Core Team").email("tech@mascom.vn"))
                        .license(new License().name("Proprietary").url("https://mascom.vn")))
                .addSecurityItem(new SecurityRequirement().addList("BearerAuth").addList("ApiKeyAuth").addList("TenantHeader"))
                .components(new Components()
                        .addSecuritySchemes("BearerAuth", new SecurityScheme()
                                .name("Authorization")
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("bearer")
                                .bearerFormat("JWT"))
                        .addSecuritySchemes("ApiKeyAuth", new SecurityScheme()
                                .name("X-API-Key")
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER))
                        .addSecuritySchemes("TenantHeader", new SecurityScheme()
                                .name("X-Tenant-Id")
                                .type(SecurityScheme.Type.APIKEY)
                                .in(SecurityScheme.In.HEADER)));
    }
}
