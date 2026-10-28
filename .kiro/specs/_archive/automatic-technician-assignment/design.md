# Design Document

## Overview

This design implements automatic technician assignment for work sheets and remote assistance records in the CLEVER dashboard. The solution leverages existing Clerk authentication to automatically populate technician fields with the current user's name, eliminating manual selection while maintaining display functionality.

## Architecture

### High-Level Approach

The system will use an object-based approach where the technician field stores a complete user object with userId, email, firstName, lastName, and userType from Clerk authentication context. This provides comprehensive user information while maintaining audit trail consistency.

### Key Components

1. **Backend Middleware Enhancement**: Extend existing authentication middleware to extract user name
2. **Form Configuration Updates**: Remove technician input fields from form sections
3. **API Route Modifications**: Auto-populate technician fields during create/update operations
4. **Display Logic Preservation**: Maintain existing display functionality without changes

## Components and Interfaces

### Backend Components

#### Authentication Context Enhancement
```typescript
// Extend existing UserContext to include display name
interface UserContext {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'Admin' | 'User';
  sessionId: string;
  isAuthenticated: boolean;
  displayName: string; // New: firstName + lastName
}
```

#### Content Route Template Enhancement
```typescript
// Add technician auto-assignment to generic content routes
function autoAssignTechnician(data: any, userContext: UserContext): void {
  const technicianData = {
    userId: userContext.userId,
    email: userContext.email,
    firstName: userContext.firstName,
    lastName: userContext.lastName,
    userType: userContext.userType
  };
  
  if (hasTechinicianField(data)) {
    data.technician = technicianData;
  }
  if (hasTecnicoResponsavelField(data)) {
    data.technicianResponsavel = technicianData;
  }
}
```

### Frontend Components

#### Form Section Configuration Updates
```typescript
// Remove technician fields from form sections
export const workSheetsFormSections: FormSection[] = [
  // Remove technician field from otherData section
  // Keep all other fields unchanged
];

export const remoteAssistanceFormSections: FormSection[] = [
  // Remove technicianResponsavel field from assistanceInfo section
  // Keep all other fields unchanged
];
```

## Data Models

### Technician User Object
```typescript
// New interface for technician data
interface TechnicianUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: 'Admin' | 'User';
}
```

### Work Sheets Data Structure
```typescript
// Updated WorkSheetOtherData interface
interface WorkSheetOtherData {
  technician: TechnicianUser; // Changed from string to object
  // ... other fields remain unchanged
}
```

### Remote Assistance Data Structure
```typescript
// Updated RemoteAssistanceData interface
interface RemoteAssistanceData {
  technician: TechnicianUser; // Changed from tecnicoResponsavel string to object
  // ... other fields remain unchanged
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

Before writing the correctness properties, I need to analyze the acceptance criteria to determine which ones are testable as properties.

### Property 1: Automatic Technician Assignment on Creation
*For any* authenticated user and any work sheet or remote assistance creation data, the system should automatically populate the technician field with a complete TechnicianUser object containing the user's Clerk data
**Validates: Requirements 1.1, 1.2**

### Property 2: Automatic Technician Assignment on Update  
*For any* authenticated user and any work sheet or remote assistance update operation, the system should automatically update the technician field to a complete TechnicianUser object containing the user's Clerk data
**Validates: Requirements 1.3**

### Property 3: Technician Display Consistency
*For any* work sheet or remote assistance record with a technician assignment, all views (detail, list) should display the technician name consistently using the TechnicianUser object data
**Validates: Requirements 3.1, 3.2, 3.3**

### Property 4: Form Field Removal
*For any* work sheet or remote assistance form configuration, the form sections should not contain manual technician input fields
**Validates: Requirements 2.1, 2.2**

## Error Handling

### Authentication Context Missing
- **Scenario**: User context not available during content operations
- **Response**: Return HTTP 401 with message "Authentication required for technician assignment"
- **Fallback**: Prevent content creation/update until authentication is restored

### User Name Data Missing
- **Scenario**: Authenticated user missing firstName or lastName
- **Response**: Use available name data or fallback to email prefix
- **Logging**: Log warning for incomplete user profile data

### Backend Processing Errors
- **Scenario**: Technician assignment fails during content processing
- **Response**: Return HTTP 500 with descriptive error message
- **Logging**: Log full error context for debugging

## Testing Strategy

### Unit Testing Approach
- **Form Configuration Tests**: Verify technician fields are removed from form sections
- **Authentication Context Tests**: Test user name extraction and formatting
- **Error Handling Tests**: Verify proper error responses for edge cases

### Property-Based Testing Configuration
- **Library**: fast-check (JavaScript/TypeScript property testing)
- **Iterations**: Minimum 100 iterations per property test
- **Test Tags**: Each test tagged with "Feature: automatic-technician-assignment, Property {number}: {property_text}"

**Property Test Implementation:**
1. **Property 1 Test**: Generate random user contexts and content data, verify technician auto-assignment
2. **Property 2 Test**: Generate random update scenarios, verify technician field updates
3. **Property 3 Test**: Generate random content with technician data, verify consistent display
4. **Property 4 Test**: Validate form configurations exclude technician input fields

### Integration Testing
- **API Endpoint Tests**: Test create/update operations with authentication
- **Form Rendering Tests**: Verify forms display without technician fields
- **Display Component Tests**: Verify technician information appears in views

The testing approach balances comprehensive property validation with focused unit tests for specific functionality, ensuring both general correctness and concrete behavior verification.