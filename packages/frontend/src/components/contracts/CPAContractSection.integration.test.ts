import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CPAContractSection from './CPAContractSection.vue'

// Mock the contract plans data
vi.mock('@/config/contract-plans.json', () => ({
  default: {
    CPA: {
      plans: [
        {
          id: 'cpa_essential',
          name: 'ESSENTIAL CARE',
          description: 'Assistência Remota: De Segunda a Sexta entre as 9:00 e as 19:00',
          maintenancePerYear: 1,
          callouts: 'Intervenções necessárias adicionais',
          remoteSupport: 'De Segunda a Sexta entre as 9:00 e as 19:00',
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

describe('CPAContractSection Integration', () => {
  const mockFormData = {
    cpaContractType: 'CPA',
    planIdCPA: 'cpa_essential',
    distanceCPA: 'under180km',
    modalidadePagamentoCPA: '',
    inicioContratoCPA: '',
    fimContratoCPA: ''
  }

  const mockSelectedPlanDetails = {
    id: 'cpa_essential',
    name: 'ESSENTIAL CARE',
    description: 'Assistência Remota: De Segunda a Sexta entre as 9:00 e as 19:00',
    maintenancePerYear: 1,
    callouts: 'Intervenções necessárias adicionais',
    remoteSupport: 'De Segunda a Sexta entre as 9:00 e as 19:00',
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

  it('renders CPA contract configuration fields', () => {
    const wrapper = mount(CPAContractSection, {
      props: {
        formData: mockFormData,
        cpaEquipments: [],
        selectedPlanDetails: null
      }
    })

    // Check that all required fields are present
    expect(wrapper.text()).toContain('TIPO DE CONTRATO CPA')
    expect(wrapper.text()).toContain('PLANO CPA')
    expect(wrapper.text()).toContain('DISTÂNCIA')
    expect(wrapper.text()).toContain('DATAS DO CONTRATO')
  })

  it('emits update-field event when plan is selected', async () => {
    const wrapper = mount(CPAContractSection, {
      props: {
        formData: mockFormData,
        cpaEquipments: [],
        selectedPlanDetails: null
      }
    })

    // Call the handlePlanSelection method directly
    await (wrapper.vm as any).handlePlanSelection('cpa_essential')

    expect(wrapper.emitted('plan-selected')).toBeTruthy()
    expect(wrapper.emitted('plan-selected')?.[0]).toEqual(['cpa_essential'])
  })

  it('displays dynamic plan details when plan is selected', () => {
    const wrapper = mount(CPAContractSection, {
      props: {
        formData: mockFormData,
        cpaEquipments: [],
        selectedPlanDetails: mockSelectedPlanDetails
      }
    })

    // Check that DynamicPlanDetails component is rendered
    expect(wrapper.findComponent({ name: 'DynamicPlanDetails' }).exists()).toBe(true)
  })

  it('does not display dynamic plan details when no plan is selected', () => {
    const wrapper = mount(CPAContractSection, {
      props: {
        formData: { ...mockFormData, planIdCPA: '' },
        cpaEquipments: [],
        selectedPlanDetails: null
      }
    })

    // Check that DynamicPlanDetails component is not rendered
    expect(wrapper.findComponent({ name: 'DynamicPlanDetails' }).exists()).toBe(false)
  })

  it('passes correct props to DynamicPlanDetails', () => {
    const wrapper = mount(CPAContractSection, {
      props: {
        formData: mockFormData,
        cpaEquipments: [],
        selectedPlanDetails: mockSelectedPlanDetails
      }
    })

    const dynamicPlanDetails = wrapper.findComponent({ name: 'DynamicPlanDetails' })
    expect(dynamicPlanDetails.props('planDetails')).toEqual(mockSelectedPlanDetails)
    expect(dynamicPlanDetails.props('selectedPayment')).toBe('')
    expect(dynamicPlanDetails.props('distance')).toBe('under180km')
  })

  it('emits payment selection from DynamicPlanDetails', async () => {
    const wrapper = mount(CPAContractSection, {
      props: {
        formData: mockFormData,
        cpaEquipments: [],
        selectedPlanDetails: mockSelectedPlanDetails
      }
    })

    const dynamicPlanDetails = wrapper.findComponent({ name: 'DynamicPlanDetails' })
    await dynamicPlanDetails.vm.$emit('payment-selected', 'MENSAL')

    expect(wrapper.emitted('update-field')).toBeTruthy()
    const updateFieldEvents = wrapper.emitted('update-field') as any[]
    const paymentEvent = updateFieldEvents.find(event => event[0] === 'modalidadePagamentoCPA')
    expect(paymentEvent).toEqual(['modalidadePagamentoCPA', 'MENSAL'])
  })

  it('renders distance field with correct options', () => {
    const wrapper = mount(CPAContractSection, {
      props: {
        formData: mockFormData,
        cpaEquipments: [],
        selectedPlanDetails: null
      }
    })

    // Find the distance select element
    const distanceSelect = wrapper.findAll('.config-select')[2]
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
    const wrapper = mount(CPAContractSection, {
      props: {
        formData: { ...mockFormData, distanceCPA: 'over180km' },
        cpaEquipments: [],
        selectedPlanDetails: null
      }
    })

    // Find the distance select element
    const distanceSelect = wrapper.findAll('.config-select')[2]
    
    // Check that the select has the correct model-value attribute
    expect(distanceSelect.attributes('model-value')).toBe('over180km')
  })

  it('passes distance prop to DynamicPlanDetails correctly', () => {
    const wrapper = mount(CPAContractSection, {
      props: {
        formData: { ...mockFormData, distanceCPA: 'over180km' },
        cpaEquipments: [],
        selectedPlanDetails: mockSelectedPlanDetails
      }
    })

    const dynamicPlanDetails = wrapper.findComponent({ name: 'DynamicPlanDetails' })
    expect(dynamicPlanDetails.props('distance')).toBe('over180km')
  })
})