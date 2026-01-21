import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EquipmentCard from './EquipmentCard.vue';
import type { ContractEquipment } from '@clever/shared';

describe('EquipmentCard', () => {
  const mockEquipment: ContractEquipment = {
    id: '1',
    modelo: 'GEST 15',
    numeroSerie: '123456',
    desconto: 10,
    observacoes: 'Test equipment',
  };

  it('renders equipment card with correct number', () => {
    const wrapper = mount(EquipmentCard, {
      props: {
        equipment: mockEquipment,
        equipmentNumber: 2,
        showDiscount: true,
      },
    });

    expect(wrapper.find('h5').text()).toBe('EQUIPAMENTO 2');
  });

  it('shows remove button for equipment number > 1', () => {
    const wrapper = mount(EquipmentCard, {
      props: {
        equipment: mockEquipment,
        equipmentNumber: 2,
        showDiscount: true,
      },
    });

    expect(wrapper.find('.remove-btn').exists()).toBe(true);
  });

  it('hides remove button for first equipment', () => {
    const wrapper = mount(EquipmentCard, {
      props: {
        equipment: mockEquipment,
        equipmentNumber: 1,
        showDiscount: false,
      },
    });

    expect(wrapper.find('.remove-btn').exists()).toBe(false);
  });

  it('shows discount field when showDiscount is true', () => {
    const wrapper = mount(EquipmentCard, {
      props: {
        equipment: mockEquipment,
        equipmentNumber: 2,
        showDiscount: true,
      },
    });

    const discountField = wrapper.find('input[type="number"]');
    expect(discountField.exists()).toBe(true);
    expect(discountField.element.value).toBe('10');
  });

  it('hides discount field when showDiscount is false', () => {
    const wrapper = mount(EquipmentCard, {
      props: {
        equipment: mockEquipment,
        equipmentNumber: 1,
        showDiscount: false,
      },
    });

    const discountField = wrapper.find('input[type="number"]');
    expect(discountField.exists()).toBe(false);
  });

  it('displays equipment data in form fields', () => {
    const wrapper = mount(EquipmentCard, {
      props: {
        equipment: mockEquipment,
        equipmentNumber: 1,
        showDiscount: false,
      },
    });

    const modeloInput = wrapper.find('input[placeholder="Ex: GEST 15"]');
    const serieInput = wrapper.find('input[placeholder="Ex: 1234567"]');
    const observacoesTextarea = wrapper.find('textarea');

    expect(modeloInput.element.value).toBe('GEST 15');
    expect(serieInput.element.value).toBe('123456');
    expect(observacoesTextarea.element.value).toBe('Test equipment');
  });

  it('emits update event when input values change', async () => {
    const wrapper = mount(EquipmentCard, {
      props: {
        equipment: mockEquipment,
        equipmentNumber: 1,
        showDiscount: false,
      },
    });

    const modeloInput = wrapper.find('input[placeholder="Ex: GEST 15"]');
    await modeloInput.setValue('New Model');

    const emitted = wrapper.emitted('update');
    expect(emitted).toHaveLength(1);
    expect(emitted![0][0]).toEqual(
      expect.objectContaining({
        modelo: 'New Model',
      })
    );
  });

  it('emits remove event when remove button is clicked', async () => {
    const wrapper = mount(EquipmentCard, {
      props: {
        equipment: mockEquipment,
        equipmentNumber: 2,
        showDiscount: true,
      },
    });

    await wrapper.find('.remove-btn').trigger('click');

    const emitted = wrapper.emitted('remove');
    expect(emitted).toHaveLength(1);
  });

  it('updates local equipment data when prop changes', async () => {
    const wrapper = mount(EquipmentCard, {
      props: {
        equipment: mockEquipment,
        equipmentNumber: 1,
        showDiscount: false,
      },
    });

    const newEquipment: ContractEquipment = {
      id: '1',
      modelo: 'Updated Model',
      numeroSerie: '999999',
      desconto: 0,
      observacoes: 'Updated notes',
    };

    await wrapper.setProps({ equipment: newEquipment });

    const modeloInput = wrapper.find('input[placeholder="Ex: GEST 15"]');
    const serieInput = wrapper.find('input[placeholder="Ex: 1234567"]');
    const observacoesTextarea = wrapper.find('textarea');

    expect(modeloInput.element.value).toBe('Updated Model');
    expect(serieInput.element.value).toBe('999999');
    expect(observacoesTextarea.element.value).toBe('Updated notes');
  });

  it('has proper form labels', () => {
    const wrapper = mount(EquipmentCard, {
      props: {
        equipment: mockEquipment,
        equipmentNumber: 2,
        showDiscount: true,
      },
    });

    const labels = wrapper.findAll('.form-label');
    const labelTexts = labels.map(label => label.text());

    expect(labelTexts).toContain('MODELO');
    expect(labelTexts).toContain('Nº SÉRIE');
    expect(labelTexts).toContain('DESCONTO (%)');
    expect(labelTexts).toContain('OBSERVAÇÕES');
  });
});
