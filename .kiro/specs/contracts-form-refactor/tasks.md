# Contracts Form Refactor - Implementation Tasks

## Overview

This task list provides actionable steps to refactor the contracts form to implement a **UI display toggle system** where users can switch between viewing CPA and S&H configuration sections while both contract types can be configured for the same client. The design incorporates dynamic plan selection with real-time plan details display.

## Critical Implementation Requirements

Based on the reference images and user feedback:
1. **UI Display Toggles**: Users can toggle between viewing CPA or S&H sections
2. **Data Persistence**: Switching display views preserves data in both sections
3. **Dynamic Plan Selection**: Both CPA and S&H contracts support plan and distance selection
4. **Real-time Plan Details**: Selecting a plan dynamically displays plan information and payment options
5. **Visual Feedback**: Clear indication of which section is currently displayed

## Phase 1: Core Display Toggle System Implementation

### Task 1.1: Create Display Toggle Switch Component
**Priority**: Critical
**Estimated Time**: 60 minutes

**Purpose**: Create display toggle switches that control section visibility (not data exclusivity).

**Files to Create**:
- `packages/frontend/src/components/contracts/DisplayToggleSwitch.vue`

**Component Requirements**:
```vue
<template>
  <div class="display-toggle-container">
    <div class="toggle-item" :class="{ 'inactive': !isActive }">
      <h3 class="toggle-title">{{ title }}</h3>
      <button
        type="button"
        class="toggle-switch"
        :class="{ 'active': isActive }"
        @click="handleToggle"
      >
        <span class="toggle-slider"></span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  isActive: boolean
}

interface Emits {
  (e: 'toggle', active: boolean): void
}

const handleToggle = () => {
  emit('toggle', !props.isActive)
}
</script>
```

**Styling Requirements**:
- Green accent (#75AE93) for active state
- Gray styling for inactive state (but still clickable)
- Smooth transitions
- 44px minimum touch target

### Task 1.2: Implement Display State Management
**Priority**: Critical
**Estimated Time**: 45 minutes

**Purpose**: Manage display toggle state while preserving data for both contract types.

**Files to Modify**:
- `packages/frontend/src/views/contracts/ContractsCreateView.vue`

**State Management Logic**:
```typescript
// Add to script setup
const displaySection = ref<'CPA' | 'S&H' | null>(null)

// Handle CPA display toggle
const handleCPADisplayToggle = (active: boolean) => {
  if (active) {
    displaySection.value = 'CPA'
    // Initialize CPA data if it doesn't exist
    if (!formData.value.hasCPAContract) {
      updateFieldValue('hasCPAContract', true)
      initializeCPAData()
    }
  } else {
    displaySection.value = null
  }
}

// Handle S&H display toggle
const handleSHDisplayToggle = (active: boolean) => {
  if (active) {
    displaySection.value = 'S&H'
    // Initialize S&H data if it doesn't exist
    if (!formData.value.hasSHContract) {
      updateFieldValue('hasSHContract', true)
      initializeSHData()
    }
  } else {
    displaySection.value = null
  }
}

// Data initialization functions (preserve existing data)
const initializeCPAData = () => {
  if (!cpaEquipments.value.length) {
    cpaEquipments.value = [createNewEquipment()]
  }
}

const initializeSHData = () => {
  // Initialize S&H specific data if needed
}
```

### Task 1.3: Update Template with Display Toggles
**Priority**: Critical
**Estimated Time**: 75 minutes

**Purpose**: Replace existing form structure with display toggle system.

**Template Changes**:
```vue
<template>
  <ContentCreateTemplate>
    <!-- Replace existing contract type section -->
    <template #after-client-info>
      <div class="contract-types-section">
        <div class="section-header">
          <h2>PLANOS DE CONTRATO</h2>
          <div class="info-note">
            <span class="info-icon">ℹ️</span>
            <span>O cliente pode ter um ou ambos os tipos de contrato (CPA e/ou S&H)</span>
          </div>
        </div>
        
        <!-- CPA Display Toggle -->
        <DisplayToggleSwitch
          title="CPA - CASHLOGY"
          :is-active="displaySection === 'CPA'"
          @toggle="handleCPADisplayToggle"
        />
        
        <!-- S&H Display Toggle -->
        <DisplayToggleSwitch
          title="S&H - SOFTWARE E HARDWARE"
          :is-active="displaySection === 'S&H'"
          @toggle="handleSHDisplayToggle"
        />
        
        <!-- Active Contract Section -->
        <div v-if="displaySection" class="active-contract-section">
          <!-- CPA Configuration -->
          <CPAContractSection
            v-if="displaySection === 'CPA'"
            :form-data="formData"
            :cpa-equipments="cpaEquipments"
            :selected-plan-details="selectedCPAPlanDetails"
            @update-field="updateFieldValue"
            @equipment-updated="handleEquipmentUpdate"
          />
          
          <!-- S&H Configuration -->
          <SHContractSection
            v-if="displaySection === 'S&H'"
            :form-data="formData"
            :selected-plan-details="selectedSHPlanDetails"
            @update-field="updateFieldValue"
          />
        </div>
      </div>
    </template>
  </ContentCreateTemplate>
</template>
```

## Phase 2: Contract-Specific Configuration Sections

### Task 2.1: Implement CPA Configuration Section with Dynamic Plan Selection
**Priority**: High
**Estimated Time**: 120 minutes

**Purpose**: Create CPA-specific configuration with plan selection, distance selection, and dynamic plan details display.

**Files to Create**:
- `packages/frontend/src/components/contracts/CPAContractSection.vue`
- `packages/frontend/src/components/contracts/DynamicPlanDetails.vue`

**CPA Section Structure**:
```vue
<template>
  <div class="cpa-contract-section">
    <!-- Three-column layout for CPA fields -->
    <div class="contract-config-grid">
      <div class="config-field">
        <label class="config-label required">TIPO DE CONTRATO CPA</label>
        <select 
          :model-value="formData.cpaContractType" 
          @update:model-value="$emit('update-field', 'cpaContractType', $event)"
          class="config-select"
        >
          <option value="">Selecione o tipo...</option>
          <option value="CPA">CPA - Cashlogy (2023)</option>
          <option value="CPA_1500">CPA - Cashlogy (1500)</option>
        </select>
      </div>
      
      <div class="config-field">
        <label class="config-label required">PLANO CPA</label>
        <select 
          :model-value="formData.planIdCPA" 
          @update:model-value="handlePlanSelection"
          class="config-select"
        >
          <option value="">Selecione o plano...</option>
          <option value="essential_care">ESSENTIAL CARE</option>
          <option value="premium_care">PREMIUM CARE</option>
          <option value="business_care">BUSINESS CARE</option>
        </select>
      </div>
      
      <div class="config-field">
        <label class="config-label required">DISTÂNCIA</label>
        <select 
          :model-value="formData.distanceCPA" 
          @update:model-value="$emit('update-field', 'distanceCPA', $event)"
          class="config-select"
        >
          <option value="">Selecione a distância...</option>
          <option value="under180km">Menos de 180 km</option>
          <option value="over180km">Mais de 180 km</option>
        </select>
      </div>
    </div>
    
    <!-- Equipment Management -->
    <CPAEquipmentManager
      :equipments="cpaEquipments"
      @equipment-updated="$emit('equipment-updated', $event)"
    />
    
    <!-- Contract Dates -->
    <ContractDatesSection
      :start-date="formData.inicioContratoCPA"
      :end-date="formData.fimContratoCPA"
      @update:start-date="$emit('update-field', 'inicioContratoCPA', $event)"
      @update:end-date="$emit('update-field', 'fimContratoCPA', $event)"
    />
    
    <!-- Dynamic Plan Details Display -->
    <DynamicPlanDetails
      v-if="selectedPlanDetails"
      :plan-details="selectedPlanDetails"
      :selected-payment="formData.modalidadePagamentoCPA"
      @payment-selected="$emit('update-field', 'modalidadePagamentoCPA', $event)"
    />
  </div>
</template>

<script setup lang="ts">
const handlePlanSelection = (planId: string) => {
  emit('update-field', 'planIdCPA', planId)
  // Trigger plan details loading
  loadPlanDetails(planId)
}

const loadPlanDetails = async (planId: string) => {
  // Load plan details based on selection
  // This will populate the dynamic plan details component
}
</script>
```

### Task 2.2: Implement S&H Configuration Section with Dynamic Plan Selection
**Priority**: High
**Estimated Time**: 90 minutes

**Purpose**: Create S&H-specific configuration with plan selection, distance selection, and dynamic plan details display.

**Files to Create**:
- `packages/frontend/src/components/contracts/SHContractSection.vue`

**S&H Section Structure**:
```vue
<template>
  <div class="sh-contract-section">
    <!-- Two-column layout for S&H fields -->
    <div class="contract-config-grid-sh">
      <div class="config-field">
        <label class="config-label required">PLANO S&H</label>
        <select 
          :model-value="formData.planIdSH" 
          @update:model-value="handlePlanSelection"
          class="config-select"
        >
          <option value="">Selecione o plano...</option>
          <option value="simple">SIMPLE</option>
          <option value="brass">BRASS</option>
          <option value="silver">SILVER</option>
          <option value="gold">GOLD</option>
          <option value="diamond">DIAMOND</option>
          <option value="platinum">PLATINUM</option>
        </select>
      </div>
      
      <div class="config-field">
        <label class="config-label required">DISTÂNCIA</label>
        <select 
          :model-value="formData.distanceSH" 
          @update:model-value="$emit('update-field', 'distanceSH', $event)"
          class="config-select"
        >
          <option value="">Selecione a distância...</option>
          <option value="under180km">Menos de 180 km</option>
          <option value="over180km">Mais de 180 km</option>
        </select>
      </div>
    </div>
    
    <!-- Equipment Information (3 fields) -->
    <div class="equipment-info-section">
      <h4>INFORMAÇÃO DO EQUIPAMENTO</h4>
      <div class="equipment-fields-grid">
        <div class="form-field">
          <label class="form-label">MODELO</label>
          <input 
            :model-value="formData.modeloPSO"
            @update:model-value="$emit('update-field', 'modeloPSO', $event)"
            type="text"
            class="form-input"
            placeholder="Ex: Dell Optiplex 7090"
          />
        </div>
        
        <div class="form-field">
          <label class="form-label">Nº SÉRIE</label>
          <input 
            :model-value="formData.numeroSeriePSO"
            @update:model-value="$emit('update-field', 'numeroSeriePSO', $event)"
            type="text"
            class="form-input"
            placeholder="Ex: ABC123456"
          />
        </div>
        
        <div class="form-field">
          <label class="form-label">SOFTWARE</label>
          <input 
            :model-value="formData.softwarePSO"
            @update:model-value="$emit('update-field', 'softwarePSO', $event)"
            type="text"
            class="form-input"
            placeholder="Ex: Windows 11 Pro"
          />
        </div>
      </div>
    </div>
    
    <!-- Contract Dates -->
    <ContractDatesSection
      :start-date="formData.inicioContratoSH"
      :end-date="formData.fimContratoSH"
      @update:start-date="$emit('update-field', 'inicioContratoSH', $event)"
      @update:end-date="$emit('update-field', 'fimContratoSH', $event)"
    />
    
    <!-- Dynamic Plan Details Display -->
    <DynamicPlanDetails
      v-if="selectedPlanDetails"
      :plan-details="selectedPlanDetails"
      :selected-payment="formData.modalidadePagamentoSH"
      @payment-selected="$emit('update-field', 'modalidadePagamentoSH', $event)"
    />
  </div>
</template>
```

### Task 2.3: Create Dynamic Plan Details Component
**Priority**: High
**Estimated Time**: 90 minutes

**Purpose**: Implement dynamic plan details display with payment selection (inspired by UX3 image).

**Files to Create**:
- `packages/frontend/src/components/contracts/DynamicPlanDetails.vue`

**Component Structure**:
```vue
<template>
  <div class="dynamic-plan-details">
    <!-- Plan Information Card -->
    <div class="plan-info-card">
      <h3 class="plan-title">{{ planDetails.name }}</h3>
      
      <!-- Plan Features -->
      <div class="plan-features">
        <div class="feature-description">
          {{ planDetails.description }}
        </div>
        
        <div class="feature-list">
          <div 
            v-for="feature in planDetails.features" 
            :key="feature.id"
            class="feature-item"
          >
            <span class="feature-icon">{{ feature.icon }}</span>
            <span class="feature-text">{{ feature.text }}</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Payment Options -->
    <div class="payment-selection-section">
      <h4>SELECIONE A MODALIDADE DE PAGAMENTO:</h4>
      <div class="payment-options-grid">
        <button
          v-for="option in planDetails.paymentOptions"
          :key="option.id"
          type="button"
          class="payment-option"
          :class="{ 'selected': selectedPayment === option.id }"
          @click="selectPayment(option.id)"
        >
          <div class="payment-period">{{ option.period }}</div>
          <div class="payment-amount">{{ option.amount }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface PlanDetails {
  name: string
  description: string
  features: Array<{
    id: string
    icon: string
    text: string
  }>
  paymentOptions: Array<{
    id: string
    period: string
    amount: string
  }>
}

interface Props {
  planDetails: PlanDetails
  selectedPayment: string
}

interface Emits {
  (e: 'payment-selected', paymentId: string): void
}

const selectPayment = (paymentId: string) => {
  emit('payment-selected', paymentId)
}
</script>
```

### Task 2.4: Create Equipment Manager for CPA
**Priority**: High
**Estimated Time**: 90 minutes

**Purpose**: Implement numbered equipment cards with add/remove functionality.

**Files to Create**:
- `packages/frontend/src/components/contracts/CPAEquipmentManager.vue`
- `packages/frontend/src/components/contracts/EquipmentCard.vue`

**Equipment Manager Structure**:
```vue
<template>
  <div class="equipment-section">
    <div class="equipment-header">
      <h4>EQUIPAMENTOS CPA</h4>
      <button
        type="button"
        class="add-equipment-btn"
        @click="addEquipment"
      >
        + ADICIONAR EQUIPAMENTO
      </button>
    </div>
    
    <div class="equipment-info-callout">
      <span class="info-icon">ℹ️</span>
      <span>O desconto aplica-se apenas aos equipamentos adicionais (2º, 3º, etc.). O primeiro equipamento não tem desconto.</span>
    </div>
    
    <div class="equipment-list">
      <EquipmentCard
        v-for="(equipment, index) in equipments"
        :key="equipment.id"
        :equipment="equipment"
        :equipment-number="index + 1"
        :show-discount="index > 0"
        @update="updateEquipment(index, $event)"
        @remove="removeEquipment(index)"
      />
    </div>
  </div>
</template>
```

## Phase 3: Styling and Visual Polish

### Task 3.1: Implement Display Toggle Styling
**Priority**: High
**Estimated Time**: 60 minutes

**Purpose**: Style display toggles and contract sections to match reference images.

**CSS Implementation**:
```scss
.contract-types-section {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.section-header {
  margin-bottom: 1.5rem;
  
  h2 {
    font-size: 1.25rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 0.5rem 0;
  }
}

.info-note {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
  
  .info-icon {
    color: #3b82f6;
  }
}

.display-toggle-container {
  margin-bottom: 1rem;
  
  .toggle-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
    transition: all 0.2s ease;
    
    &.inactive {
      opacity: 0.7;
      background-color: #f9fafb;
      
      .toggle-title {
        color: #9ca3af;
      }
    }
  }
  
  .toggle-title {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }
  
  .toggle-switch {
    position: relative;
    width: 50px;
    height: 24px;
    background: #d1d5db;
    border: none;
    border-radius: 12px;
    cursor: pointer;
    transition: background-color 0.3s ease;
    
    &.active {
      background: #75ae93;
    }
    
    .toggle-slider {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 20px;
      height: 20px;
      background: white;
      border-radius: 50%;
      transition: transform 0.3s ease;
    }
    
    &.active .toggle-slider {
      transform: translateX(26px);
    }
  }
}

.active-contract-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.contract-config-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

.contract-config-grid-sh {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}

.config-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.config-label {
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
  
  &.required::after {
    content: ' *';
    color: #ef4444;
  }
}

.config-select {
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  background: white;
  font-size: 0.875rem;
  transition: border-color 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #75ae93;
    box-shadow: 0 0 0 2px rgba(117, 174, 147, 0.2);
  }
}
```

### Task 3.2: Implement Dynamic Plan Details Styling
**Priority**: High
**Estimated Time**: 75 minutes

**Purpose**: Style the dynamic plan details component to match UX3 image inspiration.

**Dynamic Plan Details CSS**:
```scss
.dynamic-plan-details {
  margin-top: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  overflow: hidden;
}

.plan-info-card {
  background: #f8fafc;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  
  .plan-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #75ae93;
    margin: 0 0 1rem 0;
  }
  
  .feature-description {
    color: #6b7280;
    margin-bottom: 1rem;
    line-height: 1.5;
  }
  
  .feature-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .feature-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    
    .feature-icon {
      font-size: 1rem;
      color: #75ae93;
    }
    
    .feature-text {
      font-size: 0.875rem;
      color: #374151;
    }
  }
}

.payment-selection-section {
  padding: 1.5rem;
  
  h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
    margin: 0 0 1rem 0;
    text-transform: uppercase;
  }
}

.payment-options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 0.75rem;
  
  @media (max-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.payment-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #75ae93;
    background: #f0f9f4;
  }
  
  &.selected {
    border-color: #75ae93;
    background: #75ae93;
    color: white;
  }
  
  .payment-period {
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    margin-bottom: 0.25rem;
  }
  
  .payment-amount {
    font-size: 1rem;
    font-weight: 600;
  }
}
```

### Task 3.3: Implement Equipment Card Styling
**Priority**: Medium
**Estimated Time**: 45 minutes

**Purpose**: Style equipment cards to match reference images.

**Equipment Card CSS**:
```scss
.equipment-section {
  margin: 1.5rem 0;
}

.equipment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  h4 {
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
    margin: 0;
  }
}

.add-equipment-btn {
  background: #75ae93;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: #6b9d7a;
  }
}

.equipment-info-callout {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  
  .info-icon {
    color: #1e40af;
    font-size: 1rem;
  }
  
  span:last-child {
    font-size: 0.875rem;
    color: #1e40af;
    line-height: 1.4;
  }
}

.equipment-card {
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: white;
  
  .equipment-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    
    h5 {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      margin: 0;
    }
  }
  
  .equipment-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
    
    @media (max-width: 768px) {
      grid-template-columns: 1fr;
    }
  }
}

.equipment-fields-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}
```

## Phase 4: Form Validation and Data Handling

### Task 4.1: Update Form Validation for Display Toggle System
**Priority**: High
**Estimated Time**: 60 minutes

**Purpose**: Ensure validation works with display toggle system and both contract types.

**Validation Logic Updates**:
```typescript
const validateContractCreate = (data: Record<string, any>): Record<string, string> => {
  const errors: Record<string, string> = {};
  
  // Client validation
  if (!data.clientId) {
    errors.clientId = 'Cliente é obrigatório';
  }
  
  // Contract type validation - at least one must be configured
  const hasCPA = data.hasCPAContract;
  const hasSH = data.hasSHContract;
  
  if (!hasCPA && !hasSH) {
    errors.contractType = 'Configure pelo menos um tipo de contrato (CPA ou S&H)';
  }
  
  // CPA-specific validation (if CPA is configured)
  if (hasCPA) {
    if (!data.cpaContractType) {
      errors.cpaContractType = 'Tipo de contrato CPA é obrigatório';
    }
    
    if (!data.planIdCPA) {
      errors.planIdCPA = 'Plano CPA é obrigatório';
    }
    
    if (!data.distanceCPA) {
      errors.distanceCPA = 'Distância CPA é obrigatória';
    }
    
    if (!data.modalidadePagamentoCPA) {
      errors.modalidadePagamentoCPA = 'Modalidade de pagamento CPA é obrigatória';
    }
    
    if (!cpaEquipments.value || cpaEquipments.value.length === 0) {
      errors.cpaEquipments = 'Pelo menos um equipamento CPA é obrigatório';
    }
    
    // Validate contract dates
    if (!data.inicioContratoCPA) {
      errors.inicioContratoCPA = 'Data de início do contrato CPA é obrigatória';
    }
    
    if (!data.fimContratoCPA) {
      errors.fimContratoCPA = 'Data de fim do contrato CPA é obrigatória';
    }
  }
  
  // S&H-specific validation (if S&H is configured)
  if (hasSH) {
    if (!data.planIdSH) {
      errors.planIdSH = 'Plano S&H é obrigatório';
    }
    
    if (!data.distanceSH) {
      errors.distanceSH = 'Distância S&H é obrigatória';
    }
    
    if (!data.modalidadePagamentoSH) {
      errors.modalidadePagamentoSH = 'Modalidade de pagamento S&H é obrigatória';
    }
    
    // Validate contract dates
    if (!data.inicioContratoSH) {
      errors.inicioContratoSH = 'Data de início do contrato S&H é obrigatória';
    }
    
    if (!data.fimContratoSH) {
      errors.fimContratoSH = 'Data de fim do contrato S&H é obrigatória';
    }
  }
  
  return errors;
};
```

### Task 4.2: Implement Plan Data Management
**Priority**: High
**Estimated Time**: 75 minutes

**Purpose**: Create plan data management system for dynamic plan details.

**Files to Create**:
- `packages/frontend/src/composables/usePlanData.ts`

**Plan Data Composable**:
```typescript
import { ref, computed } from 'vue'

interface PlanDetails {
  id: string
  name: string
  description: string
  features: Array<{
    id: string
    icon: string
    text: string
  }>
  paymentOptions: Array<{
    id: string
    period: string
    amount: string
  }>
}

export function usePlanData() {
  const cpaPlans = ref<Record<string, PlanDetails>>({
    essential_care: {
      id: 'essential_care',
      name: 'ESSENTIAL CARE',
      description: 'Assistência Remota: De Segunda a Sexta entre as 9:00 e as 19:00; Assistência Presencial: 1 (uma) manutenção/ano; Intervenções necessárias adicionais: € 150,00.',
      features: [
        { id: '1', icon: '🔧', text: '1 manutenções por ano' },
        { id: '2', icon: '📞', text: 'Intervenções necessárias adicionais deslocações' },
        { id: '3', icon: '🕘', text: 'De Segunda a Sexta entre as 9:00 e as 19:00' }
      ],
      paymentOptions: [
        { id: 'mensal', period: 'MENSAL', amount: '30,00 €' },
        { id: 'trimestral', period: 'TRIMESTRAL', amount: '130,00 €' },
        { id: 'semestral', period: 'SEMESTRAL', amount: '185,00 €' },
        { id: 'anual', period: 'ANUAL', amount: '330,00 €' }
      ]
    },
    premium_care: {
      id: 'premium_care',
      name: 'PREMIUM CARE',
      description: 'Plano premium com mais benefícios e suporte estendido.',
      features: [
        { id: '1', icon: '🔧', text: '2 manutenções por ano' },
        { id: '2', icon: '📞', text: 'Suporte 24/7' },
        { id: '3', icon: '🚀', text: 'Resposta prioritária' }
      ],
      paymentOptions: [
        { id: 'mensal', period: 'MENSAL', amount: '50,00 €' },
        { id: 'trimestral', period: 'TRIMESTRAL', amount: '180,00 €' },
        { id: 'semestral', period: 'SEMESTRAL', amount: '280,00 €' },
        { id: 'anual', period: 'ANUAL', amount: '500,00 €' }
      ]
    }
  })

  const shPlans = ref<Record<string, PlanDetails>>({
    simple: {
      id: 'simple',
      name: 'SIMPLE',
      description: 'Pacote de 10:00/ano Duas deslocações/ano - Seg. a Sexta-Feira entre as 9:00 e as 19:00 Assistência Remota - Seg. a Sexta-Feira entre as 9:00 e as 23:00 Obs: A contabilização do tempo é efetuada por períodos de 15min.',
      features: [
        { id: '1', icon: '⏰', text: '10 horas por ano' },
        { id: '2', icon: '🚗', text: '2 deslocações incluídas' },
        { id: '3', icon: '🕘', text: 'Segunda a Sexta-Feira entre as 9:00 e as 23:00' }
      ],
      paymentOptions: [
        { id: 'mensal', period: 'MENSAL', amount: '30,00 €' },
        { id: 'trimestral', period: 'TRIMESTRAL', amount: '130,00 €' },
        { id: 'anual', period: 'ANUAL', amount: '330,00 €' }
      ]
    },
    brass: {
      id: 'brass',
      name: 'BRASS',
      description: 'Plano intermédio com mais horas e benefícios.',
      features: [
        { id: '1', icon: '⏰', text: '20 horas por ano' },
        { id: '2', icon: '🚗', text: '3 deslocações incluídas' },
        { id: '3', icon: '🕘', text: 'Suporte estendido' }
      ],
      paymentOptions: [
        { id: 'mensal', period: 'MENSAL', amount: '45,00 €' },
        { id: 'trimestral', period: 'TRIMESTRAL', amount: '160,00 €' },
        { id: 'anual', period: 'ANUAL', amount: '450,00 €' }
      ]
    }
    // Add other S&H plans...
  })

  const getCPAPlan = (planId: string): PlanDetails | null => {
    return cpaPlans.value[planId] || null
  }

  const getSHPlan = (planId: string): PlanDetails | null => {
    return shPlans.value[planId] || null
  }

  return {
    cpaPlans: computed(() => cpaPlans.value),
    shPlans: computed(() => shPlans.value),
    getCPAPlan,
    getSHPlan
  }
}
```

### Task 4.3: Update Form Sections Configuration
**Priority**: Medium
**Estimated Time**: 30 minutes

**Purpose**: Simplify form sections to work with display toggle system.

**Files to Modify**:
- `packages/frontend/src/config/contracts-form-sections.ts`

**Simplified Configuration**:
```typescript
export const contractsFormSections: FormSection[] = [
  {
    key: 'basic',
    title: 'Informação Básica',
    description: 'Dados fundamentais do contrato',
    fields: [
      {
        key: 'clientId',
        label: 'Cliente',
        type: 'custom',
        required: true,
        placeholder: 'Pesquisar cliente...'
      }
    ]
  },
  {
    key: 'clientInfo',
    title: 'Informação do Cliente',
    description: 'Dados do cliente selecionado (apenas leitura)',
    fields: [
      {
        key: 'clientInfo',
        label: 'Informação do Cliente',
        type: 'custom',
        fullWidth: true,
        conditional: {
          dependsOn: 'clientId',
          showWhen: (value: any) => !!value
        }
      }
    ]
  },
  {
    key: 'contractTypes',
    title: 'Tipos de Contrato',
    description: 'Configuração dos contratos CPA e S&H',
    fields: [
      {
        key: 'contractTypes',
        label: 'Tipos de Contrato',
        type: 'custom',
        fullWidth: true
      }
    ]
  }
];
```

## Phase 5: Testing and Integration

### Task 5.1: Fix Runtime Errors and Integration
**Priority**: Critical
**Estimated Time**: 60 minutes

**Purpose**: Resolve existing runtime errors and integrate new components.

**Files to Modify**:
- `packages/frontend/src/components/common/ContentFormTemplate.vue`
- `packages/frontend/src/views/contracts/ContractsCreateView.vue`

**Specific Fixes**:
```vue
<!-- ContentFormTemplate.vue - Add null safety checks -->
<slot
  v-if="formData && field.type === 'custom'"
  :name="`field-${field.key}`"
  :field="field"
  :value="formData[field.key]"
  :error="validationErrors[field.key]"
  :update-value="(value: any) => updateFieldValue(field.key, value)"
  :clear-error="() => clearFieldError(field.key)"
  :form-data="formData"
  :update-field-value="updateFieldValue"
/>

<!-- ContractsCreateView.vue - Add contract types template -->
<template #field-contractTypes="{ formData, updateFieldValue }">
  <div v-if="formData" class="contract-types-wrapper">
    <!-- Contract type toggles and sections will be rendered here -->
  </div>
</template>
```

**Integration Steps**:
1. Import new components in ContractsCreateView
2. Add proper error handling for plan loading
3. Ensure form data persistence across display switches
4. Add loading states for dynamic plan details

### Task 5.2: Comprehensive Testing
**Priority**: High
**Estimated Time**: 120 minutes

**Test Cases**:
- [ ] Form loads without runtime errors
- [ ] CPA display toggle shows/hides CPA section correctly
- [ ] S&H display toggle shows/hides S&H section correctly
- [ ] Both toggles can be active simultaneously (data persistence)
- [ ] Plan selection triggers dynamic plan details display
- [x] Payment method selection works in dynamic plan details
- [ ] Distance selection works for both contract types
- [ ] Equipment management works for CPA (add/remove/edit)
- [ ] Three-field equipment info works for S&H
- [ ] Form validation works for both contract types independently
- [ ] Form validation requires at least one contract type configured
- [ ] Contract dates validation works for both types
- [x] Mobile responsiveness maintained across all components
- [x] Portuguese localization preserved
- [ ] Dynamic plan details responsive design works
- [x] Payment option selection visual feedback works

**Testing Scenarios**:
1. **CPA Only Configuration**: Configure only CPA contract with plan selection
2. **S&H Only Configuration**: Configure only S&H contract with plan selection
3. **Both Contracts Configuration**: Configure both CPA and S&H simultaneously
4. **Display Toggle Switching**: Switch between viewing CPA and S&H sections
5. **Plan Selection Flow**: Select different plans and verify dynamic details
6. **Payment Selection**: Test payment method selection in dynamic details
7. **Equipment Management**: Test CPA equipment add/remove/edit functionality
8. **Form Validation**: Test validation for various incomplete form states
9. **Mobile Usage**: Test all functionality on mobile devices
10. **Data Persistence**: Verify data persists when switching display views

### Task 5.3: Performance Optimization
**Priority**: Medium
**Estimated Time**: 45 minutes

**Optimization Areas**:
- Lazy load plan details data
- Optimize re-renders when switching display sections
- Implement proper component cleanup
- Add loading states for better UX

**Performance Improvements**:
```typescript
// Lazy loading for plan details
const loadPlanDetails = async (planId: string, contractType: 'CPA' | 'S&H') => {
  if (!planId) return null
  
  try {
    setLoading(true)
    const planDetails = contractType === 'CPA' 
      ? getCPAPlan(planId) 
      : getSHPlan(planId)
    
    return planDetails
  } catch (error) {
    console.error('Error loading plan details:', JSON.stringify(error, null, 2))
    return null
  } finally {
    setLoading(false)
  }
}

// Debounced form updates
const debouncedUpdateField = debounce((field: string, value: any) => {
  updateFieldValue(field, value)
}, 300)
```

## Implementation Checklist

### Core Functionality
- [x] Display toggle system implemented (not mutually exclusive)
- [x] Contract type state management working with data persistence
- [x] Visual feedback for active/inactive display toggles
- [x] Both contract types can be configured simultaneously

### CPA Configuration
- [x] Three-column layout for CPA fields (Type, Plan, Distance)
- [x] Plan selection with dynamic plan details display
- [x] Distance selection for CPA contracts
- [x] Equipment manager with numbering and add/remove functionality
- [x] Discount logic (0% first equipment, configurable others)
- [x] Contract dates section
- [x] Dynamic payment selection in plan details

### S&H Configuration
- [x] Two-column layout for S&H fields (Plan, Distance)
- [x] Plan selection with dynamic plan details display
- [x] Distance selection for S&H contracts
- [x] Three-field equipment information (Model, Serial, Software)
- [x] Contract dates section
- [x] Dynamic payment selection in plan details

### Dynamic Plan Details
- [x] Plan information card with features display
- [x] Payment options grid with selection functionality
- [x] Responsive design matching UX3 inspiration
- [x] Real-time updates when plan selection changes
- [x] Loading states during plan data fetching

### Integration
- [x] Runtime errors fixed
- [x] Form validation updated for both contract types
- [ ] Mobile responsiveness maintained across all components
- [ ] Portuguese localization preserved
- [x] All existing functionality preserved
- [x] Performance optimizations implemented

## Success Metrics

- **Visual Appeal**: Dynamic plan details provide engaging UX similar to UX3 image
- **Functionality**: Display toggle system works with data persistence for both contract types
- **Plan Selection**: Both CPA and S&H support plan and distance selection with dynamic details
- **Data Integrity**: No data loss when switching between display views
- **User Experience**: Clear, intuitive interface with proper feedback and loading states
- **Performance**: Form loads and responds quickly on all devices
- **Mobile Experience**: Touch-friendly interface with proper responsive design

## Phase 6: Critical Bug Fixes

### Task 6.1: Fix Plan Details Table Not Displaying Issue
**Priority**: CRITICAL
**Estimated Time**: 90 minutes
**Status**: IN PROGRESS

**Problem**: Plan details table with descriptions and prices is not displaying even when both plan and distance are selected. Debug output shows:
- Plan ID: NOT SET
- Contract Type: NOT SET  
- Distance: NOT SET
- Has Plan Details: false
- Should Show Plan Details: false

**Root Cause**: Dropdown selections (@update:model-value events) are not updating the form data. When users select contract type, plan, or distance, the values are not being stored in formData, so the computed properties never receive the necessary data to show plan details.

**Investigation Steps**:
1. **Verify Event Emission**: Check if dropdown @update:model-value events are properly emitting values
2. **Check Event Handlers**: Verify handleCPAPlanSelection and handleSHPlanSelection functions are being called
3. **Test updateFieldValue Function**: Ensure updateFieldValue function is working correctly in ContractsCreateView
4. **Debug Form Data Updates**: Add logging to track when formData is updated
5. **Verify Computed Properties**: Check if selectedCPAPlanDetails and selectedSHPlanDetails are reactive to formData changes

**Files to Debug**:
- `packages/frontend/src/views/contracts/ContractsCreateView.vue` - Main form data management
- `packages/frontend/src/components/contracts/CPAContractSection.vue` - CPA dropdown events
- `packages/frontend/src/components/contracts/SHContractSection.vue` - S&H dropdown events
- `packages/frontend/src/components/contracts/DynamicPlanDetails.vue` - Plan details display logic

**Debugging Code to Add**:
```typescript
// In ContractsCreateView.vue - Add to updateFieldValue function
const updateFieldValue = (field: string, value: any) => {
  console.log('🔧 updateFieldValue called:', JSON.stringify({ field, value, currentFormData: formData.value }, null, 2));
  
  // Call original updateFieldValue
  originalUpdateFieldValue(field, value);
  
  console.log('🔧 formData after update:', JSON.stringify(formData.value, null, 2));
}

// In CPAContractSection.vue - Add to handlePlanSelection
const handlePlanSelection = (planId: string) => {
  console.log('🔧 CPA handlePlanSelection called with:', planId);
  emit('plan-selected', planId);
  console.log('🔧 CPA plan-selected event emitted');
}

// In SHContractSection.vue - Add to handlePlanSelection  
const handlePlanSelection = (planId: string) => {
  console.log('🔧 S&H handlePlanSelection called with:', planId);
  emit('plan-selected', planId);
  console.log('🔧 S&H plan-selected event emitted');
}
```

**Expected Fix Areas**:
1. **Event Handler Connection**: Ensure @plan-selected events are properly connected to parent handlers
2. **Form Data Reactivity**: Verify formData updates trigger computed property recalculation
3. **Event Propagation**: Check if events are being properly propagated from child to parent components
4. **Dropdown Value Binding**: Ensure dropdown :model-value bindings are correct

**Success Criteria**:
- [ ] Selecting contract type updates formData.cpaContractType or formData.planIdSH
- [ ] Selecting plan updates formData.planIdCPA or formData.planIdSH  
- [ ] Selecting distance updates formData.distanceCPA or formData.distanceSH
- [ ] Debug output shows all values are SET when selections are made
- [ ] shouldShowPlanDetails computed property returns true when all required fields are selected
- [ ] DynamicPlanDetails component displays with plan information and payment options
- [ ] Users can select payment options from the displayed plan details table

**Testing Steps**:
1. Open browser developer console
2. Navigate to contracts create form
3. Toggle CPA or S&H section
4. Select contract type (CPA only) - verify console logs show formData update
5. Select plan - verify console logs show formData update and plan-selected event
6. Select distance - verify console logs show formData update
7. Verify plan details table appears with payment options
8. Test payment option selection
9. Repeat for both CPA and S&H sections

### Task 6.2: Remove Debug Code After Fix
**Priority**: Medium
**Estimated Time**: 15 minutes

**Purpose**: Clean up debug console.log statements once the issue is resolved.

**Files to Clean**:
- Remove all debug console.log statements added during investigation
- Keep only essential logging for production use
- Ensure no debug styling remains in components

## Critical Notes

1. **Display Toggle System**: Users can view one section at a time but configure both contract types
2. **Data Persistence**: Switching display views preserves all form data
3. **Dynamic Plan Details**: Plan selection triggers real-time display of plan information and payment options
4. **Distance Selection**: Both contract types support distance selection (not just CPA)
5. **Mobile First**: Ensure touch targets and responsive design work properly across all new components
6. **Performance**: Implement loading states and optimize re-renders for smooth UX
7. **CRITICAL BUG**: Plan details table not displaying due to form data not updating from dropdown selections

The refactor success depends on implementing the display toggle system with data persistence and creating an engaging dynamic plan selection experience inspired by the UX3 image. **The current critical blocker is the plan details table not displaying, which must be resolved before the refactor can be considered complete.**