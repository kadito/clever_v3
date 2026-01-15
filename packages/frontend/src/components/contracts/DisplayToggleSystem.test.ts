import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import ContractsCreateView from '@/views/contracts/ContractsCreateView.vue'

// Mock the composables
const mockFormData = ref({
  clientId: '',
  hasCPAContract: false,
  hasSHContract: false,
  showCPASection: false,
  showSHSection: false
})

const mockUpdateFieldValue = (field: string, value: any) => {
  mockFormData.value[field as keyof typeof mockFormData.value] = value
}

// Mock all the required composables and components
vi.mock('@/composables/useSharedFormData', () => ({
  useSharedFormData: () => ({
    formData: mockFormData,
    updateFieldValue: mockUpdateFieldValue
  })
}))

vi.mock('@/composables/useApi', () => ({
  useApi: () => ({
    create: vi.fn(),
    item: ref(null)
  })
}))

vi.mock('@/composables/useErrorHandler', () => ({
  useErrorHandler: () => ({})
}))

vi.mock('@/composables/usePerformanceOptimizations', () => ({
  usePerformanceOptimizations: () => ({
    createDebounced: (fn: Function) => fn,
    createCache: () => new Map()
  })
}))

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: vi.fn()
  })
}))

// Mock the child components
vi.mock('@/components/common/ContentCreateTemplate.vue', () => ({
  default: {
    name: 'ContentCreateTemplate',
    template: `
      <div class="content-create-template">
        <slot name="field-contractTypes" :formData="formData" :updateFieldValue="updateFieldValue">
          <div class="contract-types-wrapper">
            <div class="contract-types-section">
              <div class="contract-type-section">
                <div class="display-toggle-container">
                  <div class="toggle-item">CPA Toggle</div>
                </div>
              </div>
              <div class="contract-type-section">
                <div class="display-toggle-container">
                  <div class="toggle-item">S&H Toggle</div>
                </div>
              </div>
            </div>
          </div>
        </slot>
      </div>
    `,
    props: ['formSections', 'isLoading', 'isSaving', 'error', 'customValidator'],
    setup() {
      return {
        formData: mockFormData,
        updateFieldValue: mockUpdateFieldValue
      }
    }
  }
}))

vi.mock('@/components/contracts/DisplayToggleSwitch.vue', () => ({
  default: {
    name: 'DisplayToggleSwitch',
    template: '<button class="toggle-switch" :class="{ active: isActive }" @click="$emit(\'toggle\', !isActive)">{{ title }}</button>',
    props: ['title', 'isActive'],
    emits: ['toggle']
  }
}))

vi.mock('@/components/contracts/CPAContractSection.vue', () => ({
  default: {
    name: 'CPAContractSection',
    template: '<div class="cpa-contract-section">CPA Section</div>',
    props: ['formData', 'cpaEquipments', 'selectedPlanDetails', 'isLoadingPlan'],
    emits: ['update-field', 'equipment-updated', 'plan-selected']
  }
}))

vi.mock('@/components/contracts/SHContractSection.vue', () => ({
  default: {
    name: 'SHContractSection',
    template: '<div class="sh-contract-section">S&H Section</div>',
    props: ['formData', 'shEquipments', 'selectedPlanDetails', 'isLoadingPlan'],
    emits: ['update-field', 'plan-selected', 'equipment-updated']
  }
}))

describe('Display Toggle System', () => {
  let wrapper: any

  beforeEach(() => {
    // Reset form data
    mockFormData.value = {
      clientId: '',
      hasCPAContract: false,
      hasSHContract: false,
      showCPASection: false,
      showSHSection: false
    }

    wrapper = mount(ContractsCreateView)
  })

  it('should allow both CPA and S&H sections to be displayed simultaneously', async () => {
    // Find the toggle switches
    const toggleSwitches = wrapper.findAllComponents({ name: 'DisplayToggleSwitch' })
    expect(toggleSwitches).toHaveLength(2)

    const cpaToggle = toggleSwitches.find((toggle: any) => toggle.props('title') === 'CPA - CASHLOGY')
    const shToggle = toggleSwitches.find((toggle: any) => toggle.props('title') === 'S&H - SOFTWARE E HARDWARE')

    expect(cpaToggle).toBeTruthy()
    expect(shToggle).toBeTruthy()

    // Initially, both toggles should be inactive
    expect(cpaToggle.props('isActive')).toBe(false)
    expect(shToggle.props('isActive')).toBe(false)

    // Activate CPA toggle
    await cpaToggle.vm.$emit('toggle', true)
    await wrapper.vm.$nextTick()

    // CPA section should be visible
    expect(wrapper.findComponent({ name: 'CPAContractSection' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'SHContractSection' }).exists()).toBe(false)

    // Activate S&H toggle (both should be active now)
    await shToggle.vm.$emit('toggle', true)
    await wrapper.vm.$nextTick()

    // Both sections should be visible simultaneously
    expect(wrapper.findComponent({ name: 'CPAContractSection' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'SHContractSection' }).exists()).toBe(true)
  })

  it('should preserve data when switching between display views', async () => {
    const toggleSwitches = wrapper.findAllComponents({ name: 'DisplayToggleSwitch' })
    const cpaToggle = toggleSwitches.find((toggle: any) => toggle.props('title') === 'CPA - CASHLOGY')
    const shToggle = toggleSwitches.find((toggle: any) => toggle.props('title') === 'S&H - SOFTWARE E HARDWARE')

    // Activate CPA
    await cpaToggle.vm.$emit('toggle', true)
    await wrapper.vm.$nextTick()

    // Check that CPA contract is marked as active
    expect(mockFormData.value.hasCPAContract).toBe(true)
    expect(mockFormData.value.showCPASection).toBe(true)

    // Activate S&H
    await shToggle.vm.$emit('toggle', true)
    await wrapper.vm.$nextTick()

    // Check that both contracts are marked as active
    expect(mockFormData.value.hasCPAContract).toBe(true)
    expect(mockFormData.value.hasSHContract).toBe(true)
    expect(mockFormData.value.showCPASection).toBe(true)
    expect(mockFormData.value.showSHSection).toBe(true)

    // Deactivate CPA (S&H should remain active)
    await cpaToggle.vm.$emit('toggle', false)
    await wrapper.vm.$nextTick()

    // CPA should be deactivated but S&H should remain
    expect(mockFormData.value.hasCPAContract).toBe(false)
    expect(mockFormData.value.hasSHContract).toBe(true)
    expect(mockFormData.value.showCPASection).toBe(false)
    expect(mockFormData.value.showSHSection).toBe(true)
  })

  it('should allow independent toggle control for each contract type', async () => {
    const toggleSwitches = wrapper.findAllComponents({ name: 'DisplayToggleSwitch' })
    const cpaToggle = toggleSwitches.find((toggle: any) => toggle.props('title') === 'CPA - CASHLOGY')
    const shToggle = toggleSwitches.find((toggle: any) => toggle.props('title') === 'S&H - SOFTWARE E HARDWARE')

    // Test CPA toggle independently
    await cpaToggle.vm.$emit('toggle', true)
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent({ name: 'CPAContractSection' }).exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'SHContractSection' }).exists()).toBe(false)

    await cpaToggle.vm.$emit('toggle', false)
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent({ name: 'CPAContractSection' }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'SHContractSection' }).exists()).toBe(false)

    // Test S&H toggle independently
    await shToggle.vm.$emit('toggle', true)
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent({ name: 'CPAContractSection' }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'SHContractSection' }).exists()).toBe(true)

    await shToggle.vm.$emit('toggle', false)
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent({ name: 'CPAContractSection' }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'SHContractSection' }).exists()).toBe(false)
  })

  it('should display both sections when both toggles are active', async () => {
    const toggleSwitches = wrapper.findAllComponents({ name: 'DisplayToggleSwitch' })
    const cpaToggle = toggleSwitches.find((toggle: any) => toggle.props('title') === 'CPA - CASHLOGY')
    const shToggle = toggleSwitches.find((toggle: any) => toggle.props('title') === 'S&H - SOFTWARE E HARDWARE')

    // Activate both toggles
    await cpaToggle.vm.$emit('toggle', true)
    await shToggle.vm.$emit('toggle', true)
    await wrapper.vm.$nextTick()

    // Both sections should be visible
    const cpaSection = wrapper.findComponent({ name: 'CPAContractSection' })
    const shSection = wrapper.findComponent({ name: 'SHContractSection' })

    expect(cpaSection.exists()).toBe(true)
    expect(shSection.exists()).toBe(true)

    // Check that both sections are rendered in their respective contract-type-section containers
    const contractTypeSections = wrapper.findAll('.contract-type-section')
    expect(contractTypeSections).toHaveLength(2)
    
    // First section should contain CPA
    expect(contractTypeSections[0].findComponent({ name: 'CPAContractSection' }).exists()).toBe(true)
    
    // Second section should contain S&H
    expect(contractTypeSections[1].findComponent({ name: 'SHContractSection' }).exists()).toBe(true)
  })

  it('should group each contract type with its toggle for clear visual separation', async () => {
    const toggleSwitches = wrapper.findAllComponents({ name: 'DisplayToggleSwitch' })
    const cpaToggle = toggleSwitches.find((toggle: any) => toggle.props('title') === 'CPA - CASHLOGY')
    const shToggle = toggleSwitches.find((toggle: any) => toggle.props('title') === 'S&H - SOFTWARE E HARDWARE')

    // Activate CPA toggle
    await cpaToggle.vm.$emit('toggle', true)
    await wrapper.vm.$nextTick()

    // CPA section should appear directly below its toggle
    const contractTypeSections = wrapper.findAll('.contract-type-section')
    expect(contractTypeSections).toHaveLength(2)
    
    // First contract-type-section should contain CPA toggle and section
    const cpaContainer = contractTypeSections[0]
    expect(cpaContainer.findComponent({ name: 'DisplayToggleSwitch' }).props('title')).toBe('CPA - CASHLOGY')
    expect(cpaContainer.findComponent({ name: 'CPAContractSection' }).exists()).toBe(true)
    
    // Second contract-type-section should contain S&H toggle but no section (not activated)
    const shContainer = contractTypeSections[1]
    expect(shContainer.findComponent({ name: 'DisplayToggleSwitch' }).props('title')).toBe('S&H - SOFTWARE E HARDWARE')
    expect(shContainer.findComponent({ name: 'SHContractSection' }).exists()).toBe(false)

    // Activate S&H toggle
    await shToggle.vm.$emit('toggle', true)
    await wrapper.vm.$nextTick()

    // Now S&H section should appear directly below its toggle
    expect(shContainer.findComponent({ name: 'SHContractSection' }).exists()).toBe(true)
  })
})