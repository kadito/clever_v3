import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import RelationInfoDisplay from './RelationInfoDisplay.vue';
import type { RelationResult, ResolvedRelation, RelationError } from '@clever/shared';

describe('RelationInfoDisplay', () => {
  it('renders successfully with resolved client relation', () => {
    const resolvedRelation: ResolvedRelation = {
      uuid: 'client-123',
      contentType: 'clients',
      nomeEmpresa: 'Empresa ABC Lda',
      nomeComercial: 'ABC',
      contribuinte: '123456789',
      localidade: 'Lisboa'
    };

    const wrapper = mount(RelationInfoDisplay, {
      props: {
        relationData: resolvedRelation,
        relationType: 'client',
        relationId: 'client-123'
      }
    });

    expect(wrapper.find('.relation-info-title').text()).toBe('Informação do Cliente');
    expect(wrapper.find('.relation-data-content').exists()).toBe(true);
    expect(wrapper.text()).toContain('Empresa ABC Lda');
    expect(wrapper.text()).toContain('123456789');
  });

  it('renders error state correctly', () => {
    const errorRelation: RelationError = {
      type: 'error',
      code: 404,
      message: 'Not found'
    };

    const wrapper = mount(RelationInfoDisplay, {
      props: {
        relationData: errorRelation,
        relationType: 'client',
        relationId: 'invalid-id'
      }
    });

    expect(wrapper.find('.relation-info-card--error').exists()).toBe(true);
    expect(wrapper.find('.relation-error-message').text()).toBe('Conteúdo não encontrado');
    expect(wrapper.text()).toContain('Código: 404');
  });

  it('renders missing state correctly', () => {
    const wrapper = mount(RelationInfoDisplay, {
      props: {
        relationData: null,
        relationType: 'client'
      }
    });

    expect(wrapper.find('.relation-info-card--missing').exists()).toBe(true);
    expect(wrapper.find('.relation-missing-message').text()).toBe('Informação do Cliente não encontrado');
  });

  it('does not render when relationData is undefined', () => {
    const wrapper = mount(RelationInfoDisplay, {
      props: {
        relationData: undefined,
        relationType: 'client'
      }
    });

    expect(wrapper.find('.relation-info-section').exists()).toBe(false);
  });

  it('uses custom display name when provided', () => {
    const resolvedRelation: ResolvedRelation = {
      uuid: 'client-123',
      contentType: 'clients',
      nomeEmpresa: 'Empresa ABC Lda'
    };

    const wrapper = mount(RelationInfoDisplay, {
      props: {
        relationData: resolvedRelation,
        relationType: 'client',
        customDisplayName: 'Cliente Personalizado'
      }
    });

    expect(wrapper.find('.relation-info-title').text()).toBe('Cliente Personalizado');
  });

  it('uses custom fields when provided', () => {
    const resolvedRelation: ResolvedRelation = {
      uuid: 'client-123',
      contentType: 'clients',
      customField: 'Custom Value'
    };

    const customFields = [
      { key: 'customField', label: 'Campo Personalizado' }
    ];

    const wrapper = mount(RelationInfoDisplay, {
      props: {
        relationData: resolvedRelation,
        relationType: 'client',
        customFields
      }
    });

    expect(wrapper.text()).toContain('Campo Personalizado');
    expect(wrapper.text()).toContain('Custom Value');
  });

  it('formats date fields correctly', () => {
    const resolvedRelation: ResolvedRelation = {
      uuid: 'contract-123',
      contentType: 'contracts',
      dataInicio: '2024-01-15T00:00:00.000Z'
    };

    const wrapper = mount(RelationInfoDisplay, {
      props: {
        relationData: resolvedRelation,
        relationType: 'contract'
      }
    });

    // Should format the date in Portuguese format
    expect(wrapper.text()).toContain('15/01/2024');
  });

  it('shows debug info when enabled', () => {
    const resolvedRelation: ResolvedRelation = {
      uuid: 'client-123',
      contentType: 'clients',
      nomeEmpresa: 'Empresa ABC Lda'
    };

    const wrapper = mount(RelationInfoDisplay, {
      props: {
        relationData: resolvedRelation,
        relationType: 'client',
        relationId: 'client-123',
        showDebugInfo: true
      }
    });

    expect(wrapper.find('.relation-debug-info').exists()).toBe(true);
    expect(wrapper.text()).toContain('ID: client-123');
  });

  it('handles contract relation type correctly', () => {
    const resolvedRelation: ResolvedRelation = {
      uuid: 'contract-123',
      contentType: 'contracts',
      numeroContrato: 'CT-2024-001',
      dataInicio: '2024-01-01',
      dataFim: '2024-12-31',
      valor: '1000.00'
    };

    const wrapper = mount(RelationInfoDisplay, {
      props: {
        relationData: resolvedRelation,
        relationType: 'contract'
      }
    });

    expect(wrapper.find('.relation-info-title').text()).toBe('Informação do Contrato');
    expect(wrapper.text()).toContain('CT-2024-001');
    expect(wrapper.text()).toContain('1000.00');
  });
});