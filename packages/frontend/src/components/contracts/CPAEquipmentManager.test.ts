import { describe, it, expect, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import CPAEquipmentManager from './CPAEquipmentManager.vue';
import type { ContractEquipment } from '@clever/shared';

// Mock the EquipmentCard component
const mockEquipmentCard = {
  name: 'EquipmentCard',
  template: '<div data-testid="equipment-card">Equipment Card {{ equipmentNumber }}</div>',
  props: ['equipment', 'equipmentNumber', 'showDiscount'],
  emits: ['update', 'remove'],
};

describe('CPAEquipmentManager', () => {
  const mockEquipments: ContractEquipment[] = [
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
      desconto: 10,
      observacoes: 'Second equipment',
    },
  ];

  it('renders equipment manager with header and add button', () => {
    const wrapper = mount(CPAEquipmentManager, {
      props: {
        equipments: mockEquipments,
      },
      global: {
        components: {
          EquipmentCard: mockEquipmentCard,
        },
      },
    });

    expect(wrapper.find('h4').text()).toBe('EQUIPAMENTOS CPA');
    expect(wrapper.find('.add-equipment-btn').text()).toBe('+ ADICIONAR EQUIPAMENTO');
  });

  it('renders info callout about discount rules', () => {
    const wrapper = mount(CPAEquipmentManager, {
      props: {
        equipments: mockEquipments,
      },
      global: {
        components: {
          EquipmentCard: mockEquipmentCard,
        },
      },
    });

    const callout = wrapper.find('.equipment-info-callout');
    expect(callout.exists()).toBe(true);
    expect(callout.text()).toContain('O desconto aplica-se apenas aos equipamentos adicionais');
  });

  it('renders equipment cards with correct numbering', () => {
    const wrapper = mount(CPAEquipmentManager, {
      props: {
        equipments: mockEquipments,
      },
      global: {
        components: {
          EquipmentCard: mockEquipmentCard,
        },
      },
    });

    const equipmentCards = wrapper.findAllComponents(mockEquipmentCard);
    expect(equipmentCards).toHaveLength(2);

    // Check that equipment cards receive correct props
    expect(equipmentCards[0].props('equipmentNumber')).toBe(1);
    expect(equipmentCards[0].props('showDiscount')).toBe(false); // First equipment has no discount
    expect(equipmentCards[1].props('equipmentNumber')).toBe(2);
    expect(equipmentCards[1].props('showDiscount')).toBe(true); // Second equipment shows discount
  });

  it('emits equipment-updated event when adding equipment', async () => {
    const wrapper = mount(CPAEquipmentManager, {
      props: {
        equipments: [],
      },
      global: {
        components: {
          EquipmentCard: mockEquipmentCard,
        },
      },
    });

    await wrapper.find('.add-equipment-btn').trigger('click');

    const emitted = wrapper.emitted('equipment-updated');
    expect(emitted).toHaveLength(1);
    expect(emitted![0][0]).toEqual({
      action: 'add',
      equipment: expect.objectContaining({
        id: expect.any(String),
        modelo: '',
        numeroSerie: '',
        desconto: 0, // First equipment should have 0% discount
        observacoes: '',
      }),
    });
  });

  it('sets correct discount for additional equipment', async () => {
    const wrapper = mount(CPAEquipmentManager, {
      props: {
        equipments: mockEquipments, // Already has 2 equipments
      },
      global: {
        components: {
          EquipmentCard: mockEquipmentCard,
        },
      },
    });

    await wrapper.find('.add-equipment-btn').trigger('click');

    const emitted = wrapper.emitted('equipment-updated');
    expect(emitted).toHaveLength(1);
    expect(emitted![0][0]).toEqual({
      action: 'add',
      equipment: expect.objectContaining({
        desconto: 10, // Additional equipment should have 10% discount
      }),
    });
  });

  it('ensures first equipment always has 0% discount', () => {
    const wrapper = mount(CPAEquipmentManager, {
      props: {
        equipments: mockEquipments,
      },
      global: {
        components: {
          EquipmentCard: mockEquipmentCard,
        },
      },
    });

    const equipmentCards = wrapper.findAllComponents(mockEquipmentCard);

    // First equipment should not show discount field
    expect(equipmentCards[0].props('showDiscount')).toBe(false);
    expect(equipmentCards[0].props('equipment').desconto).toBe(0);

    // Second equipment should show discount field
    expect(equipmentCards[1].props('showDiscount')).toBe(true);
    expect(equipmentCards[1].props('equipment').desconto).toBe(10);
  });

  it('correctly handles discount logic for different equipment positions', () => {
    const singleEquipment: ContractEquipment[] = [
      {
        id: '1',
        modelo: 'GEST 15',
        numeroSerie: '123456',
        desconto: 0,
        observacoes: 'Only equipment',
      },
    ];

    const wrapper = mount(CPAEquipmentManager, {
      props: {
        equipments: singleEquipment,
      },
      global: {
        components: {
          EquipmentCard: mockEquipmentCard,
        },
      },
    });

    const equipmentCards = wrapper.findAllComponents(mockEquipmentCard);

    // Single equipment should not show discount field and have 0% discount
    expect(equipmentCards[0].props('showDiscount')).toBe(false);
    expect(equipmentCards[0].props('equipment').desconto).toBe(0);
    expect(equipmentCards[0].props('equipmentNumber')).toBe(1);
  });

  it('emits equipment-updated event when updating equipment', async () => {
    const wrapper = mount(CPAEquipmentManager, {
      props: {
        equipments: mockEquipments,
      },
      global: {
        components: {
          EquipmentCard: mockEquipmentCard,
        },
      },
    });

    const updatedEquipment: ContractEquipment = {
      id: '1',
      modelo: 'Updated Model',
      numeroSerie: '999999',
      desconto: 0,
      observacoes: 'Updated',
    };

    // Simulate equipment update from child component
    const equipmentCard = wrapper.findComponent(mockEquipmentCard);
    await equipmentCard.vm.$emit('update', updatedEquipment);

    const emitted = wrapper.emitted('equipment-updated');
    expect(emitted).toHaveLength(1);
    expect(emitted![0][0]).toEqual({
      action: 'update',
      index: 0,
      equipment: updatedEquipment,
    });
  });

  it('emits equipment-updated event when removing equipment', async () => {
    const wrapper = mount(CPAEquipmentManager, {
      props: {
        equipments: mockEquipments,
      },
      global: {
        components: {
          EquipmentCard: mockEquipmentCard,
        },
      },
    });

    // Simulate equipment removal from child component
    const equipmentCards = wrapper.findAllComponents(mockEquipmentCard);
    await equipmentCards[1].vm.$emit('remove');

    const emitted = wrapper.emitted('equipment-updated');
    expect(emitted).toHaveLength(1);
    expect(emitted![0][0]).toEqual({
      action: 'remove',
      index: 1,
    });
  });
});
