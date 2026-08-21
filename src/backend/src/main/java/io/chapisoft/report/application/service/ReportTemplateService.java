package io.chapisoft.report.application.service;

import io.chapisoft.report.adapter.out.persistence.ReportTemplateRepository;
import io.chapisoft.report.application.dto.ReportTemplateDto;
import io.chapisoft.report.domain.exception.ResourceNotFoundException;
import io.chapisoft.report.domain.model.QueryMode;
import io.chapisoft.report.domain.model.ReportTemplate;
import io.chapisoft.report.domain.model.TemplateStatus;
import io.chapisoft.report.domain.security.SqlSecurityAstValidator;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Service
public class ReportTemplateService {

    private final ReportTemplateRepository templateRepository;
    private final SqlSecurityAstValidator sqlSecurityAstValidator;

    public ReportTemplateService(ReportTemplateRepository templateRepository,
                                 SqlSecurityAstValidator sqlSecurityAstValidator) {
        this.templateRepository = templateRepository;
        this.sqlSecurityAstValidator = sqlSecurityAstValidator;
    }

    public List<ReportTemplateDto> getTemplatesByTenant(String tenantId, String status) {
        return templateRepository.findByTenantId(tenantId, status).stream()
                .map(this::mapToDto)
                .toList();
    }

    public List<ReportTemplateDto> getPublishedTemplates(String tenantId) {
        return templateRepository.findByTenantId(tenantId, TemplateStatus.ACTIVE.name()).stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsPublic()) || Boolean.FALSE.equals(t.getIsSystem()))
                .map(this::mapToDto)
                .toList();
    }

    public ReportTemplateDto getTemplateByCode(String tenantId, String templateCode) {
        ReportTemplate template = templateRepository.findByTenantAndCode(tenantId, templateCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy mẫu báo cáo với mã: " + templateCode + " cho tenant: " + tenantId));
        
        templateRepository.incrementAccessCount(tenantId, templateCode);
        return mapToDto(template);
    }

    @Transactional
    public ReportTemplateDto createTemplate(String tenantId, String createdBy, ReportTemplateDto dto) {
        if (dto.getMode() == QueryMode.SQL && dto.getConfigJson() != null) {
            // Validate SQL an toàn nếu có nội dung query
            sqlSecurityAstValidator.validateSafeSql(dto.getConfigJson());
        }

        ReportTemplate template = ReportTemplate.builder()
                .templateCode(dto.getTemplateCode())
                .tenantId(tenantId)
                .datasourceCode(dto.getDatasourceCode())
                .templateName(dto.getTemplateName())
                .mode(dto.getMode())
                .status(dto.getStatus() != null ? dto.getStatus() : TemplateStatus.ACTIVE)
                .isPublic(dto.getIsPublic() != null ? dto.getIsPublic() : false)
                .isSystem(dto.getIsSystem() != null ? dto.getIsSystem() : false)
                .configJson(dto.getConfigJson())
                .transformJs(dto.getTransformJs())
                .accessCount(0)
                .createdAt(Instant.now())
                .createdBy(createdBy != null ? createdBy : "SYSTEM")
                .build();

        templateRepository.save(template);
        return mapToDto(template);
    }

    @Transactional
    public ReportTemplateDto updateTemplate(String tenantId, String templateCode, ReportTemplateDto dto) {
        ReportTemplate existing = templateRepository.findByTenantAndCode(tenantId, templateCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy mẫu báo cáo với mã: " + templateCode + " để cập nhật."));

        if (dto.getMode() == QueryMode.SQL && dto.getConfigJson() != null) {
            sqlSecurityAstValidator.validateSafeSql(dto.getConfigJson());
        }

        existing.setTemplateName(dto.getTemplateName());
        existing.setDatasourceCode(dto.getDatasourceCode());
        existing.setMode(dto.getMode());
        if (dto.getStatus() != null) {
            existing.setStatus(dto.getStatus());
        }
        existing.setConfigJson(dto.getConfigJson());
        existing.setTransformJs(dto.getTransformJs());
        existing.setUpdatedAt(Instant.now());

        templateRepository.update(existing);
        return mapToDto(existing);
    }

    @Transactional
    public void deleteTemplate(String tenantId, String templateCode) {
        templateRepository.findByTenantAndCode(tenantId, templateCode)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy mẫu báo cáo với mã: " + templateCode + " để xóa."));
        templateRepository.softDelete(tenantId, templateCode);
    }

    private ReportTemplateDto mapToDto(ReportTemplate entity) {
        return ReportTemplateDto.builder()
                .id(entity.getId())
                .templateCode(entity.getTemplateCode())
                .tenantId(entity.getTenantId())
                .datasourceCode(entity.getDatasourceCode())
                .templateName(entity.getTemplateName())
                .mode(entity.getMode())
                .status(entity.getStatus())
                .isPublic(entity.getIsPublic())
                .isSystem(entity.getIsSystem())
                .configJson(entity.getConfigJson())
                .transformJs(entity.getTransformJs())
                .accessCount(entity.getAccessCount())
                .lastAccessedAt(entity.getLastAccessedAt())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .createdBy(entity.getCreatedBy())
                .build();
    }
}
