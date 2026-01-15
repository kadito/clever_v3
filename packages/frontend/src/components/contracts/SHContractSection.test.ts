import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SHContractSection from './SHContractSection.vue'

// Mock the child components
vi.mock('./ContractDatesSection.vue', () => ({
  default: {
    template: '<div data-testid="contract-dates-section">Contract Dates Section</div>'
  }
}))

vi.mock('./DynamicPlanDetails.vue', () => ({
  default: {
    template: '<div data-testid="dynamic-plan-details">Dynamic Plan Details</div>'
  }
}))

vi.mock('./SHEquipmentCard.vue', () => ({
  default: {
    template: '<div data-testid="sh-equipment-card">S&H Equipment Card</div>',
    props: ['equipment', 'equipmentNumber'],
    emits: ['update', 'remove']
  }
}))

describe('SHContractSection', () => {
  const defaultProps = {
    formData: {
      planIdSH: '',
      distanceSH: '',
      modeloPSO: '',
      numeroSeriePSO: '',
      softwarePSO: '',
      inicioContratoSH: '',
      fimContratoSH: '',
      modalidadePagamentoSH: ''
    },
    selectedPlanDetails: null,
    isLoadingPlan: false,
    shEquipments: []
  }

  it('renders S&H plan selection dropdown', () => {
    const wrapper = mount(SHContractSection, {
      props: defaultProps
    })

    const planSelect = wrapper.find('select[data-testid="plan-select"]')
    expect(planSelect.exists()).toBe(true)
    
    // Check that S&H plan options are present
    const options = planSelect.findAll('option')
    expect(options.length).toBeGreaterThan(1) // Should have empty option + plan options
    
    // Check for specific S&H plans
    const optionTexts = options.map(option => option.text())
    expect(optionTexts).toContain('SIMPLE')
    expect(optionTexts).toContain('BRASS')
    expect(optionTexts).toContain('SILVER')
    expect(optionTexts).toContain('GOLD')
    expect(optionTexts).toContain('DIAMOND')
    expect(optionTexts).toContain('PLATINUM')
  })

  it('renders distance selection dropdown', () => {
    const wrapper = mount(SHContractSection, {
      props: defaultProps
    })

    const distanceSelect = wrapper.find('select[data-testid="distance-select"]')
    expect(distanceSelect.exists()).toBe(true)
    
    const options = distanceSelect.findAll('option')
    const optionTexts = options.map(option => option.text())
    expect(optionTexts).toContain('Menos de 180 km')
    expect(optionTexts).toContain('Mais de 180 km')
  })

  it('renders equipment management section', () => {
    const wrapper = mount(SHContractSection, {
      props: defaultProps
    })

    // Check for equipment section header
    expect(wrapper.text()).toContain('EQUIPAMENTOS S&H')
    
    // Check for add equipment button
    const addButton = wrapper.find('.add-equipment-btn')
    expect(addButton.exists()).toBe(true)
    expect(addButton.text()).toContain('ADICIONAR EQUIPAMENTO')
  })

  it('emits update-field event when plan is selected', async () => {
    const wrapper = mount(SHContractSection, {
      props: defaultProps
    })

    // Call the handlePlanSelection method directly
    await (wrapper.vm as any).handlePlanSelection('sh_simple')

    expect(wrapper.emitted('plan-selected')).toBeTruthy()
    expect(wrapper.emitted('plan-selected')?.[0]).toEqual(['sh_simple'])
  })

  it('distance selection field is properly configured', async () => {
    const wrapper = mount(SHContractSection, {
      props: defaultProps
    })

    const distanceSelect = wrapper.find('select[data-testid="distance-select"]')
    
    // Verify the select element exists and has correct options
    const options = distanceSelect.findAll('option')
    expect(options.length).toBe(3) // Empty option + 2 distance options
    expect(options.map(o => o.text())).toContain('Menos de 180 km')
    expect(options.map(o => o.text())).toContain('Mais de 180 km')
    
    // Verify option values
    expect(options[1].element.value).toBe('under180km')
    expect(options[2].element.value).toBe('over180km')
  })

  it('displays dynamic plan details when plan is selected', () => {
    const mockPlanDetails = {
      id: 'sh_simple',
      name: 'SIMPLE',
      description: 'Simple S&H plan',
      hoursPerYear: 10,
      displacementsIncluded: 2
    }

    const wrapper = mount(SHContractSection, {
      props: {
        ...defaultProps,
        selectedPlanDetails: mockPlanDetails
      }
    })

    expect(wrapper.find('[data-testid="dynamic-plan-details"]').exists()).toBe(true)
  })

  it('does not display dynamic plan details when no plan is selected', () => {
    const wrapper = mount(SHContractSection, {
      props: defaultProps
    })

    expect(wrapper.find('[data-testid="dynamic-plan-details"]').exists()).toBe(false)
  })

  it('renders equipment cards when equipments are provided', async () => {
    const mockEquipments = [
      {
        id: '1',
        modelo: 'Dell Optiplex 7090',
        numeroSerie: 'ABC123456',
        software: 'Windows 11 Pro',
        observacoes: 'Test equipment'
      }
    ]

    const wrapper = mount(SHContractSection, {
      props: {
        ...defaultProps,
        shEquipments: mockEquipments
      }
    })
    
    // Check that equipment card is rendered
    const equipmentCards = wrapper.findAll('[data-testid="sh-equipment-card"]')
    expect(equipmentCards.length).toBe(1)
  })

  it('displays loading state when plan is being loaded', () => {
    const wrapper = mount(SHContractSection, {
      props: {
        ...defaultProps,
        isLoadingPlan: true
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
    expect(wrapper.find('[data-testid="dynamic-plan-details"]').exists()).toBe(false)
  })

  it('displays plan details when not loading and plan is selected', () => {
    const mockPlanDetails = {
      id: 'sh_simple',
      name: 'SIMPLE',
      description: 'Simple S&H plan',
      hoursPerYear: 10,
      displacementsIncluded: 2
    }

    const wrapper = mount(SHContractSection, {
      props: {
        ...defaultProps,
        selectedPlanDetails: mockPlanDetails,
        isLoadingPlan: false
      }
    })

    // Check that loading state is not displayed
    const loadingState = wrapper.find('.plan-loading-state')
    expect(loadingState.exists()).toBe(false)

    // Check that DynamicPlanDetails is displayed
    expect(wrapper.find('[data-testid="dynamic-plan-details"]').exists()).toBe(true)
  })

  it('emits plan-selected event when plan dropdown changes', async () => {
    const wrapper = mount(SHContractSection, {
      props: defaultProps
    })

    // Call the handlePlanSelection method directly since the select uses @update:model-value
    await (wrapper.vm as any).handlePlanSelection('sh_simple')

    // Check that the plan-selected event was emitted
    expect(wrapper.emitted('plan-selected')).toBeTruthy()
    expect(wrapper.emitted('plan-selected')?.[0]).toEqual(['sh_simple'])
  })
})