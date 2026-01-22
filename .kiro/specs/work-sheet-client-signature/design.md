# Design Document: Work Sheet Client Signature

## Overview

This feature adds client signature capture functionality to Work Sheets using the signature_pad JavaScript library. The implementation follows CLEVER's existing form patterns and mobile-first design principles. Signatures are stored as base64-encoded PNG images directly in the Work Sheet content data structure, requiring no changes to backend storage or API endpoints.

The signature capture interface will be touch-optimized for mobile devices while remaining functional on desktop browsers. The feature integrates seamlessly with the existing ContentFormTemplate pattern and shared form data composable.

## Architecture

### Component Structure

```
SignaturePad.vue (new)
  ├─ Canvas element for signature capture
  ├─ Clear/Redo button
  ├─ Client name input field
  └─ Signature metadata management

WorkSheetsCreateView.vue (modified)
  └─ Includes signature section in form configuration

WorkSheetsUpdateView.vue (modified)
  └─ Includes signature section in form configuration

WorkSheetsDetailView.vue (modified)
  └─ Displays captured signature with metadata
```

### Data Flow

1. **Capture**: User draws signature → signature_pad library captures strokes → component converts to base64 PNG
2. **Storage**: Base64 string stored in `workSheet.data.clientSignature` field via shared form data composable
3. **Retrieval**: Work Sheet loaded from R2 → signature data included in content response
4. **Display**: Detail view renders base64 PNG as image with associated metadata

### Library Integration

**signature_pad** (https://github.com/szimek/signature_pad)
- Lightweight (~5KB minified)
- No dependencies
- Touch and mouse support
- Canvas-based rendering
- Simple API: `toDataURL()` for PNG export, `clear()` for reset

## Components and Interfaces

### SignaturePad Component

**Purpose**: Reusable signature capture component with touch-optimized interface

**Props**:
```typescript
interface SignaturePadProps {
  modelValue?: string;           // Base64 PNG string
  clientName?: string;            // Client name for signature
  disabled?: boolean;             // Read-only mode for display
  hasError?: boolean;             // Validation error state
}
```

**Events**:
```typescript
interface SignaturePadEvents {
  'update:modelValue': (signature: string) => void;
  'update:clientName': (name: string) => void;
  'signature-cleared': () => void;
}
```

**Template Structure**:
```vue
<template>
  <div class="signature-pad-container">
    <!-- Client name input -->
    <div class="mb-4">
      <label class="form-label">Nome do Cliente</label>
      <input 
        type="text" 
        v-model="localClientName"
        :disabled="disabled"
        class="form-input"
        placeholder="Digite o nome do cliente"
      />
    </div>

    <!-- Signature canvas -->
    <div class="signature-canvas-wrapper">
      <canvas ref="canvasRef" class="signature-canvas"></canvas>
    </div>

    <!-- Action buttons -->
    <div class="signature-actions" v-if="!disabled">
      <button 
        type="button"
        @click="clearSignature"
        class="btn-secondary"
      >
        Limpar
      </button>
    </div>

    <!-- Signature preview (when disabled/viewing) -->
    <div v-if="disabled && modelValue" class="signature-preview">
      <img :src="modelValue" alt="Assinatura do Cliente" />
    </div>
  </div>
</template>
```

**Key Methods**:
```typescript
// Initialize signature pad
const initSignaturePad = () => {
  if (!canvasRef.value) return;
  
  signaturePad.value = new SignaturePad(canvasRef.value, {
    backgroundColor: 'rgb(255, 255, 255)',
    penColor: 'rgb(0, 0, 0)',
    minWidth: 1,
    maxWidth: 3,
  });

  signaturePad.value.addEventListener('endStroke', handleSignatureChange);
};

// Convert signature to base64 PNG
const handleSignatureChange = () => {
  if (!signaturePad.value || signaturePad.value.isEmpty()) {
    emit('update:modelValue', '');
    return;
  }

  const dataURL = signaturePad.value.toDataURL('image/png');
  emit('update:modelValue', dataURL);
};

// Clear signature
const clearSignature = () => {
  if (signaturePad.value) {
    signaturePad.value.clear();
    emit('update:modelValue', '');
    emit('signature-cleared');
  }
};
```

**Responsive Design**:
- Mobile (< 768px): Full-width canvas, 200px height, stacked buttons
- Desktop (≥ 768px): Constrained width (max 600px), 250px height, inline buttons
- Touch targets: 44px minimum for all buttons
- Canvas border: 2px solid for clear visual boundary

### Form Section Configuration

**New Section Definition**:
```typescript
{
  key: 'clientSignature',
  title: 'Assinatura Cliente',
  order: 95, // Before observations (order: 100)
  fields: [
    {
      key: 'clientSignature',
      label: 'Assinatura',
      type: 'signature',
      required: false,
      helpText: 'Capture a assinatura do cliente usando o painel abaixo'
    },
    {
      key: 'clientSignatureName',
      label: 'Nome do Cliente',
      type: 'text',
      required: false,
      helpText: 'Nome do cliente que assinou'
    }
  ]
}
```

**Integration with ContentFormTemplate**:
- Add custom field template slot for signature field type
- Use SignaturePad component in custom template
- Handle signature data through shared form data composable
- Automatic timestamp capture on signature save

### Detail View Display

**Display Section**:
```vue
<div v-if="workSheet?.data.clientSignature" class="detail-section">
  <h3 class="detail-section-title">Assinatura Cliente</h3>
  
  <div class="signature-display">
    <div class="signature-image-container">
      <img 
        :src="workSheet.data.clientSignature" 
        alt="Assinatura do Cliente"
        class="signature-image"
      />
    </div>
    
    <div class="signature-metadata">
      <div class="metadata-row">
        <span class="metadata-label">Nome:</span>
        <span class="metadata-value">
          {{ workSheet.data.clientSignatureName || 'N/A' }}
        </span>
      </div>
      
      <div class="metadata-row">
        <span class="metadata-label">Data:</span>
        <span class="metadata-value">
          {{ formatDate(workSheet.data.clientSignatureDate) }}
        </span>
      </div>
    </div>
  </div>
</div>

<div v-else class="detail-section">
  <h3 class="detail-section-title">Assinatura Cliente</h3>
  <p class="text-gray-500 italic">Sem assinatura</p>
</div>
```

## Data Models

### Work Sheet Type Extension

```typescript
interface WorkSheetData {
  // ... existing fields ...
  
  // Signature fields (optional)
  clientSignature?: string;        // Base64-encoded PNG
  clientSignatureName?: string;    // Client name
  clientSignatureDate?: string;    // ISO 8601 timestamp
}
```

### Signature Metadata

```typescript
interface SignatureMetadata {
  name: string;           // Client name
  capturedAt: string;     // ISO 8601 timestamp
  dataURL: string;        // Base64 PNG data URL
}
```

### Storage Format

Signatures stored directly in Work Sheet content data:

```json
{
  "uuid": "work-sheet-uuid",
  "contentType": "work-sheets",
  "data": {
    "clientId": "client-uuid",
    "serviceType": "Manutenção",
    "clientSignature": "data:image/png;base64,iVBORw0KGgoAAAANS...",
    "clientSignatureName": "João Silva",
    "clientSignatureDate": "2024-01-15T14:30:00Z"
  }
}
```

**Size Considerations**:
- Typical signature: 10-30KB base64-encoded
- Maximum reasonable size: 100KB
- No separate file storage needed
- Inline storage simplifies retrieval and display


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Signature Capture Responsiveness

*For any* sequence of touch or mouse input events on the signature canvas, the signature pad should capture and render the strokes, updating the component's signature data state.

**Validates: Requirements 1.2**

### Property 2: Clear Functionality Idempotence

*For any* signature pad state (empty or containing strokes), invoking the clear function should result in an empty signature pad and emit an empty signature value.

**Validates: Requirements 1.3**

### Property 3: Base64 PNG Encoding

*For any* non-empty signature canvas state, converting the signature to a data URL should produce a valid base64-encoded PNG string starting with "data:image/png;base64,".

**Validates: Requirements 2.1**

### Property 4: Complete Signature Data Storage

*For any* work sheet with a captured signature, the system should store all three signature fields (clientSignature as base64 PNG, clientSignatureName as string, clientSignatureDate as ISO 8601 timestamp) in the work sheet content data.

**Validates: Requirements 2.2, 2.3, 2.4**

### Property 5: Complete Signature Display

*For any* work sheet with signature data (clientSignature, clientSignatureName, clientSignatureDate), the detail view should display all three elements: the signature image, the client name, and the formatted capture date.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 6: Navigation Data Persistence

*For any* work sheet form with signature data, navigating away from the form and returning should preserve the signature data (image, client name, and timestamp) through the shared form data composable.

**Validates: Requirements 4.4**

## Error Handling

### Signature Capture Errors

**Canvas Initialization Failure**:
- Scenario: Canvas element not available in DOM
- Handling: Log error, display fallback message "Erro ao inicializar painel de assinatura"
- Recovery: Retry initialization on component mount

**signature_pad Library Load Failure**:
- Scenario: Library fails to load from CDN or npm
- Handling: Display error message "Erro ao carregar componente de assinatura"
- Recovery: Provide manual signature upload as fallback (future enhancement)

### Data Conversion Errors

**Base64 Encoding Failure**:
- Scenario: toDataURL() throws exception
- Handling: Log error, clear signature state, notify user "Erro ao processar assinatura"
- Recovery: Allow user to retry signature capture

**Invalid Data URL Format**:
- Scenario: Generated data URL doesn't match expected format
- Handling: Validate format before storage, reject invalid signatures
- Recovery: Clear signature and prompt user to sign again

### Storage Errors

**Signature Too Large**:
- Scenario: Base64 string exceeds reasonable size (>100KB)
- Handling: Display warning "Assinatura muito complexa, por favor simplifique"
- Recovery: Clear signature and allow retry with simpler strokes

**Missing Metadata**:
- Scenario: Signature exists but client name is empty
- Handling: Allow save (name is optional), but display validation hint
- Recovery: User can update work sheet later to add name

### Display Errors

**Invalid Base64 Data**:
- Scenario: Stored signature data is corrupted or invalid
- Handling: Display "Assinatura inválida" message instead of broken image
- Recovery: Allow work sheet update to recapture signature

**Missing Signature Data**:
- Scenario: Work sheet loaded but signature fields are undefined
- Handling: Display "Sem assinatura" message (expected behavior)
- Recovery: No recovery needed, this is valid state

## Testing Strategy

### Dual Testing Approach

This feature requires both unit tests and property-based tests for comprehensive coverage:

**Unit Tests** focus on:
- Specific examples of signature capture workflows
- Edge cases like empty signatures, very simple signatures, complex signatures
- Error conditions (canvas initialization failure, invalid data URLs)
- Integration points (form template integration, shared form data composable)
- Portuguese label verification

**Property Tests** focus on:
- Universal properties across all signature inputs (Properties 1-6)
- Comprehensive input coverage through randomization
- Data persistence guarantees across navigation
- Storage format consistency

### Property-Based Testing Configuration

**Library**: fast-check (JavaScript/TypeScript property-based testing library)

**Test Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with feature name and property reference
- Tag format: `Feature: work-sheet-client-signature, Property {number}: {property_text}`

**Property Test Examples**:

```typescript
// Property 3: Base64 PNG Encoding
test('Feature: work-sheet-client-signature, Property 3: Base64 PNG Encoding', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        x: fc.integer(0, 600),
        y: fc.integer(0, 250),
      }), { minLength: 2, maxLength: 100 }),
      (strokes) => {
        // Draw strokes on signature pad
        const signaturePad = createSignaturePad();
        strokes.forEach(point => signaturePad.drawPoint(point.x, point.y));
        
        // Convert to data URL
        const dataURL = signaturePad.toDataURL('image/png');
        
        // Verify format
        expect(dataURL).toMatch(/^data:image\/png;base64,/);
        expect(dataURL.length).toBeGreaterThan(100); // Non-trivial signature
      }
    ),
    { numRuns: 100 }
  );
});

// Property 4: Complete Signature Data Storage
test('Feature: work-sheet-client-signature, Property 4: Complete Signature Data Storage', () => {
  fc.assert(
    fc.property(
      fc.string({ minLength: 100 }), // base64 signature
      fc.string({ minLength: 1 }),   // client name
      (signature, clientName) => {
        const workSheetData = {
          clientSignature: `data:image/png;base64,${signature}`,
          clientSignatureName: clientName,
          clientSignatureDate: new Date().toISOString(),
        };
        
        // Verify all fields are stored
        expect(workSheetData.clientSignature).toBeDefined();
        expect(workSheetData.clientSignatureName).toBe(clientName);
        expect(workSheetData.clientSignatureDate).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Unit Test Examples

```typescript
// Example: Empty signature handling
test('allows saving work sheet without signature', () => {
  const workSheetData = {
    clientId: 'client-123',
    serviceType: 'Manutenção',
    // No signature fields
  };
  
  const validation = validateWorkSheet(workSheetData);
  expect(validation.isValid).toBe(true);
});

// Example: Clear button functionality
test('clear button resets signature pad', () => {
  const { getByText, getByRole } = render(SignaturePad);
  const canvas = getByRole('img');
  
  // Draw signature
  fireEvent.mouseDown(canvas, { clientX: 10, clientY: 10 });
  fireEvent.mouseMove(canvas, { clientX: 50, clientY: 50 });
  fireEvent.mouseUp(canvas);
  
  // Click clear
  const clearButton = getByText('Limpar');
  fireEvent.click(clearButton);
  
  // Verify signature is cleared
  expect(canvas).toHaveAttribute('data-signature-empty', 'true');
});

// Example: Portuguese labels
test('displays Portuguese labels correctly', () => {
  const { getByText, getByLabelText } = render(SignaturePad);
  
  expect(getByText('Assinatura Cliente')).toBeInTheDocument();
  expect(getByLabelText('Nome do Cliente')).toBeInTheDocument();
  expect(getByText('Limpar')).toBeInTheDocument();
});
```

### Mobile Testing Checklist

- [ ] Signature capture works with touch input on mobile devices
- [ ] Canvas height is 200px minimum on mobile viewports
- [ ] Clear button meets 44px touch target requirement
- [ ] Signature displays responsively on mobile detail view
- [ ] Client name input is touch-friendly with appropriate keyboard
- [ ] Form section ordering is correct on mobile layout
- [ ] Signature data persists across mobile navigation
- [ ] Base64 PNG size is reasonable for mobile data constraints

### Integration Testing

- [ ] SignaturePad component integrates with ContentFormTemplate
- [ ] Signature data flows through shared form data composable
- [ ] Work sheet save includes signature data in R2 storage
- [ ] Work sheet detail view retrieves and displays signature
- [ ] Form validation allows optional signature field
- [ ] Section ordering places signature before observations
