import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SHEquipmentCard from './SHEquipmentCard.vue'

describe('SHEquipmentCard', () => {
  const mockEquipment = {
    id: '1',
    modelo: 'Dell Optiplex 7090',
    numeroSerie: 'ABC123456',
    software: 'Windows 11 Pro',
    observacoes: 'Test equipment'
  }

  const defaultProps = {
    equipment: mockEquipment,
    equipmentNumber: 1
  }

  it('renders equipment card with correct header', () => {
    const wrapper = mount(SHEquipmentCard, {
      props: defaultProps
    })

    expect(wrapper.text()).toContain('EQUIPAMENTO S&H 1')
  })

  it('renders all equipment fields with correct labels', () => {
    const wrapper = mount(SHEquipmentCard, {
      props: defaultProps
    })

    expect(wrapper.text()).toContain('MODELO')
    expect(wrapper.text()).toContain('Nº SÉRIE')
    expect(wrapper.text()).toContain('SOFTWARE')
    expect(wrapper.text()).toContain('OBSERVAÇÕES')
  })

  it('displays equipment data in form fields', () => {
    const wrapper = mount(SHEquipmentCard, {
      props: defaultProps
    })

    const modeloInput = wrapper.find('input[placeholder="Ex: Dell Optiplex 7090"]')
    const serieInput = wrapper.find('input[placeholder="Ex: ABC123456"]')
    const softwareInput = wrapper.find('input[placeholder="Ex: Windows 11 Pro"]')
    const observacoesTextarea = wrapper.find('textarea[placeholder="Observações sobre este equipamento..."]')

    expect(modeloInput.element.value).toBe('Dell Optiplex 7090')
    expect(serieInput.element.value).toBe('ABC123456')
    expect(softwareInput.element.value).toBe('Windows 11 Pro')
    expect(observacoesTextarea.element.value).toBe('Test equipment')
  })

  it('shows remove button for equipment number > 1', () => {
    const wrapper = mount(SHEquipmentCard, {
      props: {
        ...defaultProps,
        equipmentNumber: 2
      }
    })

    const removeButton = wrapper.find('.remove-btn')
    expect(removeButton.exists()).toBe(true)
    expect(removeButton.text()).toBe('✕')
  })

  it('does not show remove button for first equipment', () => {
    const wrapper = mount(SHEquipmentCard, {
      props: {
        ...defaultProps,
        equipmentNumber: 1
      }
    })

    const removeButton = wrapper.find('.remove-btn')
    expect(removeButton.exists()).toBe(false)
  })

  it('emits update event when equipment data changes', async () => {
    const wrapper = mount(SHEquipmentCard, {
      props: defaultProps
    })

    const modeloInput = wrapper.find('input[placeholder="Ex: Dell Optiplex 7090"]')
    await modeloInput.setValue('New Model')

    expect(wrapper.emitted('update')).toBeTruthy()
    const updateEvents = wrapper.emitted('update') as any[]
    expect(updateEvents[0][0]).toEqual({
      ...mockEquipment,
      modelo: 'New Model'
    })
  })

  it('emits remove event when remove button is clicked', async () => {
    const wrapper = mount(SHEquipmentCard, {
      props: {
        ...defaultProps,
        equipmentNumber: 2
      }
    })

    const removeButton = wrapper.find('.remove-btn')
    await removeButton.trigger('click')

    expect(wrapper.emitted('remove')).toBeTruthy()
  })

  it('updates local equipment data when prop changes', async () => {
    const wrapper = mount(SHEquipmentCard, {
      props: defaultProps
    })

    const newEquipment = {
      ...mockEquipment,
      modelo: 'Updated Model'
    }

    await wrapper.setProps({ equipment: newEquipment })

    const modeloInput = wrapper.find('input[placeholder="Ex: Dell Optiplex 7090"]')
    expect(modeloInput.element.value).toBe('Updated Model')
  })

  it('has proper Portuguese placeholders', () => {
    const wrapper = mount(SHEquipmentCard, {
      props: defaultProps
    })

    const modeloInput = wrapper.find('input[placeholder="Ex: Dell Optiplex 7090"]')
    const serieInput = wrapper.find('input[placeholder="Ex: ABC123456"]')
    const softwareInput = wrapper.find('input[placeholder="Ex: Windows 11 Pro"]')
    const observacoesTextarea = wrapper.find('textarea[placeholder="Observações sobre este equipamento..."]')

    expect(modeloInput.exists()).toBe(true)
    expect(serieInput.exists()).toBe(true)
    expect(softwareInput.exists()).toBe(true)
    expect(observacoesTextarea.exists()).toBe(true)
  })

  it('has proper CSS classes for styling', () => {
    const wrapper = mount(SHEquipmentCard, {
      props: defaultProps
    })

    expect(wrapper.find('.sh-equipment-card').exists()).toBe(true)
    expect(wrapper.find('.equipment-header').exists()).toBe(true)
    expect(wrapper.find('.equipment-fields').exists()).toBe(true)
    expect(wrapper.findAll('.form-field').length).toBeGreaterThan(0)
  })
})