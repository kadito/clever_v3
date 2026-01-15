import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CPAContractSection from './CPAContractSection.vue'

// Mock the child components
const mockCPAEquipmentManager = {
  template: '<div data-testid="cpa-equipment-manager">CPA Equipment Manager</div>'
}

const mockContractDatesSection = {
  template: '<div data-testid="contract-dates-section">Contract Dates Section</div>'
}

const mockDynamicPlanDetails = {
  template: '<div data-testid="dynamic-plan-details">Dynamic Plan Details</div>'
}

describe('CPAContractSection', () => {
  const defaultProps = {
    formData: {
      cpaContractType: '',
      planIdCPA: '',
      distanceCPA: '',
      inicioContratoCPA: '',
      fimContratoCPA: '',
      modalidadePagamentoCPA: ''
    },
    cpaEquipments: [],
    selectedPlanDetails: null,
    isLoadingPlan: false
  }

  it('renders the three-column layout for CPA fields', () => {
    const wrapper = mount(CPAContractSection, {
      props: defaultProps,
      global: {
        components: {
          CPAEquipmentManager: mockCPAEquipmentManager,
          ContractDatesSection: mockContractDatesSection,
          DynamicPlanDetails: mockDynamicPlanDetails
        }
      }
    })

    // Check that the three-column grid container exists
    const configGrid = wrapper.find('.contract-config-grid')
    expect(configGrid.exists()).toBe(true)

    // Check that all three fields are present
    const configFields = wrapper.findAll('.config-field')
    expect(configFields).toHaveLength(3)

    // Check the specific fields
    const labels = wrapper.findAll('.config-label')
    expect(labels[0].text()).toBe('TIPO DE CONTRATO CPA')
    expect(labels[1].text()).toBe('PLANO CPA')
    expect(labels[2].text()).toBe('DISTÂNCIA')
    
    // Check that labels have required class (asterisk is added via CSS)
    expect(labels[0].classes()).toContain('required')
    expect(labels[1].classes()).toContain('required')
    expect(labels[2].classes()).toContain('required')

    // Check that selects are present
    const selects = wrapper.findAll('.config-select')
    expect(selects).toHaveLength(3)
  })

  it('renders contract type options correctly', () => {
    const wrapper = mount(CPAContractSection, {
      props: defaultProps,
      global: {
        components: {
          CPAEquipmentManager: mockCPAEquipmentManager,
          ContractDatesSection: mockContractDatesSection,
          DynamicPlanDetails: mockDynamicPlanDetails
        }
      }
    })

    const contractTypeSelect = wrapper.findAll('.config-select')[0]
    const options = contractTypeSelect.findAll('option')
    
    expect(options).toHaveLength(3) // Empty option + 2 contract types
    expect(options[1].text()).toBe('CPA - Cashlogy (2023)')
    expect(options[2].text()).toBe('CPA - Cashlogy (1500)')
  })

  it('renders plan options correctly', () => {
    const wrapper = mount(CPAContractSection, {
      props: defaultProps,
      global: {
        components: {
          CPAEquipmentManager: mockCPAEquipmentManager,
          ContractDatesSection: mockContractDatesSection,
          DynamicPlanDetails: mockDynamicPlanDetails
        }
      }
    })

    const planSelect = wrapper.findAll('.config-select')[1]
    const options = planSelect.findAll('option')
    
    expect(options).toHaveLength(7) // Empty option + 6 plan types
    expect(options[1].text()).toBe('ESSENTIAL CARE')
    expect(options[2].text()).toBe('PROFESSIONAL CARE')
    expect(options[3].text()).toBe('PREMIUM CARE')
  })

  it('renders distance options correctly', () => {
    const wrapper = mount(CPAContractSection, {
      props: defaultProps,
      global: {
        components: {
          CPAEquipmentManager: mockCPAEquipmentManager,
          ContractDatesSection: mockContractDatesSection,
          DynamicPlanDetails: mockDynamicPlanDetails
        }
      }
    })

    const distanceSelect = wrapper.findAll('.config-select')[2]
    const options = distanceSelect.findAll('option')
    
    expect(options).toHaveLength(3) // Empty option + 2 distance options
    expect(options[1].text()).toBe('Menos de 180 km')
    expect(options[2].text()).toBe('Mais de 180 km')
  })

  it('has proper three-column responsive layout', () => {
    const wrapper = mount(CPAContractSection, {
      props: defaultProps,
      global: {
        components: {
          CPAEquipmentManager: mockCPAEquipmentManager,
          ContractDatesSection: mockContractDatesSection,
          DynamicPlanDetails: mockDynamicPlanDetails
        }
      }
    })

    // Check that the grid container exists with the correct class
    const configGrid = wrapper.find('.contract-config-grid')
    expect(configGrid.exists()).toBe(true)
    
    // The component should have the contract-config-grid class
    expect(configGrid.classes()).toContain('contract-config-grid')
  })

  it('renders all three CPA configuration fields', () => {
    const wrapper = mount(CPAContractSection, {
      props: defaultProps,
      global: {
        components: {
          CPAEquipmentManager: mockCPAEquipmentManager,
          ContractDatesSection: mockContractDatesSection,
          DynamicPlanDetails: mockDynamicPlanDetails
        }
      }
    })

    // Check that all three fields are present
    const configFields = wrapper.findAll('.config-field')
    expect(configFields).toHaveLength(3)

    // Check field labels
    const labels = wrapper.findAll('.config-label')
    expect(labels[0].text()).toBe('TIPO DE CONTRATO CPA')
    expect(labels[1].text()).toBe('PLANO CPA')
    expect(labels[2].text()).toBe('DISTÂNCIA')

    // Check that all fields are required
    expect(labels[0].classes()).toContain('required')
    expect(labels[1].classes()).toContain('required')
    expect(labels[2].classes()).toContain('required')

    // Check that all selects are present
    const selects = wrapper.findAll('.config-select')
    expect(selects).toHaveLength(3)
  })

  it('includes child components', () => {
    const wrapper = mount(CPAContractSection, {
      props: {
        ...defaultProps,
        cpaEquipments: [{ id: '1', model: 'Test', serialNumber: '123', discount: 0, observations: '' }]
      },
      global: {
        components: {
          CPAEquipmentManager: mockCPAEquipmentManager,
          ContractDatesSection: mockContractDatesSection,
          DynamicPlanDetails: mockDynamicPlanDetails
        }
      }
    })

    // Check that child components are rendered
    expect(wrapper.findComponent(mockCPAEquipmentManager).exists()).toBe(true)
    expect(wrapper.findComponent(mockContractDatesSection).exists()).toBe(true)
  })

  it('displays loading state when plan is being loaded', () => {
    const wrapper = mount(CPAContractSection, {
      props: {
        ...defaultProps,
        isLoadingPlan: true
      },
      global: {
        components: {
          CPAEquipmentManager: mockCPAEquipmentManager,
          ContractDatesSection: mockContractDatesSection,
          DynamicPlanDetails: mockDynamicPlanDetails
        }
      }
    })

    // Check that loading state is displayed
    const loadingState = wrapper.find('.plan-loading-state')
    expect(loadingState.exists()).toBe(true)

    // Check loading spinner and text
    const spinner = wrapper.find('.spinner')
    const loadingText = wrapper.find('.loading-text')
    expect(spinner.exists()).toBe(true)
    expect(loadingText.exists()).toBe(true)
    expect(loadingText.text()).toBe('A carregar detalhes do plano...')

    // Check that DynamicPlanDetails is not displayed during loading
    expect(wrapper.findComponent(mockDynamicPlanDetails).exists()).toBe(false)
  })

  it('displays plan details when not loading and plan is selected', () => {
    const mockPlanDetails = {
      id: 'test-plan',
      name: 'Test Plan',
      description: 'Test description'
    }

    const wrapper = mount(CPAContractSection, {
      props: {
        ...defaultProps,
        selectedPlanDetails: mockPlanDetails,
        isLoadingPlan: false
      },
      global: {
        components: {
          CPAEquipmentManager: mockCPAEquipmentManager,
          ContractDatesSection: mockContractDatesSection,
          DynamicPlanDetails: mockDynamicPlanDetails
        }
      }
    })

    // Check that loading state is not displayed
    const loadingState = wrapper.find('.plan-loading-state')
    expect(loadingState.exists()).toBe(false)

    // Check that DynamicPlanDetails is displayed
    expect(wrapper.findComponent(mockDynamicPlanDetails).exists()).toBe(true)
  })

  it('emits plan-selected event when plan is selected', async () => {
    const wrapper = mount(CPAContractSection, {
      props: defaultProps,
      global: {
        components: {
          CPAEquipmentManager: mockCPAEquipmentManager,
          ContractDatesSection: mockContractDatesSection,
          DynamicPlanDetails: mockDynamicPlanDetails
        }
      }
    })

    // Call the handlePlanSelection method directly since the select uses @update:model-value
    await (wrapper.vm as any).handlePlanSelection('cpa_essential')

    // Check that the plan-selected event was emitted
    expect(wrapper.emitted('plan-selected')).toBeTruthy()
    expect(wrapper.emitted('plan-selected')?.[0]).toEqual(['cpa_essential'])
  })

  it('should show POS package option only for CPA_1500 PREMIUM plan', () => {
    const wrapper = mount(CPAContractSection, {
      props: {
        formData: {
          cpaContractType: 'CPA_1500',
          planIdCPA: 'cpa_1500_premium',
          hasPOSPackage: false
        },
        cpaEquipments: [],
        selectedPlanDetails: null
      },
      global: {
        components: {
          CPAEquipmentManager: mockCPAEquipmentManager,
          ContractDatesSection: mockContractDatesSection,
          DynamicPlanDetails: mockDynamicPlanDetails
        }
      }
    });

    const posPackageSection = wrapper.find('.pos-package-section');
    expect(posPackageSection.exists()).toBe(true);
    
    const checkbox = wrapper.find('.pos-package-checkbox');
    expect(checkbox.exists()).toBe(true);
    expect(checkbox.element.checked).toBe(false);
  });

  it('should not show POS package option for other plans', () => {
    const wrapper = mount(CPAContractSection, {
      props: {
        formData: {
          cpaContractType: 'CPA',
          planIdCPA: 'cpa_essential',
          hasPOSPackage: false
        },
        cpaEquipments: [],
        selectedPlanDetails: null
      },
      global: {
        components: {
          CPAEquipmentManager: mockCPAEquipmentManager,
          ContractDatesSection: mockContractDatesSection,
          DynamicPlanDetails: mockDynamicPlanDetails
        }
      }
    });

    const posPackageSection = wrapper.find('.pos-package-section');
    expect(posPackageSection.exists()).toBe(false);
  });

  it('should emit update-field event when POS package checkbox is changed', async () => {
    const wrapper = mount(CPAContractSection, {
      props: {
        formData: {
          cpaContractType: 'CPA_1500',
          planIdCPA: 'cpa_1500_premium',
          hasPOSPackage: false
        },
        cpaEquipments: [],
        selectedPlanDetails: null
      },
      global: {
        components: {
          CPAEquipmentManager: mockCPAEquipmentManager,
          ContractDatesSection: mockContractDatesSection,
          DynamicPlanDetails: mockDynamicPlanDetails
        }
      }
    });

    const checkbox = wrapper.find('.pos-package-checkbox');
    await checkbox.setValue(true);

    expect(wrapper.emitted('update-field')).toBeTruthy();
    expect(wrapper.emitted('update-field')[0]).toEqual(['hasPOSPackage', true]);
  });
})