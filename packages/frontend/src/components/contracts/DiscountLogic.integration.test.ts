import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import CPAEquipmentManager from './CPAEquipmentManager.vue';
import EquipmentCard from './EquipmentCard.vue';
import type { ContractEquipment } from '@clever/shared';

describe('Discount Logic Integration', () => {
  it('implements correct discount logic: 0% for first equipment, configurable for others', async () => {
    // Start with empty equipment list
    const wrapper = mount(CPAEquipmentManager, {
      props: {
        equipments: [],
      },
    });

    // Add first equipment - should have 0% discount
    await wrapper.find('.add-equipment-btn').trigger('click');

    let emitted = wrapper.emitted('equipment-updated');
    expect(emitted).toHaveLength(1);
    expect(emitted![0][0]).toEqual({
      action: 'add',
      equipment: expect.objectContaining({
        desconto: 0, // First equipment has 0% discount
      }),
    });

    // Simulate having one equipment and add a second one
    const oneEquipment: ContractEquipment[] = [
      {
        id: '1',
        modelo: 'GEST 15',
        numeroSerie: '123456',
        desconto: 0,
        observacoes: 'First equipment',
      },
    ];

    await wrapper.setProps({ equipments: oneEquipment });

    // Add second equipment - should have 10% discount
    await wrapper.find('.add-equipment-btn').trigger('click');

    emitted = wrapper.emitted('equipment-updated');
    expect(emitted).toHaveLength(2);
    expect(emitted![1][0]).toEqual({
      action: 'add',
      equipment: expect.objectContaining({
        desconto: 10, // Additional equipment has 10% discount
      }),
    });
  });

  it('shows discount field only for additional equipment (index > 0)', () => {
    const equipments: ContractEquipment[] = [
      {
        id: '1',
        modelo: 'GEST 15',
        numeroSerie: '123456',
        desconto: 0,
        observacoes: 'First equipment',
      },
      {
        id: '2',
        modelo: 'GEST 20',
        numeroSerie: '789012',
        desconto: 15,
        observacoes: 'Second equipment',
      },
      {
        id: '3',
        modelo: 'GEST 25',
        numeroSerie: '345678',
        desconto: 20,
        observacoes: 'Third equipment',
      },
    ];

    const wrapper = mount(CPAEquipmentManager, {
      props: {
        equipments,
      },
    });

    const equipmentCards = wrapper.findAllComponents(EquipmentCard);
    expect(equipmentCards).toHaveLength(3);

    // First equipment (index 0) - no discount field
    expect(equipmentCards[0].props('equipmentNumber')).toBe(1);
    expect(equipmentCards[0].props('showDiscount')).toBe(false);
    expect(equipmentCards[0].props('equipment').desconto).toBe(0);

    // Second equipment (index 1) - shows discount field
    expect(equipmentCards[1].props('equipmentNumber')).toBe(2);
    expect(equipmentCards[1].props('showDiscount')).toBe(true);
    expect(equipmentCards[1].props('equipment').desconto).toBe(15);

    // Third equipment (index 2) - shows discount field
    expect(equipmentCards[2].props('equipmentNumber')).toBe(3);
    expect(equipmentCards[2].props('showDiscount')).toBe(true);
    expect(equipmentCards[2].props('equipment').desconto).toBe(20);
  });

  it('displays correct info callout about discount rules', () => {
    const wrapper = mount(CPAEquipmentManager, {
      props: {
        equipments: [],
      },
    });

    const callout = wrapper.find('.equipment-info-callout');
    expect(callout.exists()).toBe(true);
    expect(callout.text()).toContain(
      'O desconto aplica-se apenas aos equipamentos adicionais (2º, 3º, etc.)'
    );
    expect(callout.text()).toContain('O primeiro equipamento não tem desconto');
  });

  it('equipment card properly handles discount field visibility and constraints', async () => {
    const equipmentWithDiscount: ContractEquipment = {
      id: '2',
      modelo: 'GEST 20',
      numeroSerie: '789012',
      desconto: 15,
      observacoes: 'Second equipment',
    };

    // Test equipment with discount field shown
    const wrapperWithDiscount = mount(EquipmentCard, {
      props: {
        equipment: equipmentWithDiscount,
        equipmentNumber: 2,
        showDiscount: true,
      },
    });

    const discountInput = wrapperWithDiscount.find('input[type="number"]');
    expect(discountInput.exists()).toBe(true);
    expect(discountInput.element.value).toBe('15');
    expect(discountInput.attributes('min')).toBe('0');
    expect(discountInput.attributes('max')).toBe('100');

    // Test equipment without discount field (first equipment)
    const firstEquipment: ContractEquipment = {
      id: '1',
      modelo: 'GEST 15',
      numeroSerie: '123456',
      desconto: 0,
      observacoes: 'First equipment',
    };

    const wrapperFirstEquipment = mount(EquipmentCard, {
      props: {
        equipment: firstEquipment,
        equipmentNumber: 1,
        showDiscount: false,
      },
    });

    const noDiscountInput = wrapperFirstEquipment.find('input[type="number"]');
    expect(noDiscountInput.exists()).toBe(false);
  });
});
