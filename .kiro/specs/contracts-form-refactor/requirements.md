# Contracts Form Refactor - Requirements Specification

## Overview

This spec defines a comprehensive refactor of the contracts form to match the
modern visual design shown in the reference images. The key insight from the
images is that this implements a **UI display toggle system** where users can
switch between viewing CPA and S&H configuration sections, while both contract
types can be configured for the same client.

## Design Requirements from Reference Images

### Key Design Principle: UI Display Toggle System

- **Display Toggle Switches**: Users can toggle between viewing CPA or S&H
  configuration sections
- **Single Section Display**: Only one contract type section is visible at a
  time for clean UX
- **Both Types Configurable**: Clients can have both CPA and S&H contracts
  simultaneously
- **Clean Interface**: Focused view on one contract type at a time reduces
  cognitive load

### Visual Layout Structure

- **Toggle Switch Design**: Clean toggle switches for CPA and S&H section
  display
- **Single Section Display**: Only the selected contract type section is visible
- **Inline Form Fields**: Contract type, plan, and distance in organized layout
- **Equipment Management**: Different approaches for CPA (multiple equipment
  cards) vs S&H (single equipment info)
- **Contract Dates**: Start and end date fields for each contract type
- **Payment Method**: Single payment method selection at the bottom
- **Color Coding**: Green accent color (#75AE93) for active toggle states

### Specific Visual Elements from Images

#### Image 1 - CPA Section Active:

- "PLANOS DE CONTRATO" section header with info note: "O cliente pode ter um ou
  ambos os tipos de contrato (CPA e/ou S&H)"
- "CPA - CASHLOGY" header with toggle ON (green)
- "S&H - SOFTWARE E HARDWARE" header with toggle OFF (gray)
- "TIPO DE CONTRATO CPA" dropdown
- "EQUIPAMENTOS CPA" section with "ADICIONAR EQUIPAMENTO" button
- Blue info callout about discount rules
- "EQUIPAMENTO 1" card with MODELO, Nº SÉRIE fields
- "OBSERVAÇÕES" textarea
- "DATAS DO CONTRATO" section

#### Image 2 - S&H Section Active:

- "S&H - SOFTWARE E HARDWARE" header with toggle ON (green)
- "PLANO S&H" dropdown selection
- "INFORMAÇÃO DO EQUIPAMENTO" section with three fields: MODELO, Nº SÉRIE,
  SOFTWARE
- "DATAS DO CONTRATO" section with start/end dates
- "INFORMAÇÃO ADICIONAL" section with payment method dropdown

## User Stories

### US-1: UI Display Toggle System

**As a user**, I want to toggle between viewing CPA and S&H contract
configuration sections, so that I can focus on configuring one contract type at
a time while maintaining the ability to configure both types for the same
client.

**Acceptance Criteria:**

- [ ] Toggle switches control which section is displayed (CPA or S&H)
- [ ] Only one section is visible at a time for clean UX
- [ ] Both contract types can be configured for the same client
- [ ] Switching toggles preserves data in both sections
- [ ] Clear visual feedback shows which section is currently displayed
- [ ] Inactive toggle is visually grayed out but still clickable

### US-2: CPA Contract Configuration

**As a user**, I want to configure CPA contracts with multiple equipment support
and proper discount logic, so that I can set up comprehensive CPA service
agreements.

**Acceptance Criteria:**

- [ ] CPA contract type dropdown selection
- [ ] Multiple equipment cards with "EQUIPAMENTO 1", "EQUIPAMENTO 2" numbering
- [ ] "ADICIONAR EQUIPAMENTO" button to add new equipment
- [ ] Blue info callout explaining discount rules
- [ ] Model and serial number fields for each equipment
- [ ] Observations textarea for each equipment
- [ ] Contract start and end date fields
- [ ] First equipment has 0% discount, additional equipment configurable

### US-3: S&H Contract Configuration

**As a user**, I want to configure S&H contracts with single equipment
information, so that I can set up software and hardware support agreements.

**Acceptance Criteria:**

- [ ] S&H plan dropdown selection
- [ ] Single equipment information section with three fields
- [ ] MODELO field for equipment model
- [ ] Nº SÉRIE field for serial number
- [ ] SOFTWARE field for software information
- [ ] Contract start and end date fields
- [ ] Clean, simple layout focused on software/hardware support

### US-4: Unified Payment Method Selection

**As a user**, I want to select a payment method that applies to the contract
configuration, so that I can complete the contract setup.

**Acceptance Criteria:**

- [ ] Single "INFORMAÇÃO ADICIONAL" section at the bottom
- [ ] "MÉTODO DE PAGAMENTO" dropdown
- [ ] Payment method applies to the overall contract
- [ ] Clear separation from contract-specific sections

### US-5: Data Persistence and Management

**As a user**, I want my configuration data to persist when switching between
contract type views, so that I don't lose information when toggling between CPA
and S&H sections.

**Acceptance Criteria:**

- [ ] Switching display toggles preserves all form data
- [ ] Form validation works for both contract types
- [ ] Required fields are clearly marked in each section
- [ ] Error messages are specific to the visible section
- [ ] Form submission includes data for both configured contract types

## Technical Requirements

### TR-1: Implement UI Display Toggle Logic

- **Requirement**: Create display toggle switches for CPA and S&H sections
- **Solution**: Implement toggle logic that controls section visibility without
  clearing data
- **Files**: Toggle switch components and display state management

### TR-2: Dynamic Section Display

- **Requirement**: Show only the selected contract type's configuration section
- **Solution**: Conditional rendering based on display toggle state
- **Files**: Form template and section components

### TR-3: Contract-Specific Equipment Management

- **Requirement**: Different equipment handling for CPA (multiple) vs S&H
  (single)
- **Solution**: Separate equipment components for each contract type
- **Files**: Equipment management components

### TR-4: Data Persistence Management

- **Requirement**: Preserve form data when switching between display views
- **Solution**: Maintain separate data state for both contract types
- **Files**: Form state management and validation

### TR-5: Unified Payment Processing

- **Requirement**: Single payment method selection for the overall contract
- **Solution**: Payment method component that works with both contract types
- **Files**: Payment method component

## Implementation Tasks

### Task 1: Create UI Display Toggle System

- [ ] Design display toggle switches (not mutually exclusive)
- [ ] Implement toggle state management for UI display
- [ ] Add visual feedback for active/inactive display states
- [ ] Preserve data when switching display views

### Task 2: Implement CPA Contract Section

- [ ] Create CPA-specific form layout
- [ ] Implement multiple equipment management
- [ ] Add equipment numbering and discount logic
- [ ] Create blue info callout component

### Task 3: Implement S&H Contract Section

- [ ] Create S&H-specific form layout
- [ ] Implement single equipment information section
- [ ] Add three-field equipment layout (model, serial, software)
- [ ] Ensure clean, simple design

### Task 4: Create Unified Payment Section

- [ ] Design payment method section
- [ ] Implement dropdown for payment methods
- [ ] Ensure proper integration with both contract types

### Task 5: Integration and Testing

- [ ] Test display toggle behavior
- [ ] Validate data persistence when switching views
- [ ] Test form submission for both contract types
- [ ] Ensure mobile responsiveness

## Definition of Done

- [ ] Only one contract section is visible at a time
- [ ] Toggle switches control display (not data exclusivity)
- [ ] CPA section supports multiple equipment with proper numbering
- [ ] S&H section has single equipment information layout
- [ ] Payment method section works with both contract types
- [ ] Form validation works correctly for both contract types
- [ ] Data persists when switching between display views
- [ ] No runtime errors when switching between sections
- [ ] Mobile-responsive design maintained
- [ ] Portuguese localization preserved
- [ ] Both contract types can be configured simultaneously

## Success Metrics

1. **User Experience**: Users can easily toggle between CPA and S&H sections
   while configuring both
2. **Visual Consistency**: Form matches reference images 100%
3. **Functionality**: All contract creation workflows work without errors
4. **Performance**: Form responds quickly when switching display views
5. **Data Integrity**: No data loss when switching between section views
6. **Accessibility**: Maintains WCAG compliance with display toggle behavior

## Risk Mitigation

- **Risk**: Data confusion when switching display views
- **Mitigation**: Clear visual indicators and data persistence

- **Risk**: User confusion about display vs data state
- **Mitigation**: Clear visual feedback and intuitive toggle behavior

- **Risk**: Complex state management for both contract types
- **Mitigation**: Simple, clear state management patterns with proper testing
