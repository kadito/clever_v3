import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ClientSearchInput from './ClientSearchInput.vue';

// Mock the useApi composable
vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    fetchList: vi.fn().mockResolvedValue(undefined),
    fetchById: vi.fn().mockResolvedValue(undefined),
    items: { value: [] },
    currentItem: { value: null }
  })
}));

describe('ClientSearchInput', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default props', () => {
    const wrapper = mount(ClientSearchInput);
    
    expect(wrapper.find('input').exists()).toBe(true);
    expect(wrapper.find('input').attributes('placeholder')).toBe('Pesquisar cliente...');
  });

  it('renders with custom placeholder', () => {
    const wrapper = mount(ClientSearchInput, {
      props: {
        placeholder: 'Custom placeholder'
      }
    });
    
    expect(wrapper.find('input').attributes('placeholder')).toBe('Custom placeholder');
  });

  it('shows loading state when searching', async () => {
    const wrapper = mount(ClientSearchInput);
    const input = wrapper.find('input');
    
    // Type enough characters to trigger search
    await input.setValue('test client');
    await input.trigger('input');
    
    // Should show loading spinner
    expect(wrapper.find('.animate-spin').exists()).toBe(true);
  });

  it('emits update:modelValue when client is selected', async () => {
    const wrapper = mount(ClientSearchInput);
    
    // Simulate client selection
    const mockClient = {
      uuid: 'test-uuid',
      data: {
        nomeEmpresa: 'Test Company'
      }
    };
    
    await wrapper.vm.selectClient(mockClient);
    
    expect(wrapper.emitted('update:modelValue')).toBeTruthy();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual(['test-uuid']);
  });

  it('emits clientSelected when client is selected', async () => {
    const wrapper = mount(ClientSearchInput);
    
    // Simulate client selection
    const mockClient = {
      uuid: 'test-uuid',
      data: {
        nomeEmpresa: 'Test Company'
      }
    };
    
    await wrapper.vm.selectClient(mockClient);
    
    expect(wrapper.emitted('clientSelected')).toBeTruthy();
    expect(wrapper.emitted('clientSelected')?.[0]).toEqual([mockClient]);
  });

  it('makes search request on focus even without text input', async () => {
    const wrapper = mount(ClientSearchInput);
    const input = wrapper.find('input');
    
    // Focus the input without typing anything
    await input.trigger('focus');
    
    // Should show loading state indicating a search request was made
    expect(wrapper.find('.animate-spin').exists()).toBe(true);
  });

  it('shows disabled state when disabled prop is true', () => {
    const wrapper = mount(ClientSearchInput, {
      props: {
        disabled: true
      }
    });
    
    const input = wrapper.find('input');
    expect(input.attributes('disabled')).toBeDefined();
    expect(input.classes()).toContain('bg-gray-100');
    expect(input.classes()).toContain('cursor-not-allowed');
  });

  it('shows error state when hasError prop is true', () => {
    const wrapper = mount(ClientSearchInput, {
      props: {
        hasError: true
      }
    });
    
    const input = wrapper.find('input');
    expect(input.classes()).toContain('border-red-300');
  });
});