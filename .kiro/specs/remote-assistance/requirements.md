# Requirements Document

## Introduction

This document defines the requirements for implementing Remote Assistance
(Assistências Remotas) content type in the CLEVER dashboard system. Remote
Assistance is a high-frequency content type (~10/day) that manages remote
support records including phone, remote desktop, and mobile assistance sessions
with automatic time-based pricing calculations.

## Glossary

- **Remote_Assistance_System**: The complete system for managing remote
  assistance records
- **Client_Relation**: The relationship between remote assistance records and
  client records
- **Time_Calculator**: The component responsible for calculating assistance
  duration and pricing
- **Business_Hours**: Standard business hours (09:00-18:00) with standard
  pricing
- **After_Hours**: Hours outside business hours with premium pricing
- **Value_Calculator**: The component that determines final pricing based on
  contract status
- **Time_Validator**: The component that validates and formats time inputs
- **Status_Manager**: The component that manages assistance status flags

## Requirements

### Requirement 1: Remote Assistance Record Management

**User Story:** As a technician, I want to create and manage remote assistance
records, so that I can track all remote support activities and generate accurate
billing.

#### Acceptance Criteria

1. THE Remote_Assistance_System SHALL create new remote assistance records with
   all required fields
2. WHEN a remote assistance record is created, THE Remote_Assistance_System
   SHALL generate a unique assistance number
3. THE Remote_Assistance_System SHALL store basic information including client,
   assistance type, responsible technician, and attendee
4. THE Remote_Assistance_System SHALL store date and time information including
   request date, assistance date, start time, and end time
5. THE Remote_Assistance_System SHALL store description fields including request
   reason and assistance report
6. THE Remote_Assistance_System SHALL store status flags including contract,
   warranty, resolved, and report completion

### Requirement 2: Client Relationship Management

**User Story:** As a technician, I want to associate remote assistance records
with clients, so that I can track which clients receive support and maintain
proper billing records.

#### Acceptance Criteria

1. WHEN creating a remote assistance record, THE Remote_Assistance_System SHALL
   allow selection of an existing client
2. THE Remote_Assistance_System SHALL store the client relationship using
   clientId field
3. WHEN displaying remote assistance records, THE Remote_Assistance_System SHALL
   resolve and display client information
4. IF a client relationship cannot be resolved, THEN THE
   Remote_Assistance_System SHALL display an appropriate error message
5. THE Remote_Assistance_System SHALL maintain client relationship integrity
   across all views

### Requirement 3: Time-Based Pricing Calculation

**User Story:** As a billing administrator, I want automatic pricing calculation
based on assistance duration and business hours, so that I can generate accurate
invoices without manual calculations.

#### Acceptance Criteria

1. THE Time_Calculator SHALL calculate total assistance hours from start and end
   times
2. WHEN assistance occurs during business hours (09:00-18:00), THE
   Value_Calculator SHALL apply standard rate of €30/hour
3. WHEN assistance occurs outside business hours, THE Value_Calculator SHALL
   apply premium rate of €45/hour
4. THE Value_Calculator SHALL handle assistance sessions that span across
   business hour boundaries
5. THE Value_Calculator SHALL support assistance sessions that span midnight
6. WHEN contract or warranty flags are true, THE Value_Calculator SHALL set
   assistance value to €0
7. THE Value_Calculator SHALL calculate values without VAT included

### Requirement 4: Time Input Validation and Formatting

**User Story:** As a technician, I want time inputs to be properly validated and
formatted, so that I can enter accurate time information without errors.

#### Acceptance Criteria

1. THE Time_Validator SHALL accept only 00, 15, 30, 45 minute values for time
   inputs
2. WHEN invalid minute values are entered, THE Time_Validator SHALL round up to
   the next valid increment
3. THE Time_Validator SHALL validate that end time is after start time
4. THE Time_Validator SHALL support time entries that span midnight
5. THE Time_Validator SHALL format time inputs consistently across all views

### Requirement 5: Assistance Type Management

**User Story:** As a technician, I want to categorize remote assistance by type,
so that I can track different kinds of support activities.

#### Acceptance Criteria

1. THE Remote_Assistance_System SHALL support three assistance types: REMOTA,
   TELEFÓNICA, TELEMÓVEL
2. WHEN creating assistance records, THE Remote_Assistance_System SHALL require
   selection of assistance type
3. THE Remote_Assistance_System SHALL display assistance type consistently
   across all views
4. THE Remote_Assistance_System SHALL use Portuguese labels for assistance types
   in the user interface

### Requirement 6: Status and Workflow Management

**User Story:** As a technician, I want to track assistance status and workflow
states, so that I can manage the assistance lifecycle from request to
completion.

#### Acceptance Criteria

1. THE Status_Manager SHALL track contract status (boolean flag)
2. THE Status_Manager SHALL track warranty status (boolean flag)
3. THE Status_Manager SHALL track resolution status (boolean flag)
4. WHEN assistance is marked as resolved, THE Status_Manager SHALL make report
   field available
5. THE Status_Manager SHALL track report completion status
6. THE Status_Manager SHALL support attachment management for assistance records

### Requirement 7: Mobile-First User Interface

**User Story:** As a field technician, I want to access remote assistance
management on mobile devices, so that I can create and update records while
working remotely.

#### Acceptance Criteria

1. THE Remote_Assistance_System SHALL provide mobile-first responsive design
   with 44px minimum touch targets
2. THE Remote_Assistance_System SHALL implement the Five-View Pattern: Home
   tile, List, Detail, Create, Update views
3. THE Remote_Assistance_System SHALL use Portuguese language for all user
   interface elements
4. THE Remote_Assistance_System SHALL optimize form inputs for mobile keyboards
   using appropriate HTML5 input types
5. THE Remote_Assistance_System SHALL provide touch-friendly controls for all
   interactive elements

### Requirement 8: Data Persistence and Audit Trail

**User Story:** As a system administrator, I want all remote assistance data to
be properly stored with audit trails, so that I can maintain data integrity and
track changes.

#### Acceptance Criteria

1. THE Remote_Assistance_System SHALL extend the BaseContent interface for
   consistent data structure
2. THE Remote_Assistance_System SHALL maintain audit trail with created/updated
   timestamps and user information
3. THE Remote_Assistance_System SHALL support soft delete functionality
4. THE Remote_Assistance_System SHALL store data in R2 using the established
   content/{type}/{uuid}.json pattern
5. THE Remote_Assistance_System SHALL maintain search indexes for efficient data
   retrieval

### Requirement 9: Search and List Management

**User Story:** As a technician, I want to search and filter remote assistance
records, so that I can quickly find specific assistance sessions.

#### Acceptance Criteria

1. THE Remote_Assistance_System SHALL provide list view with search
   functionality
2. THE Remote_Assistance_System SHALL support filtering by client, technician,
   assistance type, and date range
3. THE Remote_Assistance_System SHALL display key information in list view
   including client, date, type, and value
4. THE Remote_Assistance_System SHALL support pagination for large result sets
5. THE Remote_Assistance_System SHALL maintain search indexes for efficient
   querying

### Requirement 10: Integration with Existing System

**User Story:** As a system architect, I want remote assistance to integrate
seamlessly with the existing CLEVER dashboard, so that users have a consistent
experience across all content types.

#### Acceptance Criteria

1. THE Remote_Assistance_System SHALL follow the established
   content-implementation-pattern
2. THE Remote_Assistance_System SHALL use the same technical stack as other
   content types (Vue 3, TypeScript, Hono)
3. THE Remote_Assistance_System SHALL integrate with the existing authentication
   system
4. THE Remote_Assistance_System SHALL use the established API patterns and error
   handling
5. THE Remote_Assistance_System SHALL follow the same coding standards and
   architectural patterns as existing content types
