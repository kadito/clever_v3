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
  showSHSection: false,
  cpaContractType: '',
  planIdCPA: '',
  distanceCPA: '',
  planIdSH: '',
  distanceSH: ''
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
    template: `
      <div class="cpa-contract-section">
        CPA Section
        <div v-if="selectedPlanDetails" class="plan-details-display">
          <div class="plan-name">{{ selectedPlanDetails.name }}</div>
          <div class="plan-description">{{ selectedPlanDetails.description }}</div>
        </div>
      </div>
    `,
    props: ['formData', 'cpaEquipments', 'selectedPlanDetails', 'isLoadingPlan'],
    emits: ['update-field', 'equipment-updated', 'plan-selected']
  }
}))

vi.mock('@/components/contracts/SHContractSection.vue', () => ({
  default: {
    name: 'SHContractSection',
    template: `
      <div class="sh-contract-section">
        S&H Section
        <div v-if="selectedPlanDetails" class="plan-details-display">
          <div class="plan-name">{{ selectedPlanDetails.name }}</div>
          <div class="plan-description">{{ selectedPlanDetails.description }}</div>
        </div>
      </div>
    `,
    props: ['formData', 'shEquipments', 'selectedPlanDetails', 'isLoadingPlan'],
    emits: ['update-field', 'plan-selected', 'equipment-updated']
  }
}))

describe('Plan Details Display', () => {
  let wrapper: any

  beforeEach(() => {
    // Reset form data
    mockFormData.value = {
      clientId: '',
      hasCPAContract: false,
      hasSHContract: false,
      showCPASection: false,
      showSHSection: false,
      cpaContractType: '',
      planIdCPA: '',
      distanceCPA: '',
      planIdSH: '',
      distanceSH: ''
    }

    wrapper = mount(ContractsCreateView)
  })

  it('should display CPA plan details when CPA contract type and plan are selected', async () => {
    const toggleSwitches = wrapper.findAllComponents({ name: 'DisplayToggleSwitch' })
    const cpaToggle = toggleSwitches.find((toggle: any) => toggle.props('title') === 'CPA - CASHLOGY')

    // Activate CPA toggle
    await cpaToggle.vm.$emit('toggle', true)
    await wrapper.vm.$nextTick()

    // Set CPA contract type and plan
    mockFormData.value.cpaContractType = 'CPA_1500'
    mockFormData.value.planIdCPA = 'cpa_1500_essential'
    await wrapper.vm.$nextTick()

    // Check if CPA section is visible
    const cpaSection = wrapper.findComponent({ name: 'CPAContractSection' })
    expect(cpaSection.exists()).toBe(true)

    // Check if plan details are passed to the component
    expect(cpaSection.props('selectedPlanDetails')).toBeTruthy()
    expect(cpaSection.props('selectedPlanDetails').name).toBe('ESSENTIAL CARE')
  })

  it('should display S&H plan details when S&H plan is selected', async () => {
    const toggleSwitches = wrapper.findAllComponents({ name: 'DisplayToggleSwitch' })
    const shToggle = toggleSwitches.find((toggle: any) => toggle.props('title') === 'S&H - SOFTWARE E HARDWARE')

    // Activate S&H toggle
    await shToggle.vm.$emit('toggle', true)
    await wrapper.vm.$nextTick()

    // Set S&H plan
    mockFormData.value.planIdSH = 'sh_simple'
    await wrapper.vm.$nextTick()

    // Check if S&H section is visible
    const shSection = wrapper.findComponent({ name: 'SHContractSection' })
    expect(shSection.exists()).toBe(true)

    // Check if plan details are passed to the component
    expect(shSection.props('selectedPlanDetails')).toBeTruthy()
    expect(shSection.props('selectedPlanDetails').name).toBe('SIMPLE')
  })

  it('should not display plan details when plan is not selected', async () => {
    const toggleSwitches = wrapper.findAllComponents({ name: 'DisplayToggleSwitch' })
    const cpaToggle = toggleSwitches.find((toggle: any) => toggle.props('title') === 'CPA - CASHLOGY')

    // Activate CPA toggle but don't select plan
    await cpaToggle.vm.$emit('toggle', true)
    await wrapper.vm.$nextTick()

    // Check if CPA section is visible but no plan details
    const cpaSection = wrapper.findComponent({ name: 'CPAContractSection' })
    expect(cpaSection.exists()).toBe(true)
    expect(cpaSection.props('selectedPlanDetails')).toBeNull()
  })

  it('should display both plan details when both contract types are configured', async () => {
    const toggleSwitches = wrapper.findAllComponents({ name: 'DisplayToggleSwitch' })
    const cpaToggle = toggleSwitches.find((toggle: any) => toggle.props('title') === 'CPA - CASHLOGY')
    const shToggle = toggleSwitches.find((toggle: any) => toggle.props('title') === 'S&H - SOFTWARE E HARDWARE')

    // Activate both toggles
    await cpaToggle.vm.$emit('toggle', true)
    await shToggle.vm.$emit('toggle', true)
    await wrapper.vm.$nextTick()

    // Set both contract types and plans
    mockFormData.value.cpaContractType = 'CPA_1500'
    mockFormData.value.planIdCPA = 'cpa_1500_professional'
    mockFormData.value.planIdSH = 'sh_gold'
    await wrapper.vm.$nextTick()

    // Check if both sections have plan details
    const cpaSection = wrapper.findComponent({ name: 'CPAContractSection' })
    const shSection = wrapper.findComponent({ name: 'SHContractSection' })

    expect(cpaSection.exists()).toBe(true)
    expect(shSection.exists()).toBe(true)

    expect(cpaSection.props('selectedPlanDetails')).toBeTruthy()
    expect(cpaSection.props('selectedPlanDetails').name).toBe('PROFESSIONAL CARE')

    expect(shSection.props('selectedPlanDetails')).toBeTruthy()
    expect(shSection.props('selectedPlanDetails').name).toBe('GOLD')
  })
})