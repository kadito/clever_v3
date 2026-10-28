# Contracts Form Refactor - Design Document

## Overview

This design document outlines the architecture for refactoring the contracts
form to implement a **UI display toggle system**, where users can switch between
viewing CPA and S&H configuration sections while both contract types can be
configured for the same client. The design focuses on clean state management,
conditional rendering, and contract-specific user interfaces.

## Architecture Overview

### Core Design Principle: UI Display Toggle System

The fundamental design principle is that users can toggle between viewing CPA
and S&H contract sections, but both contract types can be configured
simultaneously. This provides a clean, focused interface while maintaining full
functionality.

```
Contract State Management:
┌─────────────────────────────────────┐
│ Contract Form State                 │
├─────────────────────────────────────┤
│ displaySection: 'CPA' | 'S&H'       │
│ cpaData: CPAContractData | null     │
│ shData: SHContractData | null       │
│ paymentMethod: string               │
└─────────────────────────────────────┘
```

### Component Architecture

```
ContractsCreateView
├── ClientSelection (existing)
├── ContractTypeSelector
│   ├── CPADisplayToggle
│   └── SHDisplayToggle (display toggles, not exclusive)
├── DisplayedContractSection (conditional)
│   ├── CPAContractSection (if CPA display active)
│   │   ├── CPATypeSelector
│   │   ├── CPAEquipmentManager
│   │   │   ├── EquipmentCard (multiple)
│   │   │   └── AddEquipmentButton
│   │   └── CPAContractDates
│   └── SHContractSection (if S&H display active)
│       ├── SHPlanSelector
│       ├── SHEquipmentInfo (single)
│       └── SHContractDates
└── PaymentMethodSection (unified)
```

## Component Specifications

### 1. ContractTypeSelector Component

**Purpose**: Manage display toggle between CPA and S&H contract sections.

```vue
<template>
  <div class="contract-type-selector">
    <div class="section-header">
      <h2>PLANOS DE CONTRATO</h2>
      <div class="info-note">
        <span class="info-icon">ℹ️</span>
        <span
          >O cliente pode ter um ou ambos os tipos de contrato (CPA e/ou
          S&H)</span
        >
      </div>
    </div>

    <div class="contract-toggles">
      <div class="contract-toggle-item">
        <h3>CPA - CASHLOGY</h3>
        <ToggleSwitch
          :model-value="displaySection === 'CPA'"
          @update:model-value="handleCPADisplayToggle"
        />
      </div>

      <div
        class="contract-toggle-item"
        :class="{ inactive: displaySection !== 'S&H' }"
      >
        <h3>S&H - SOFTWARE E HARDWARE</h3>
        <ToggleSwitch
          :model-value="displaySection === 'S&H'"
          @update:model-value="handleSHDisplayToggle"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  displaySection: 'CPA' | 'S&H' | null;
}

interface Emits {
  (e: 'update:displaySection', section: 'CPA' | 'S&H' | null): void;
}

const handleCPADisplayToggle = (active: boolean) => {
  if (active) {
    emit('update:displaySection', 'CPA');
  } else {
    emit('update:displaySection', null);
  }
};

const handleSHDisplayToggle = (active: boolean) => {
  if (active) {
    emit('update:displaySection', 'S&H');
  } else {
    emit('update:displaySection', null);
  }
};
</script>
```

### 2. CPAContractSection Component

**Purpose**: Handle CPA-specific configuration with multiple equipment support.

```vue
<template>
  <div class="cpa-contract-section">
    <!-- CPA Type Selection -->
    <div class="form-field">
      <label class="form-label required">TIPO DE CONTRATO CPA</label>
      <select
        v-model="contractData.cpaContractType"
        class="form-select"
        required
      >
        <option value="">Selecione o tipo...</option>
        <option value="CPA">CPA - Cashlogy (2023)</option>
        <option value="CPA_1500">CPA - Cashlogy (1500)</option>
      </select>
    </div>

    <!-- Equipment Management -->
    <div class="equipment-section">
      <div class="equipment-header">
        <h4>EQUIPAMENTOS CPA</h4>
        <button type="button" class="add-equipment-btn" @click="addEquipment">
          + ADICIONAR EQUIPAMENTO
        </button>
      </div>

      <div class="equipment-info-callout">
        <span class="info-icon">ℹ️</span>
        <span
          >O desconto aplica-se apenas aos equipamentos adicionais (2º, 3º,
          etc.). O primeiro equipamento não tem desconto.</span
        >
      </div>

      <div class="equipment-list">
        <EquipmentCard
          v-for="(equipment, index) in contractData.equipment"
          :key="equipment.id"
          :equipment="equipment"
          :equipment-number="index + 1"
          :show-discount="index > 0"
          @update="updateEquipment(index, $event)"
          @remove="removeEquipment(index)"
        />
      </div>
    </div>

    <!-- Contract Dates -->
    <ContractDatesSection
      v-model:start-date="contractData.startDate"
      v-model:end-date="contractData.endDate"
    />
  </div>
</template>
```

### 3. SHContractSection Component

**Purpose**: Handle S&H-specific configuration with single equipment info.

```vue
<template>
  <div class="sh-contract-section">
    <!-- S&H Plan Selection -->
    <div class="form-field">
      <label class="form-label required">PLANO S&H</label>
      <select v-model="contractData.shPlan" class="form-select" required>
        <option value="">Selecione o plano...</option>
        <option value="simple">SIMPLE</option>
        <option value="brass">BRASS</option>
        <option value="silver">SILVER</option>
        <option value="gold">GOLD</option>
        <option value="diamond">DIAMOND</option>
        <option value="platinum">PLATINUM</option>
      </select>
    </div>

    <!-- Equipment Information -->
    <div class="equipment-info-section">
      <h4>INFORMAÇÃO DO EQUIPAMENTO</h4>
      <div class="equipment-fields">
        <div class="form-field">
          <label class="form-label">MODELO</label>
          <input
            v-model="contractData.equipment.model"
            type="text"
            class="form-input"
            placeholder="Ex: Dell Optiplex 7090"
          />
        </div>

        <div class="form-field">
          <label class="form-label">Nº SÉRIE</label>
          <input
            v-model="contractData.equipment.serialNumber"
            type="text"
            class="form-input"
            placeholder="Ex: ABC123456"
          />
        </div>

        <div class="form-field">
          <label class="form-label">SOFTWARE</label>
          <input
            v-model="contractData.equipment.software"
            type="text"
            class="form-input"
            placeholder="Ex: Windows 11 Pro"
          />
        </div>
      </div>
    </div>

    <!-- Contract Dates -->
    <ContractDatesSection
      v-model:start-date="contractData.startDate"
      v-model:end-date="contractData.endDate"
    />
  </div>
</template>
```

### 4. EquipmentCard Component (CPA-specific)

**Purpose**: Individual equipment card for CPA contracts with numbering and
discount logic.

```vue
<template>
  <div class="equipment-card">
    <div class="equipment-header">
      <h5>EQUIPAMENTO {{ equipmentNumber }}</h5>
      <button
        v-if="equipmentNumber > 1"
        type="button"
        class="remove-btn"
        @click="$emit('remove')"
      >
        ✕
      </button>
    </div>

    <div class="equipment-fields">
      <div class="form-field">
        <label class="form-label">MODELO</label>
        <input
          v-model="localEquipment.model"
          type="text"
          class="form-input"
          placeholder="Ex: GEST 15"
          @input="updateEquipment"
        />
      </div>

      <div class="form-field">
        <label class="form-label">Nº SÉRIE</label>
        <input
          v-model="localEquipment.serialNumber"
          type="text"
          class="form-input"
          placeholder="Ex: 1234567"
          @input="updateEquipment"
        />
      </div>

      <div v-if="showDiscount" class="form-field">
        <label class="form-label">DESCONTO (%)</label>
        <input
          v-model.number="localEquipment.discount"
          type="number"
          class="form-input"
          min="0"
          max="100"
          placeholder="0"
          @input="updateEquipment"
        />
      </div>
    </div>

    <div class="form-field">
      <label class="form-label">OBSERVAÇÕES</label>
      <textarea
        v-model="localEquipment.observations"
        class="form-textarea"
        rows="3"
        placeholder="Observações sobre este equipamento..."
        @input="updateEquipment"
      />
    </div>
  </div>
</template>
```

### 5. PaymentMethodSection Component

**Purpose**: Unified payment method selection for any active contract type.

```vue
<template>
  <div class="payment-method-section">
    <h2>INFORMAÇÃO ADICIONAL</h2>
    <div class="form-field">
      <label class="form-label">MÉTODO DE PAGAMENTO</label>
      <select
        v-model="paymentMethod"
        class="form-select"
        @change="$emit('update:paymentMethod', $event.target.value)"
      >
        <option value="">Selecione o método...</option>
        <option value="TRANSFERENCIA_BANCARIA">Transferência Bancária</option>
        <option value="DEBITO_DIRETO">Débito Direto</option>
        <option value="MULTIBANCO">Multibanco</option>
        <option value="CHEQUE">Cheque</option>
        <option value="NUMERARIO">Numerário</option>
        <option value="MB_WAY">MB WAY</option>
      </select>
    </div>
  </div>
</template>
```

## State Management

### Form Data Structure

```typescript
interface ContractFormData {
  // Client information
  clientId: string;
  clientName: string;

  // Display control (UI only)
  displaySection: 'CPA' | 'S&H' | null;

  // CPA-specific data (persists regardless of display)
  cpaData: {
    contractType: 'CPA' | 'CPA_1500' | '';
    equipment: CPAEquipment[];
    startDate: string;
    endDate: string;
  } | null;

  // S&H-specific data (persists regardless of display)
  shData: {
    plan: string;
    equipment: {
      model: string;
      serialNumber: string;
      software: string;
    };
    startDate: string;
    endDate: string;
  } | null;

  // Unified payment method
  paymentMethod: string;
}

interface CPAEquipment {
  id: string;
  model: string;
  serialNumber: string;
  discount: number; // 0 for first equipment
  observations: string;
}
```

### State Management Logic

```typescript
// Main form state management
const formState = reactive<ContractFormData>({
  clientId: '',
  clientName: '',
  displaySection: null,
  cpaData: null,
  shData: null,
  paymentMethod: '',
});

// Handle display section switching (preserves data)
const switchDisplaySection = (newSection: 'CPA' | 'S&H' | null) => {
  formState.displaySection = newSection;

  // Initialize data structures if they don't exist
  if (newSection === 'CPA' && !formState.cpaData) {
    formState.cpaData = {
      contractType: '',
      equipment: [],
      startDate: '',
      endDate: '',
    };
  } else if (newSection === 'S&H' && !formState.shData) {
    formState.shData = {
      plan: '',
      equipment: {
        model: '',
        serialNumber: '',
        software: '',
      },
      startDate: '',
      endDate: '',
    };
  }
};
```

## Styling Guidelines

### Toggle Switch Styling

```scss
.contract-toggle-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 0.75rem;

  &.inactive {
    opacity: 0.5;
    background-color: #f9fafb;

    h3 {
      color: #9ca3af;
    }
  }

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #374151;
  }
}
```

### Equipment Card Styling

```scss
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
      margin: 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
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
```

### Info Callout Styling

```scss
.equipment-info-callout {
  display: flex;
  align-items: flex-start;
  padding: 0.75rem;
  background-color: #dbeafe;
  border: 1px solid #93c5fd;
  border-radius: 0.375rem;
  margin-bottom: 1rem;

  .info-icon {
    margin-right: 0.5rem;
    font-size: 1rem;
  }

  span {
    font-size: 0.875rem;
    color: #1e40af;
    line-height: 1.4;
  }
}
```

## Validation Strategy

### Contract-Specific Validation

```typescript
const validateContract = (formData: ContractFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Client validation
  if (!formData.clientId) {
    errors.clientId = 'Cliente é obrigatório';
  }

  // CPA-specific validation (if CPA data exists)
  if (formData.cpaData && formData.cpaData.contractType) {
    if (!formData.cpaData.contractType) {
      errors.cpaContractType = 'Tipo de contrato CPA é obrigatório';
    }

    if (formData.cpaData.equipment.length === 0) {
      errors.cpaEquipment = 'Pelo menos um equipamento CPA é obrigatório';
    }

    // Validate each equipment
    formData.cpaData.equipment.forEach((equipment, index) => {
      if (!equipment.model.trim()) {
        errors[`cpaEquipment${index}Model`] =
          'Modelo do equipamento é obrigatório';
      }
    });
  }

  // S&H-specific validation (if S&H data exists)
  if (formData.shData && formData.shData.plan) {
    if (!formData.shData.plan) {
      errors.shPlan = 'Plano S&H é obrigatório';
    }
  }

  // At least one contract type should be configured
  const hasCPAData = formData.cpaData && formData.cpaData.contractType;
  const hasSHData = formData.shData && formData.shData.plan;

  if (!hasCPAData && !hasSHData) {
    errors.contractType =
      'Configure pelo menos um tipo de contrato (CPA ou S&H)';
  }

  return errors;
};
```

## Mobile Responsiveness

### Responsive Design Considerations

- **Toggle switches**: Maintain 44px minimum touch target
- **Equipment cards**: Stack fields vertically on mobile
- **Form fields**: Full width on mobile, grid layout on desktop
- **Payment section**: Consistent spacing across devices

### Breakpoint Strategy

```scss
// Mobile-first approach
.contract-form {
  padding: 1rem;

  @media (min-width: 768px) {
    padding: 2rem;
    max-width: 800px;
    margin: 0 auto;
  }

  .equipment-fields {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;

    @media (min-width: 640px) {
      grid-template-columns: 1fr 1fr;
    }

    @media (min-width: 768px) {
      grid-template-columns: 1fr 1fr 1fr;
    }
  }
}
```

## Testing Strategy

### Unit Testing Focus Areas

1. **Display toggle functionality**: Ensure display switches work correctly
2. **Data persistence**: Verify data is preserved when switching display views
3. **Equipment management**: Test add/remove/edit equipment functionality
4. **Validation**: Test validation for both contract types
5. **State management**: Verify proper state transitions without data loss

### Integration Testing

1. **Form submission**: Test complete workflow for both contract types
2. **Data persistence**: Ensure form data persists correctly across display
   switches
3. **Error handling**: Test error states and recovery
4. **Mobile interaction**: Test touch interactions and responsive behavior

This design provides a clean, focused approach to contract management with
display toggles, proper data persistence, and a user-friendly interface that
matches the reference images.
