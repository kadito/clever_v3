# Requirements Document

## Introduction

The Daily Activity Records feature enables users to track their daily work activities with detailed time tracking, client associations, and optional links to related work sheets or remote assistance records. This content type supports both internal and external activities, automatic time calculations, and comprehensive activity management within the CLEVER dashboard.

## Glossary

- **System**: The CLEVER dashboard application
- **Daily_Record**: A collection of activities performed on a specific date
- **Activity**: A single work activity with time tracking and optional relations
- **User**: An authenticated person using the system (Admin or Employee role)
- **Work_Sheet**: An existing work sheet content item that can be linked to an activity
- **Remote_Assistance**: An existing remote assistance content item that can be linked to an activity
- **Time_Input**: A formatted time string in HH:MM format
- **Break_Time**: Duration in minutes subtracted from total work time
- **Activity_Link**: An optional reference to a Work_Sheet or Remote_Assistance record

## Requirements

### Requirement 1: Daily Record Creation

**User Story:** As a user, I want to create daily activity records with a specific date, so that I can track my work activities for any given day.

#### Acceptance Criteria

1. WHEN a user creates a daily record, THE System SHALL require a valid date (dataRegistro)
2. WHEN a user creates a daily record, THE System SHALL require at least one activity to be added
3. WHEN a daily record is created, THE System SHALL automatically assign the current authenticated user as the technician
4. WHEN a daily record is created, THE System SHALL store it with a unique UUID identifier
5. WHEN a daily record is created, THE System SHALL initialize audit trail fields (createdAt, createdBy, version)

### Requirement 2: Activity Management

**User Story:** As a user, I want to add, edit, and remove multiple activities within a daily record, so that I can accurately track all my work for the day.

#### Acceptance Criteria

1. WHEN a user adds an activity, THE System SHALL create a new activity entry in the activities array
2. WHEN a user edits an activity, THE System SHALL update the specific activity while preserving others
3. WHEN a user removes an activity, THE System SHALL delete the activity from the activities array
4. WHEN activities are modified, THE System SHALL maintain the order of activities as arranged by the user
5. THE System SHALL allow unlimited activities to be added to a single daily record

### Requirement 3: Activity Type Classification

**User Story:** As a user, I want to classify activities as internal or external, so that I can distinguish between different types of work.

#### Acceptance Criteria

1. WHEN a user creates an activity, THE System SHALL require selection of activity type (Interno or Externo)
2. THE System SHALL validate that activity type is one of the allowed values: "Interno" or "Externo"
3. WHEN displaying activities, THE System SHALL show the activity type clearly
4. THE System SHALL store activity type as a string value in the activity data

### Requirement 4: Activity Subject and Description

**User Story:** As a user, I want to provide a subject and optional description for each activity, so that I can document what work was performed.

#### Acceptance Criteria

1. WHEN a user creates an activity, THE System SHALL require a non-empty subject (assunto)
2. WHEN a user provides a description, THE System SHALL store it with the activity
3. THE System SHALL allow description to be optional (can be empty or omitted)
4. WHEN displaying activities, THE System SHALL show both subject and description if provided

### Requirement 5: Time Tracking

**User Story:** As a user, I want to record start time, end time, and break time for each activity, so that I can accurately track time spent on work.

#### Acceptance Criteria

1. WHEN a user enters start time, THE System SHALL validate it is in HH:MM format
2. WHEN a user enters end time, THE System SHALL validate it is in HH:MM format
3. WHEN a user enters end time, THE System SHALL validate it is after start time (accounting for overnight activities)
4. WHEN a user enters break time, THE System SHALL validate it is a non-negative number in minutes
5. THE System SHALL automatically calculate total hours as (end time - start time - break time)

### Requirement 6: Time Input Formatting

**User Story:** As a user, I want time inputs to automatically format as I type, so that I can quickly enter times without manual formatting.

#### Acceptance Criteria

1. WHEN a user types 4 digits in a time input, THE System SHALL automatically format it as XX:XX
2. WHEN a user types in a time input, THE System SHALL validate the format in real-time
3. WHEN a time input is invalid, THE System SHALL display a validation error message
4. THE System SHALL accept both 24-hour format times (00:00 to 23:59)
5. WHEN a time input loses focus, THE System SHALL ensure the value is properly formatted or empty

### Requirement 7: Total Hours Calculation

**User Story:** As a user, I want the system to automatically calculate total hours for each activity, so that I don't have to manually compute work duration.

#### Acceptance Criteria

1. WHEN start time, end time, and break time are all provided, THE System SHALL calculate total hours
2. WHEN any time field changes, THE System SHALL recalculate total hours immediately
3. THE System SHALL display total hours in HH:MM format
4. THE System SHALL handle overnight activities where end time is before start time (next day)
5. WHEN break time exceeds the duration between start and end time, THE System SHALL display a validation error

### Requirement 8: Activity Linking

**User Story:** As a user, I want to optionally link activities to work sheets or remote assistance records, so that I can associate time tracking with specific jobs.

#### Acceptance Criteria

1. WHEN a user creates an activity, THE System SHALL require selection of link type (Nenhuma, Folha de Obra, or Assistência Remota)
2. WHEN link type is "Folha de Obra", THE System SHALL require a work sheet to be selected
3. WHEN link type is "Assistência Remota", THE System SHALL require a remote assistance record to be selected
4. WHEN link type is "Nenhuma", THE System SHALL not require any linked content
5. THE System SHALL store only the relation ID (workSheetId or remoteAssistanceId) in the activity data

### Requirement 9: Work Sheet Search and Selection

**User Story:** As a user, I want to search for and select work sheets when linking activities, so that I can easily find the relevant work sheet.

#### Acceptance Criteria

1. WHEN link type is "Folha de Obra", THE System SHALL display a work sheet search input
2. WHEN a user types in the search input, THE System SHALL search work sheets by relevant fields
3. WHEN search results are displayed, THE System SHALL show work sheet identification information
4. WHEN a user selects a work sheet, THE System SHALL store the work sheet UUID as workSheetId
5. WHEN a work sheet is selected, THE System SHALL display the selected work sheet information

### Requirement 10: Remote Assistance Search and Selection

**User Story:** As a user, I want to search for and select remote assistance records when linking activities, so that I can easily find the relevant assistance record.

#### Acceptance Criteria

1. WHEN link type is "Assistência Remota", THE System SHALL display a remote assistance search input
2. WHEN a user types in the search input, THE System SHALL search remote assistance records by relevant fields
3. WHEN search results are displayed, THE System SHALL show remote assistance identification information
4. WHEN a user selects a remote assistance record, THE System SHALL store the UUID as remoteAssistanceId
5. WHEN a remote assistance record is selected, THE System SHALL display the selected record information

### Requirement 11: Conditional Field Visibility

**User Story:** As a user, I want to see only relevant fields based on my link type selection, so that the form is not cluttered with unnecessary inputs.

#### Acceptance Criteria

1. WHEN link type is "Nenhuma", THE System SHALL hide both work sheet and remote assistance search inputs
2. WHEN link type is "Folha de Obra", THE System SHALL show work sheet search input and hide remote assistance search input
3. WHEN link type is "Assistência Remota", THE System SHALL show remote assistance search input and hide work sheet search input
4. WHEN link type changes, THE System SHALL clear any previously selected linked content
5. THE System SHALL use smooth transitions when showing or hiding conditional fields

### Requirement 12: Daily Record Listing

**User Story:** As a user, I want to view a list of all daily records, so that I can browse and access historical activity data.

#### Acceptance Criteria

1. WHEN a user navigates to the daily records list, THE System SHALL display all non-deleted daily records
2. WHEN displaying daily records, THE System SHALL show the date, number of activities, and total hours
3. WHEN a user clicks on a daily record, THE System SHALL navigate to the detail view
4. THE System SHALL support search and filtering of daily records by date range
5. THE System SHALL display daily records in reverse chronological order (newest first)

### Requirement 13: Daily Record Detail View

**User Story:** As a user, I want to view complete details of a daily record including all activities, so that I can review the work performed on a specific day.

#### Acceptance Criteria

1. WHEN a user views a daily record detail, THE System SHALL display the record date
2. WHEN displaying daily record details, THE System SHALL show all activities with complete information
3. WHEN activities have linked content, THE System SHALL resolve and display the related work sheets or remote assistance records
4. WHEN relation resolution fails, THE System SHALL display an error message for that specific relation
5. THE System SHALL display audit trail information (created by, created at, updated by, updated at)

### Requirement 14: Daily Record Updates

**User Story:** As a user, I want to update existing daily records, so that I can correct or add information to previously created records.

#### Acceptance Criteria

1. WHEN a user updates a daily record, THE System SHALL allow modification of the date
2. WHEN a user updates a daily record, THE System SHALL allow adding, editing, and removing activities
3. WHEN a daily record is updated, THE System SHALL increment the version number
4. WHEN a daily record is updated, THE System SHALL update the updatedAt and updatedBy audit fields
5. THE System SHALL validate all fields according to the same rules as creation

### Requirement 15: Daily Record Deletion

**User Story:** As an admin user, I want to delete daily records, so that I can remove incorrect or test data.

#### Acceptance Criteria

1. WHEN an admin user deletes a daily record, THE System SHALL mark it as deleted (soft delete)
2. WHEN a non-admin user attempts to delete a daily record, THE System SHALL prevent the operation
3. WHEN a daily record is deleted, THE System SHALL set isDeleted to true and record deletedAt and deletedBy
4. WHEN listing daily records, THE System SHALL exclude deleted records
5. WHEN a user confirms deletion, THE System SHALL navigate to the daily records list view

### Requirement 16: Form Validation

**User Story:** As a user, I want clear validation messages when I enter invalid data, so that I can correct errors before submitting.

#### Acceptance Criteria

1. WHEN required fields are empty, THE System SHALL display field-specific error messages in Portuguese
2. WHEN time formats are invalid, THE System SHALL display format error messages
3. WHEN end time is before start time (same day), THE System SHALL display a validation error
4. WHEN break time exceeds work duration, THE System SHALL display a validation error
5. THE System SHALL prevent form submission when validation errors exist

### Requirement 17: Mobile Optimization

**User Story:** As a mobile user, I want the daily records interface to work well on my phone, so that I can track activities while in the field.

#### Acceptance Criteria

1. THE System SHALL ensure all touch targets are minimum 44px in height and width
2. WHEN displaying on mobile devices, THE System SHALL use mobile-optimized input types (time, number)
3. WHEN displaying activity cards on mobile, THE System SHALL stack them vertically
4. THE System SHALL use responsive design that adapts from mobile (320px) to desktop (1280px+)
5. WHEN adding or removing activities on mobile, THE System SHALL provide touch-friendly buttons

### Requirement 18: Relation Resolution

**User Story:** As a user, I want to see information about linked work sheets and remote assistance records, so that I can understand the context of each activity.

#### Acceptance Criteria

1. WHEN a daily record is retrieved, THE System SHALL resolve all activity relations (work sheets and remote assistance)
2. WHEN a relation exists, THE System SHALL include basic information from the related content
3. WHEN a relation cannot be resolved (404), THE System SHALL return a structured error object
4. WHEN relation resolution fails (500), THE System SHALL return a structured error object
5. THE System SHALL display resolved relations using the RelationInfoDisplay component

### Requirement 19: Data Persistence

**User Story:** As a user, I want my daily records to be saved reliably, so that I don't lose my work.

#### Acceptance Criteria

1. WHEN a daily record is created, THE System SHALL store it in R2 storage at content/daily-records/{uuid}.json
2. WHEN a daily record is updated, THE System SHALL overwrite the existing file with updated data
3. WHEN daily records are created or updated, THE System SHALL update the daily-records-index.json file
4. THE System SHALL ensure all data is stored in valid JSON format
5. THE System SHALL maintain data integrity through proper error handling during storage operations

### Requirement 20: Audit Trail Visibility

**User Story:** As an admin user, I want to view the complete audit trail of daily records, so that I can track who created and modified records.

#### Acceptance Criteria

1. WHEN an admin user views a daily record detail, THE System SHALL display the Histórico (audit trail) section
2. WHEN a non-admin user views a daily record detail, THE System SHALL hide the Histórico section
3. WHEN displaying audit trail, THE System SHALL show created by, created at, updated by, and updated at information
4. WHEN displaying user information in audit trail, THE System SHALL show user email addresses when available
5. THE System SHALL display "Sistema" for system-generated actions
