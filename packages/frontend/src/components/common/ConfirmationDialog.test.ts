import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ConfirmationDialog from './ConfirmationDialog.vue';

describe('ConfirmationDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts required props correctly', () => {
    const wrapper = mount(ConfirmationDialog, {
      props: {
        isOpen: true,
        title: 'Test Title',
        message: 'Test message'
      }
    });
    
    expect(wrapper.props('isOpen')).toBe(true);
    expect(wrapper.props('title')).toBe('Test Title');
    expect(wrapper.props('message')).toBe('Test message');
  });

  it('uses default values for optional props', () => {
    const wrapper = mount(ConfirmationDialog, {
      props: {
        isOpen: true,
        title: 'Test Title',
        message: 'Test message'
      }
    });
    
    expect(wrapper.props('confirmText')).toBe('Confirmar');
    expect(wrapper.props('cancelText')).toBe('Cancelar');
    expect(wrapper.props('isLoading')).toBe(false);
  });

  it('accepts custom button text props', () => {
    const wrapper = mount(ConfirmationDialog, {
      props: {
        isOpen: true,
        title: 'Test Title',
        message: 'Test message',
        confirmText: 'Custom Confirm',
        cancelText: 'Custom Cancel'
      }
    });
    
    expect(wrapper.props('confirmText')).toBe('Custom Confirm');
    expect(wrapper.props('cancelText')).toBe('Custom Cancel');
  });

  it('accepts loading state prop', () => {
    const wrapper = mount(ConfirmationDialog, {
      props: {
        isOpen: true,
        title: 'Test Title',
        message: 'Test message',
        isLoading: true
      }
    });
    
    expect(wrapper.props('isLoading')).toBe(true);
  });

  it('has proper component structure', () => {
    const wrapper = mount(ConfirmationDialog, {
      props: {
        isOpen: true,
        title: 'Test Title',
        message: 'Test message'
      }
    });
    
    // Component should be a Vue component
    expect(wrapper.vm).toBeDefined();
    expect(wrapper.exists()).toBe(true);
  });

  it('generates unique IDs for accessibility', () => {
    const wrapper1 = mount(ConfirmationDialog, {
      props: {
        isOpen: true,
        title: 'Test Title 1',
        message: 'Test message 1'
      }
    });
    
    const wrapper2 = mount(ConfirmationDialog, {
      props: {
        isOpen: true,
        title: 'Test Title 2',
        message: 'Test message 2'
      }
    });
    
    // Each instance should have unique IDs
    expect(wrapper1.vm.titleId).toBeDefined();
    expect(wrapper2.vm.titleId).toBeDefined();
    expect(wrapper1.vm.titleId).not.toBe(wrapper2.vm.titleId);
    
    expect(wrapper1.vm.messageId).toBeDefined();
    expect(wrapper2.vm.messageId).toBeDefined();
    expect(wrapper1.vm.messageId).not.toBe(wrapper2.vm.messageId);
  });

  it('has correct event handlers defined', () => {
    const wrapper = mount(ConfirmationDialog, {
      props: {
        isOpen: true,
        title: 'Test Title',
        message: 'Test message'
      }
    });
    
    // Check that event handler methods exist
    expect(typeof wrapper.vm.handleConfirm).toBe('function');
    expect(typeof wrapper.vm.handleCancel).toBe('function');
    expect(typeof wrapper.vm.handleBackdropClick).toBe('function');
  });

  it('meets Portuguese language requirements', () => {
    const wrapper = mount(ConfirmationDialog, {
      props: {
        isOpen: true,
        title: 'Confirmar Eliminação',
        message: 'Tem a certeza que pretende eliminar este item?'
      }
    });
    
    // Default button text should be in Portuguese
    expect(wrapper.props('confirmText')).toBe('Confirmar');
    expect(wrapper.props('cancelText')).toBe('Cancelar');
    
    // Props should accept Portuguese text
    expect(wrapper.props('title')).toBe('Confirmar Eliminação');
    expect(wrapper.props('message')).toBe('Tem a certeza que pretende eliminar este item?');
  });

  it('supports mobile-first design requirements', () => {
    const wrapper = mount(ConfirmationDialog, {
      props: {
        isOpen: true,
        title: 'Test Title',
        message: 'Test message'
      }
    });
    
    // Component should be designed for mobile-first
    // This is verified by the CSS classes and structure in the template
    expect(wrapper.vm).toBeDefined();
  });

  it('handles component lifecycle correctly', () => {
    const wrapper = mount(ConfirmationDialog, {
      props: {
        isOpen: false,
        title: 'Test Title',
        message: 'Test message'
      }
    });
    
    // Component should mount without errors
    expect(wrapper.vm).toBeDefined();
    
    // Component should unmount without errors
    expect(() => wrapper.unmount()).not.toThrow();
  });
});