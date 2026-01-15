import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SHContractSection from './SHContractSection.vue'

// Mock the contract plans data
vi.mock('@/config/contract-plans.json', () => ({
  default: {
    'S&H': {
      plans: [
        {
          id: 'sh_simple',
          name: 'SIMPLE',
          description: 'Pacote de 10:00/ano\nDuas deslocações/ano - Seg. a Sexta-Feira entre as 9:00 e as 19:00\nAssistência Remota - Seg. a Sexta-Feira entre as 9:00 e as 23:00',
          hoursPerYear: 10,
          displacementsIncluded: 2,
          remoteSupport: 'Segunda a Sexta-Feira entre as 9:00 e as 23:00',
          weekendSupport: false,
          prices: {
            under180km: {
              monthly: 30.00,
              quarterly: 130.00,
              semiannual: 185.00,
              annual: 330.00
            },
            over180km: {
              monthly: 35.00,
              quarterly: 150.00,
              semiannual: 215.00,
              annual: 390.00
            }
          }
        }
      ]
    }
  }
}))

describe('SHContractSection Integration', () => {
  const mockFormData = {
    planIdSH: 'sh_simple',
    distanceSH: 'under180km',
    modalidadePagamentoSH: '',
    inicioContratoSH: '',
    fimContratoSH: '',
    modeloPSO: '',
    numeroSeriePSO: '',
    softwarePSO: ''
  }

  const mockSelectedPlanDetails = {
    id: 'sh_simple',
    name: 'SIMPLE',
    description: 'Pacote de 10:00/ano\nDuas deslocações/ano - Seg. a Sexta-Feira entre as 9:00 e as 19:00\nAssistência Remota - Seg. a Sexta-Feira entre as 9:00 e as 23:00',
    hoursPerYear: 10,
    displacementsIncluded: 2,
    remoteSupport: 'Segunda a Sexta-Feira entre as 9:00 e as 23:00',
    weekendSupport: false,
    prices: {
      under180km: {
        monthly: 30.00,
        quarterly: 130.00,
        semiannual: 185.00,
        annual: 330.00
      },
      over180km: {
        monthly: 35.00,
        quarterly: 150.00,
        semiannual: 215.00,
        annual: 390.00
      }
    }
  }

  const mockShEquipments = [
    {
      id: '1',
      modelo: 'Dell Optiplex 7090',
      numeroSerie: 'ABC123456',
      software: 'Windows 11 Pro',
      observacoes: 'Test equipment'
    }
  ]

  it('renders S&H contract configuration fields', () => {
    const wrapper = mount(SHContractSection, {
      props: {
        formData: mockFormData,
        selectedPlanDetails: null,
        shEquipments: []
      }
    })

    // Check that all required fields are present
    expect(wrapper.text()).toContain('PLANO S&H')
    expect(wrapper.text()).toContain('DISTÂNCIA')
    expect(wrapper.text()).toContain('EQUIPAMENTOS S&H')
    expect(wrapper.text()).toContain('DATAS DO CONTRATO')
  })

  it('emits update-field event when plan is selected', async () => {
    const wrapper = mount(SHContractSection, {
      props: {
        formData: mockFormData,
        selectedPlanDetails: null,
        shEquipments: []
      }
    })

    // Call the handlePlanSelection method directly
    await (wrapper.vm as any).handlePlanSelection('sh_simple')

    expect(wrapper.emitted('plan-selected')).toBeTruthy()
    expect(wrapper.emitted('plan-selected')?.[0]).toEqual(['sh_simple'])
  })

  it('displays dynamic plan details when plan is selected', () => {
    const wrapper = mount(SHContractSection, {
      props: {
        formData: mockFormData,
        selectedPlanDetails: mockSelectedPlanDetails,
        shEquipments: []
      }
    })

    // Check that DynamicPlanDetails component is rendered
    expect(wrapper.findComponent({ name: 'DynamicPlanDetails' }).exists()).toBe(true)
  })

  it('does not display dynamic plan details when no plan is selected', () => {
    const wrapper = mount(SHContractSection, {
      props: {
        formData: { ...mockFormData, planIdSH: '' },
        selectedPlanDetails: null,
        shEquipments: []
      }
    })

    // Check that DynamicPlanDetails component is not rendered
    expect(wrapper.findComponent({ name: 'DynamicPlanDetails' }).exists()).toBe(false)
  })

  it('passes correct props to DynamicPlanDetails', () => {
    const wrapper = mount(SHContractSection, {
      props: {
        formData: mockFormData,
        selectedPlanDetails: mockSelectedPlanDetails,
        shEquipments: []
      }
    })

    const dynamicPlanDetails = wrapper.findComponent({ name: 'DynamicPlanDetails' })
    expect(dynamicPlanDetails.props('planDetails')).toEqual(mockSelectedPlanDetails)
    expect(dynamicPlanDetails.props('selectedPayment')).toBe('')
    expect(dynamicPlanDetails.props('distance')).toBe('under180km')
  })

  it('emits payment selection from DynamicPlanDetails', async () => {
    const wrapper = mount(SHContractSection, {
      props: {
        formData: mockFormData,
        selectedPlanDetails: mockSelectedPlanDetails,
        shEquipments: []
      }
    })

    const dynamicPlanDetails = wrapper.findComponent({ name: 'DynamicPlanDetails' })
    await dynamicPlanDetails.vm.$emit('payment-selected', 'MENSAL')

    expect(wrapper.emitted('update-field')).toBeTruthy()
    const updateFieldEvents = wrapper.emitted('update-field') as any[]
    const paymentEvent = updateFieldEvents.find(event => event[0] === 'modalidadePagamentoSH')
    expect(paymentEvent).toEqual(['modalidadePagamentoSH', 'MENSAL'])
  })

  it('renders distance field with correct options', () => {
    const wrapper = mount(SHContractSection, {
      props: {
        formData: mockFormData,
        selectedPlanDetails: null,
        shEquipments: []
      }
    })

    // Find the distance select element
    const distanceSelect = wrapper.find('select[data-testid="distance-select"]')
    const options = distanceSelect.findAll('option')
    
    expect(options).toHaveLength(3) // Empty option + 2 distance options
    expect(options[0].text()).toBe('Selecione a distância...')
    expect(options[1].text()).toBe('Menos de 180 km')
    expect(options[2].text()).toBe('Mais de 180 km')
    
    // Check option values
    expect(options[1].element.value).toBe('under180km')
    expect(options[2].element.value).toBe('over180km')
  })

  it('distance field is properly bound to form data', () => {
    const wrapper = mount(SHContractSection, {
      props: {
        formData: { ...mockFormData, distanceSH: 'over180km' },
        selectedPlanDetails: null,
        shEquipments: []
      }
    })

    // Find the distance select element
    const distanceSelect = wrapper.find('select[data-testid="distance-select"]')
    
    // Check that the select has the correct model-value attribute
    expect(distanceSelect.attributes('model-value')).toBe('over180km')
  })

  it('passes distance prop to DynamicPlanDetails correctly', () => {
    const wrapper = mount(SHContractSection, {
      props: {
        formData: { ...mockFormData, distanceSH: 'over180km' },
        selectedPlanDetails: mockSelectedPlanDetails,
        shEquipments: []
      }
    })

    const dynamicPlanDetails = wrapper.findComponent({ name: 'DynamicPlanDetails' })
    expect(dynamicPlanDetails.props('distance')).toBe('over180km')
  })

  it('renders equipment management section correctly', () => {
    const wrapper = mount(SHContractSection, {
      props: {
        formData: mockFormData,
        selectedPlanDetails: null,
        shEquipments: mockShEquipments
      }
    })

    // Check that equipment section exists
    expect(wrapper.text()).toContain('EQUIPAMENTOS S&H')
    
    // Check for add equipment button
    const addButton = wrapper.find('.add-equipment-btn')
    expect(addButton.exists()).toBe(true)
    expect(addButton.text()).toContain('ADICIONAR EQUIPAMENTO')
    
    // Check that equipment cards are rendered
    expect(wrapper.findAllComponents({ name: 'SHEquipmentCard' })).toHaveLength(1)
  })

  it('renders equipment cards when equipments are provided', () => {
    const wrapper = mount(SHContractSection, {
      props: {
        formData: mockFormData,
        selectedPlanDetails: null,
        shEquipments: mockShEquipments
      }
    })

    // Check that equipment cards are rendered
    const equipmentCards = wrapper.findAllComponents({ name: 'SHEquipmentCard' })
    expect(equipmentCards).toHaveLength(1)
    
    // Check that the equipment card receives correct props
    const firstCard = equipmentCards[0]
    expect(firstCard.props('equipment')).toEqual(mockShEquipments[0])
    expect(firstCard.props('equipmentNumber')).toBe(1)
  })
})