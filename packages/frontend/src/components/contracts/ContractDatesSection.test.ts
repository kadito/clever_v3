import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContractDatesSection from './ContractDatesSection.vue'

describe('ContractDatesSection', () => {
  it('renders correctly with props', () => {
    const wrapper = mount(ContractDatesSection, {
      props: {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }
    })

    expect(wrapper.find('h4').text()).toBe('DATAS DO CONTRATO')
    
    const inputs = wrapper.findAll('input[type="date"]')
    expect(inputs).toHaveLength(2)
    
    // Check that the inputs have the correct value attributes
    expect(inputs[0].element.value).toBe('2024-01-01')
    expect(inputs[1].element.value).toBe('2024-12-31')
  })

  it('emits update events when dates change', async () => {
    const wrapper = mount(ContractDatesSection, {
      props: {
        startDate: '',
        endDate: ''
      }
    })

    const inputs = wrapper.findAll('input[type="date"]')
    
    // Test start date update by setting value and triggering input event
    await inputs[0].setValue('2024-01-01')
    expect(wrapper.emitted('update:start-date')).toBeTruthy()
    
    // Test end date update by setting value and triggering input event
    await inputs[1].setValue('2024-12-31')
    expect(wrapper.emitted('update:end-date')).toBeTruthy()
  })

  it('has proper labels for accessibility', () => {
    const wrapper = mount(ContractDatesSection, {
      props: {
        startDate: '',
        endDate: ''
      }
    })

    const labels = wrapper.findAll('label')
    expect(labels[0].text()).toBe('DATA DE INÍCIO')
    expect(labels[1].text()).toBe('DATA DE FIM')
  })

  it('applies correct CSS classes for mobile-first design', () => {
    const wrapper = mount(ContractDatesSection, {
      props: {
        startDate: '',
        endDate: ''
      }
    })

    expect(wrapper.find('.contract-dates-section').exists()).toBe(true)
    expect(wrapper.find('.dates-grid').exists()).toBe(true)
    expect(wrapper.findAll('.form-field')).toHaveLength(2)
  })

  it('has touch-friendly input styling', () => {
    const wrapper = mount(ContractDatesSection, {
      props: {
        startDate: '',
        endDate: ''
      }
    })

    const inputs = wrapper.findAll('.form-input')
    expect(inputs).toHaveLength(2)
    
    // Check that inputs have the form-input class for styling
    inputs.forEach(input => {
      expect(input.classes()).toContain('form-input')
    })
  })
})