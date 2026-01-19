import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DisplayToggleSwitch from './DisplayToggleSwitch.vue'

describe('DisplayToggleSwitch', () => {
  it('renders with correct title', () => {
    const wrapper = mount(DisplayToggleSwitch, {
      props: {
        title: 'CPA - CASHLOGY',
        isActive: false
      }
    })

    expect(wrapper.find('.toggle-title').text()).toBe('CPA - CASHLOGY')
  })

  it('applies inactive class when isActive is false', () => {
    const wrapper = mount(DisplayToggleSwitch, {
      props: {
        title: 'CPA - CASHLOGY',
        isActive: false
      }
    })

    expect(wrapper.find('.toggle-item').classes()).toContain('inactive')
    expect(wrapper.find('.toggle-switch').classes()).not.toContain('active')
  })

  it('applies active class when isActive is true', () => {
    const wrapper = mount(DisplayToggleSwitch, {
      props: {
        title: 'CPA - CASHLOGY',
        isActive: true
      }
    })

    expect(wrapper.find('.toggle-item').classes()).not.toContain('inactive')
    expect(wrapper.find('.toggle-switch').classes()).toContain('active')
  })

  it('emits toggle event when clicked', async () => {
    const wrapper = mount(DisplayToggleSwitch, {
      props: {
        title: 'CPA - CASHLOGY',
        isActive: false
      }
    })

    await wrapper.find('.toggle-switch').trigger('click')

    expect(wrapper.emitted('toggle')).toBeTruthy()
    expect(wrapper.emitted('toggle')?.[0]).toEqual([true])
  })

  it('emits correct toggle value when active', async () => {
    const wrapper = mount(DisplayToggleSwitch, {
      props: {
        title: 'CPA - CASHLOGY',
        isActive: true
      }
    })

    await wrapper.find('.toggle-switch').trigger('click')

    expect(wrapper.emitted('toggle')).toBeTruthy()
    expect(wrapper.emitted('toggle')?.[0]).toEqual([false])
  })

  it('has proper visual feedback classes for inactive state', () => {
    const wrapper = mount(DisplayToggleSwitch, {
      props: {
        title: 'S&H - SOFTWARE E HARDWARE',
        isActive: false
      }
    })

    const toggleItem = wrapper.find('.toggle-item')
    const toggleSwitch = wrapper.find('.toggle-switch')
    const toggleSlider = wrapper.find('.toggle-slider')

    // Check that inactive visual feedback is applied
    expect(toggleItem.classes()).toContain('inactive')
    expect(toggleSwitch.classes()).not.toContain('active')
    expect(toggleSlider.exists()).toBe(true)
  })

  it('has proper visual feedback classes for active state', () => {
    const wrapper = mount(DisplayToggleSwitch, {
      props: {
        title: 'S&H - SOFTWARE E HARDWARE',
        isActive: true
      }
    })

    const toggleItem = wrapper.find('.toggle-item')
    const toggleSwitch = wrapper.find('.toggle-switch')
    const toggleSlider = wrapper.find('.toggle-slider')

    // Check that active visual feedback is applied
    expect(toggleItem.classes()).not.toContain('inactive')
    expect(toggleSwitch.classes()).toContain('active')
    expect(toggleSlider.exists()).toBe(true)
  })

  it('handles disabled state correctly', () => {
    const wrapper = mount(DisplayToggleSwitch, {
      props: {
        title: 'CPA - CASHLOGY',
        isActive: false,
        disabled: true
      }
    })

    const toggleSwitch = wrapper.find('.toggle-switch')
    
    expect(toggleSwitch.classes()).toContain('disabled')
    expect(toggleSwitch.attributes('disabled')).toBeDefined()
    expect(toggleSwitch.attributes('aria-pressed')).toBe('false')
  })

  it('does not emit toggle event when disabled', async () => {
    const wrapper = mount(DisplayToggleSwitch, {
      props: {
        title: 'CPA - CASHLOGY',
        isActive: false,
        disabled: true
      }
    })

    await wrapper.find('.toggle-switch').trigger('click')

    expect(wrapper.emitted('toggle')).toBeFalsy()
  })

  it('has proper ARIA attributes', () => {
    const wrapper = mount(DisplayToggleSwitch, {
      props: {
        title: 'CPA - CASHLOGY',
        isActive: true
      }
    })

    const toggleSwitch = wrapper.find('.toggle-switch')
    
    expect(toggleSwitch.attributes('aria-pressed')).toBe('true')
    expect(toggleSwitch.attributes('aria-label')).toBe('Desativar CPA - CASHLOGY')
  })
})