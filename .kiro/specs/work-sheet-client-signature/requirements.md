# Requirements Document

## Introduction

This feature adds client signature capture functionality to Work Sheets in the CLEVER dashboard. Users can capture signatures using a touch-friendly signature pad on mobile and desktop devices. Signatures are stored as base64-encoded PNG images directly in the Work Sheet content data.

## Glossary

- **Work_Sheet**: A work order document tracking service activities performed for clients
- **Signature_Pad**: A web component that captures handwritten signatures via touch or mouse input
- **Client_Signature**: A base64-encoded PNG image representing the client's signature
- **Content_Data**: The JSON data structure stored in R2 for each Work Sheet

## Requirements

### Requirement 1: Signature Capture Interface

**User Story:** As a technician, I want to capture a client's signature on my mobile device, so that I can document client approval of completed work.

#### Acceptance Criteria

1. WHEN a user accesses the Work Sheet create or update form, THE System SHALL display a "Assinatura Cliente" section after the "Relatório de Serviço" section
2. WHEN a user interacts with the signature pad area, THE System SHALL capture touch or mouse input as signature strokes
3. WHEN a user completes drawing a signature, THE System SHALL provide a clear/redo button to reset the signature pad
4. THE Signature_Pad SHALL have a minimum height of 200px on mobile devices for comfortable signing
5. THE Signature_Pad SHALL use a 44px minimum touch target for all interactive buttons

### Requirement 2: Signature Data Storage

**User Story:** As a system administrator, I want client signatures stored with work sheet data, so that signature records are preserved with the work order.

#### Acceptance Criteria

1. WHEN a user saves a Work Sheet with a signature, THE System SHALL encode the signature as a base64 PNG string
2. THE System SHALL store the signature in the `clientSignature` field within Work Sheet content data
3. WHEN a signature is captured, THE System SHALL store the capture timestamp in the `clientSignatureDate` field
4. WHEN a signature is captured, THE System SHALL store the client name in the `clientSignatureName` field
5. WHEN a Work Sheet is saved without a signature, THE System SHALL allow the save operation to proceed (signature is optional)

### Requirement 3: Signature Display

**User Story:** As a user, I want to view captured signatures in work sheet details, so that I can verify client approval documentation.

#### Acceptance Criteria

1. WHEN viewing a Work Sheet detail page with a signature, THE System SHALL display the signature image
2. WHEN viewing a Work Sheet detail page with a signature, THE System SHALL display the client name associated with the signature
3. WHEN viewing a Work Sheet detail page with a signature, THE System SHALL display the signature capture date
4. WHEN viewing a Work Sheet detail page without a signature, THE System SHALL display "Sem assinatura" message
5. THE Signature display SHALL be responsive and scale appropriately on mobile devices

### Requirement 4: Form Integration

**User Story:** As a developer, I want signature capture integrated with existing form patterns, so that the implementation is consistent with other form sections.

#### Acceptance Criteria

1. THE System SHALL add the signature section to the work sheets form configuration
2. THE Signature section SHALL appear after all other sections and before "Observations"
3. THE System SHALL use the existing ContentFormTemplate pattern for form rendering
4. WHEN navigating between form pages, THE System SHALL preserve signature data using the shared form data composable
5. THE System SHALL follow Portuguese UI labeling conventions for all signature-related text
