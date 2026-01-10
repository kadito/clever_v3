/**
 * RelationInfoDisplay Component Tests (Task 10 - Frontend)
 * 
 * Tests the RelationInfoDisplay component's handling of different relation states:
 * - Resolved relations with valid data
 * - Error relations (404/500 errors)
 * - Missing relations (null/undefined)
 * - Proper error styling and user experience
 * 
 * Requirements: 8.4, 8.5 - Verify structured error handling and user experience
 */

import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RelationInfoDisplay from './RelationInfoDisplay.vue';
import type { ResolvedRelation, RelationError } from '@clever/shared';

describe('RelationInfoDisplay Component (Task 10)', () => {
  const mockResolvedClient: ResolvedRelation = {
    uuid: 'client-123',
    contentType: 'clients',
    nomeEmpresa: 'Empresa Teste Lda',
    nomeComercial: 'Teste',
    contribuinte: '123456789',
    localidade: 'Lisboa'
  };

  const mock404Error: RelationError = {
    type: 'error',
    code: 404,
    message: 'Not found'
  };

  const mock500Error: RelationError = {
    type: 'error',
    code: 500,
    message: 'Internal Server Error'
  };

  describe('Resolved Relations Display', () => {
    it('should display resolved client relation data correctly', () => {
      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: mockResolvedClient,
          relationType: 'client',
          relationId: 'client-123'
        }
      });

      // Check that the component renders
      expect(wrapper.find('.relation-info-section').exists()).toBe(true);
      
      // Check title
      expect(wrapper.find('.relation-info-title').text()).toBe('Informação do Cliente');
      
      // Check that client data is displayed
      expect(wrapper.text()).toContain('Empresa Teste Lda');
      expect(wrapper.text()).toContain('Teste');
      expect(wrapper.text()).toContain('123456789');
      expect(wrapper.text()).toContain('Lisboa');
      
      // Should not have error styling
      expect(wrapper.find('.relation-info-card--error').exists()).toBe(false);
      expect(wrapper.find('.relation-info-card--missing').exists()).toBe(false);
    });

    it('should display all configured client fields', () => {
      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: mockResolvedClient,
          relationType: 'client'
        }
      });

      // Check that all basic client fields are shown
      const fieldLabels = wrapper.findAll('.relation-data-label');
      const labelTexts = fieldLabels.map(label => label.text());
      
      expect(labelTexts).toContain('Nome da Empresa');
      expect(labelTexts).toContain('Nome Comercial');
      expect(labelTexts).toContain('NIF');
      expect(labelTexts).toContain('Localidade');
    });

    it('should handle missing optional fields gracefully', () => {
      const partialClient: ResolvedRelation = {
        uuid: 'client-456',
        contentType: 'clients',
        nomeEmpresa: 'Empresa Parcial Lda',
        contribuinte: '987654321'
        // Missing nomeComercial and localidade
      };

      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: partialClient,
          relationType: 'client'
        }
      });

      expect(wrapper.text()).toContain('Empresa Parcial Lda');
      expect(wrapper.text()).toContain('987654321');
      
      // Should show em dash for missing fields
      const values = wrapper.findAll('.relation-data-value');
      const hasEmDash = values.some(value => value.text().includes('—'));
      expect(hasEmDash).toBe(true);
    });
  });

  describe('Error Relations Display', () => {
    it('should display 404 error correctly with proper styling', () => {
      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: mock404Error,
          relationType: 'client',
          relationId: 'non-existent-client'
        }
      });

      // Check error styling is applied
      expect(wrapper.find('.relation-info-card--error').exists()).toBe(true);
      
      // Check error content
      expect(wrapper.find('.relation-error-content').exists()).toBe(true);
      expect(wrapper.find('.relation-error-message').text()).toBe('Conteúdo não encontrado');
      expect(wrapper.find('.relation-error-code').text()).toBe('Código: 404');
      
      // Check error icon is present
      expect(wrapper.find('.relation-info-status svg').exists()).toBe(true);
      
      // Should not show data content
      expect(wrapper.find('.relation-data-content').exists()).toBe(false);
    });

    it('should display 500 error correctly with proper styling', () => {
      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: mock500Error,
          relationType: 'client',
          relationId: 'server-error-client'
        }
      });

      // Check error styling is applied
      expect(wrapper.find('.relation-info-card--error').exists()).toBe(true);
      
      // Check error content
      expect(wrapper.find('.relation-error-message').text()).toBe('Erro interno do servidor');
      expect(wrapper.find('.relation-error-code').text()).toBe('Código: 500');
    });

    it('should handle unknown error codes gracefully', () => {
      const unknownError: RelationError = {
        type: 'error',
        code: 503 as any,
        message: 'Service Unavailable'
      };

      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: unknownError,
          relationType: 'client'
        }
      });

      // Should fall back to original message
      expect(wrapper.find('.relation-error-message').text()).toBe('Service Unavailable');
      expect(wrapper.find('.relation-error-code').text()).toBe('Código: 503');
    });

    it('should apply correct CSS classes for error state', () => {
      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: mock404Error,
          relationType: 'client'
        }
      });

      // Check error-specific CSS classes
      expect(wrapper.find('.relation-info-card').classes()).toContain('relation-info-card--error');
      
      // Check that error styling is applied (the component uses conditional classes)
      const header = wrapper.find('.relation-info-header');
      expect(header.exists()).toBe(true);
      
      // The component applies error styling through CSS classes in the style section
      // We can verify the error state by checking the error content is displayed
      expect(wrapper.find('.relation-error-content').exists()).toBe(true);
    });
  });

  describe('Missing Relations Display', () => {
    it('should display missing relation state correctly', () => {
      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: null,
          relationType: 'client',
          relationId: 'missing-client'
        }
      });

      // Check missing styling is applied
      expect(wrapper.find('.relation-info-card--missing').exists()).toBe(true);
      
      // Check missing content
      expect(wrapper.find('.relation-missing-content').exists()).toBe(true);
      expect(wrapper.find('.relation-missing-message').text()).toBe('Informação do Cliente não encontrado');
      
      // Should not show data or error content
      expect(wrapper.find('.relation-data-content').exists()).toBe(false);
      expect(wrapper.find('.relation-error-content').exists()).toBe(false);
    });

    it('should apply correct CSS classes for missing state', () => {
      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: null,
          relationType: 'client'
        }
      });

      // Check missing-specific CSS classes
      expect(wrapper.find('.relation-info-card').classes()).toContain('relation-info-card--missing');
      
      // Check that missing styling is applied (the component uses conditional classes)
      const header = wrapper.find('.relation-info-header');
      expect(header.exists()).toBe(true);
      
      // The component applies missing styling through CSS classes in the style section
      // We can verify the missing state by checking the missing content is displayed
      expect(wrapper.find('.relation-missing-content').exists()).toBe(true);
    });
  });

  describe('Component Configuration', () => {
    it('should use custom display name when provided', () => {
      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: mockResolvedClient,
          relationType: 'client',
          customDisplayName: 'Dados do Cliente Personalizado'
        }
      });

      expect(wrapper.find('.relation-info-title').text()).toBe('Dados do Cliente Personalizado');
    });

    it('should use custom fields when provided', () => {
      const customFields = [
        { key: 'nomeEmpresa', label: 'Company Name' },
        { key: 'contribuinte', label: 'Tax ID' }
      ];

      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: mockResolvedClient,
          relationType: 'client',
          customFields
        }
      });

      const fieldLabels = wrapper.findAll('.relation-data-label');
      const labelTexts = fieldLabels.map(label => label.text());
      
      expect(labelTexts).toContain('Company Name');
      expect(labelTexts).toContain('Tax ID');
      expect(labelTexts).not.toContain('Nome Comercial');
      expect(labelTexts).not.toContain('Localidade');
    });

    it('should show debug info when enabled', () => {
      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: mockResolvedClient,
          relationType: 'client',
          relationId: 'debug-client-123',
          showDebugInfo: true
        }
      });

      expect(wrapper.find('.relation-info-footer').exists()).toBe(true);
      expect(wrapper.find('.relation-debug-info').text()).toBe('ID: debug-client-123');
    });

    it('should hide debug info by default', () => {
      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: mockResolvedClient,
          relationType: 'client',
          relationId: 'debug-client-123'
        }
      });

      expect(wrapper.find('.relation-info-footer').exists()).toBe(false);
    });
  });

  describe('Different Relation Types', () => {
    it('should handle contract relations correctly', () => {
      const mockContract: ResolvedRelation = {
        uuid: 'contract-123',
        contentType: 'contracts',
        numeroContrato: 'CT-2024-001',
        dataInicio: '2024-01-01',
        dataFim: '2024-12-31'
      };

      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: mockContract,
          relationType: 'contract'
        }
      });

      expect(wrapper.find('.relation-info-title').text()).toBe('Informação do Contrato');
      expect(wrapper.text()).toContain('CT-2024-001');
      expect(wrapper.text()).toContain('01/01/2024'); // Formatted date
      expect(wrapper.text()).toContain('31/12/2024'); // Formatted date
    });

    it('should handle unknown relation types with fallback', () => {
      const mockUnknown: ResolvedRelation = {
        uuid: 'unknown-123',
        contentType: 'unknown',
        someField: 'Some Value'
      };

      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: mockUnknown,
          relationType: 'unknown'
        }
      });

      expect(wrapper.find('.relation-info-title').text()).toBe('Informação de unknown');
    });
  });

  describe('Date Formatting', () => {
    it('should format date fields correctly', () => {
      const mockWithDates: ResolvedRelation = {
        uuid: 'client-with-dates',
        contentType: 'clients',
        nomeEmpresa: 'Empresa com Datas',
        dataInicio: '2024-01-15T10:30:00Z',
        dataFim: '2024-12-31T23:59:59Z'
      };

      const customFields = [
        { key: 'nomeEmpresa', label: 'Nome' },
        { key: 'dataInicio', label: 'Data de Início' },
        { key: 'dataFim', label: 'Data de Fim' }
      ];

      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: mockWithDates,
          relationType: 'client',
          customFields
        }
      });

      // Check that dates are formatted in Portuguese format
      expect(wrapper.text()).toContain('15/01/2024');
      expect(wrapper.text()).toContain('31/12/2024');
    });

    it('should handle invalid dates gracefully', () => {
      const mockWithInvalidDate: ResolvedRelation = {
        uuid: 'client-invalid-date',
        contentType: 'clients',
        nomeEmpresa: 'Empresa',
        dataInvalida: 'not-a-date'
      };

      const customFields = [
        { key: 'nomeEmpresa', label: 'Nome' },
        { key: 'dataInvalida', label: 'Data Inválida' }
      ];

      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: mockWithInvalidDate,
          relationType: 'client',
          customFields
        }
      });

      // Should show original value for invalid dates
      expect(wrapper.text()).toContain('not-a-date');
    });
  });

  describe('Conditional Rendering', () => {
    it('should not render when relationData is undefined', () => {
      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: undefined,
          relationType: 'client'
        }
      });

      expect(wrapper.find('.relation-info-section').exists()).toBe(false);
    });

    it('should render when relationData is null (missing state)', () => {
      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: null,
          relationType: 'client'
        }
      });

      expect(wrapper.find('.relation-info-section').exists()).toBe(true);
      expect(wrapper.find('.relation-info-card--missing').exists()).toBe(true);
    });

    it('should render when relationData is an error', () => {
      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: mock404Error,
          relationType: 'client'
        }
      });

      expect(wrapper.find('.relation-info-section').exists()).toBe(true);
      expect(wrapper.find('.relation-info-card--error').exists()).toBe(true);
    });

    it('should render when relationData is resolved', () => {
      const wrapper = mount(RelationInfoDisplay, {
        props: {
          relationData: mockResolvedClient,
          relationType: 'client'
        }
      });

      expect(wrapper.find('.relation-info-section').exists()).toBe(true);
      expect(wrapper.find('.relation-data-content').exists()).toBe(true);
    });
  });
});