# Requirements Document

## Introduction

This specification addresses multiple critical issues with the Contracts form and detail view in the CLEVER dashboard. The problems include incorrect CPA plan filtering, broken price table display logic for CPA_1500 plans, visual issues with toggle switches, and potential data storage/display gaps.

## Glossary

- **System**: The CLEVER dashboard contract management system
- **CPA_Contract**: Contract type for Cashlogy assistance and maintenance (2023 version)
- **CPA_1500_Contract**: Contract type for Cashlogy assistance and maintenance (1500 version)
- **SH_Contract**: Contract type for Software and Hardware assistance
- **Plan_Selection**: The process of choosing a service plan within a contract type
- **Price_Table**: The display component showing pricing information for selected plans
- **Toggle_Switch**: UI component for enabling/disabling contract sections
- **Distance_Pricing**: Pricing structure based on geographical distance (under/over 180km)
- **Flat_Pricing**: Fixed pricing structure not dependent on distance

## Requirements

### Requirement 1: CPA Plan Selection Filtering

**User Story:** As a user creating or editing a contract, I want to see only the relevant plans for my selected CPA contract type, so that I can make accurate plan selections without confusion.

#### Acceptance Criteria

1. WHEN a user selects "CPA - Cashlogy (2023)" contract type, THE System SHALL display only the 3 CPA (2023) plans: Essential Care, Professional Care, Premium Care
2. WHEN a user selects "CPA - Cashlogy (1500)" contract type, THE System SHALL display only the 3 CPA_1500 plans: Essential Care (1500), Professional Care (1500), Premium Care (1500)
3. WHEN no CPA contract type is selected, THE System SHALL display no plan options in the plan dropdown
4. WHEN a user changes from one CPA contract type to another, THE System SHALL clear the previously selected plan and update the available options
5. THE System SHALL load plan options dynamically from the contract-plans.json configuration file

### Requirement 2: Price Table Display Logic

**User Story:** As a user selecting contract plans, I want to see pricing information at the appropriate time based on the plan requirements, so that I can make informed decisions about contract costs.

#### Acceptance Criteria

1. WHEN a user selects any plan (CPA_1500, CPA, or S&H), THE System SHALL display the price table immediately after plan selection
2. WHEN a user changes plan selection, THE System SHALL update the price table to show the new plan's pricing information
3. WHEN required pricing data is missing, THE System SHALL display an appropriate message instead of the price table
4. WHEN a user clears plan selection, THE System SHALL hide the price table
5. THE System SHALL display pricing information according to the plan's pricing structure (flat pricing for CPA_1500, distance-based for CPA and S&H)

### Requirement 3: Toggle Switch Visual Consistency

**User Story:** As a user interacting with contract section toggles, I want consistent and clear visual feedback, so that I can easily understand which sections are active and navigate the form efficiently.

#### Acceptance Criteria

1. WHEN a toggle switch is in the "on" state, THE System SHALL display a clear visual indicator with consistent green styling
2. WHEN a toggle switch is in the "off" state, THE System SHALL display a clear visual indicator with consistent gray styling
3. WHEN a user clicks a toggle switch, THE System SHALL provide immediate visual feedback with smooth animation
4. WHEN a toggle switch changes state, THE System SHALL show/hide the associated section with smooth transition
5. THE System SHALL maintain consistent toggle styling across all contract section toggles

### Requirement 4: Data Storage Completeness

**User Story:** As a user submitting contract forms, I want all my form inputs to be properly saved, so that no information is lost and I can retrieve complete contract details later.

#### Acceptance Criteria

1. WHEN a user submits a contract form, THE System SHALL store all form field values in the backend database
2. WHEN a user selects CPA_1500 contract type, THE System SHALL store the cpaContractType field as "CPA_1500"
3. WHEN a user selects a plan, THE System SHALL store both planIdCPA and planoCPA fields with appropriate values
4. WHEN a user enables the POS package option, THE System SHALL store the hasPOSPackage field as true
5. WHEN a user fills equipment details, THE System SHALL store all equipment fields including modelo, numeroSerie, desconto, and observacoes

### Requirement 5: Detail View Display Completeness

**User Story:** As a user viewing contract details, I want to see all stored contract information displayed clearly, so that I can review complete contract information without missing data.

#### Acceptance Criteria

1. WHEN viewing a contract detail, THE System SHALL display all stored CPA contract fields including contract type, plan, distance, payment method, and dates
2. WHEN viewing a contract with CPA_1500 type, THE System SHALL display "CPA - Cashlogy (1500)" as the contract type
3. WHEN viewing a contract with POS package enabled, THE System SHALL display the POS package status with appropriate styling
4. WHEN viewing contract equipment, THE System SHALL display all equipment fields including model, serial number, discount, and observations
5. WHEN a contract has relation errors, THE System SHALL display clear error messages with appropriate styling

### Requirement 6: Form Validation Enhancement

**User Story:** As a user filling out contract forms, I want clear validation feedback that matches the corrected plan selection behavior, so that I can complete forms efficiently without confusion.

#### Acceptance Criteria

1. WHEN a user selects CPA_1500 contract type, THE System SHALL not require distance selection for validation
2. WHEN a user selects CPA (2023) contract type, THE System SHALL require distance selection for validation
3. WHEN a user selects S&H contract type, THE System SHALL require distance selection for validation
4. WHEN validation fails, THE System SHALL display clear, helpful error messages in Portuguese
5. WHEN a user corrects validation errors, THE System SHALL remove error messages immediately

### Requirement 7: Configuration Data Integrity

**User Story:** As a system administrator, I want the contract plan configuration to be properly structured and accessed, so that the system displays accurate plan information and pricing.

#### Acceptance Criteria

1. THE System SHALL load contract plans from the contract-plans.json configuration file
2. WHEN accessing CPA_1500 plans, THE System SHALL use flat pricing structure without distance requirements
3. WHEN accessing CPA (2023) plans, THE System SHALL use distance-based pricing structure
4. WHEN accessing S&H plans, THE System SHALL use distance-based pricing structure
5. THE System SHALL handle missing or malformed configuration data gracefully with appropriate error messages

### Requirement 8: Client Information Form Simplification

**User Story:** As a user creating or editing contracts, I want a streamlined form that doesn't duplicate client information, so that I can focus on contract-specific details without redundant data entry.

#### Acceptance Criteria

1. WHEN creating a new contract, THE System SHALL only display the client selection dropdown without additional client information fields
2. WHEN editing an existing contract, THE System SHALL display the client selection as read-only to prevent accidental changes
3. WHEN a client is selected during creation, THE System SHALL use the existing client data from the client selection
4. THE System SHALL remove all client information input fields from the contract create form
5. THE System SHALL maintain client information display in the contract detail view using resolved relations
6. THE System SHALL provide clear visual indicators that the client field is read-only in update forms
7. THE System SHALL include the client ID in update requests to maintain data integrity

### Requirement 10: JavaScript Error Prevention

**User Story:** As a user updating contracts by adding new sections (like adding S&H to a CPA-only contract), I want the form to work without JavaScript errors, so that I can successfully submit my changes without technical issues.

#### Acceptance Criteria

1. WHEN a user updates a contract to add a new section (CPA or S&H), THE System SHALL not throw "formData is not defined" errors
2. WHEN form watchers are active, THE System SHALL properly handle component lifecycle and cleanup to prevent memory leaks
3. WHEN form data is accessed in watchers or callbacks, THE System SHALL include proper null checks to prevent undefined reference errors
4. WHEN components are unmounted, THE System SHALL properly cleanup all watchers and event listeners
5. THE System SHALL handle form data initialization and updates without duplicate watchers that could cause conflicts
6. WHEN form sections are toggled on/off, THE System SHALL safely access form data with proper null checking
7. THE System SHALL prevent watchers from accessing destroyed reactive references after component unmount

### Requirement 9: User Experience Consistency

**User Story:** As a user working with contract forms, I want consistent behavior and visual design across all form interactions, so that I can work efficiently without learning different interaction patterns.

#### Acceptance Criteria

1. WHEN interacting with any form element, THE System SHALL provide consistent visual feedback and styling
2. WHEN form sections are shown or hidden, THE System SHALL use consistent animation and transition effects
3. WHEN error states occur, THE System SHALL use consistent error styling and messaging patterns
4. WHEN loading states occur, THE System SHALL display consistent loading indicators
5. THE System SHALL maintain responsive design principles across all form components for mobile and desktop use