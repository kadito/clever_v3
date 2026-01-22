/**
 * Technician Auto-Assignment Utility Functions
 * 
 * This module provides utility functions for automatically assigning technician data
 * to content during create/update operations based on the authenticated user context.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

import type { UserContext, TechnicianUser } from '@clever/shared';

/**
 * Extract TechnicianUser object from UserContext
 * 
 * Converts the authenticated user context into a TechnicianUser object
 * suitable for assignment to content technician fields.
 * 
 * @param userContext - The authenticated user context from Clerk
 * @returns TechnicianUser object with user information
 * @throws Error if userContext is invalid or missing required fields
 * 
 * Requirements: 1.1, 1.2, 1.3
 */
export function extractTechnicianUser(userContext: UserContext): TechnicianUser {
  if (!userContext) {
    throw new Error('User context is required for technician assignment');
  }

  if (!userContext.isAuthenticated) {
    throw new Error('User must be authenticated for technician assignment');
  }

  if (!userContext.userId) {
    throw new Error('User ID is required for technician assignment');
  }

  // Create TechnicianUser object from UserContext
  const technicianUser: TechnicianUser = {
    userId: userContext.userId,
    email: userContext.email || '',
    firstName: userContext.firstName || '',
    lastName: userContext.lastName || '',
    userType: userContext.userType,
  };

  console.log(
    'Extracted technician user:',
    JSON.stringify(technicianUser, null, 2)
  );

  return technicianUser;
}

/**
 * Auto-assign technician data to content during create/update operations
 * 
 * Automatically populates technician fields in content data based on the
 * authenticated user context. Handles both work-sheets and remote-assistance
 * content types with their respective technician field names.
 * 
 * @param data - The content data object to modify
 * @param userContext - The authenticated user context from Clerk
 * @returns Modified data object with technician assignment
 * @throws Error if userContext is invalid or technician extraction fails
 * 
 * Requirements: 1.1, 1.2, 1.3
 */
export function autoAssignTechnician(
  data: Record<string, any>,
  userContext: UserContext
): Record<string, any> {
  if (!data) {
    throw new Error('Content data is required for technician assignment');
  }

  try {
    // Extract technician user from context
    const technicianUser = extractTechnicianUser(userContext);

    // Create a copy of the data to avoid mutations
    const updatedData = { ...data };

    // Auto-assign technician based on content structure
    if (hasWorkSheetTechnicianField(updatedData)) {
      // Work sheets: assign to otherData.technician
      if (!updatedData.otherData) {
        updatedData.otherData = {};
      }
      updatedData.otherData.technician = technicianUser;
      
      console.log(
        'Auto-assigned technician to work sheet:',
        JSON.stringify(
          {
            contentType: 'work-sheets',
            technicianAssigned: technicianUser,
          },
          null,
          2
        )
      );
    }

    if (hasRemoteAssistanceTechnicianField(updatedData)) {
      // Remote assistance: assign to tecnicoResponsavel
      updatedData.tecnicoResponsavel = technicianUser;
      
      console.log(
        'Auto-assigned technician to remote assistance:',
        JSON.stringify(
          {
            contentType: 'remote-assistance',
            technicianAssigned: technicianUser,
          },
          null,
          2
        )
      );
    }

    return updatedData;
  } catch (error) {
    console.error(
      'Error in technician auto-assignment:',
      JSON.stringify(error, null, 2)
    );
    throw new Error(
      `Failed to auto-assign technician: ${
        error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }
}

/**
 * Check if data has work sheet technician field structure
 * 
 * Determines if the content data represents a work sheet that should
 * have technician assignment in the otherData.technician field.
 * 
 * @param data - The content data to check
 * @returns True if data has work sheet structure with technician field
 */
function hasWorkSheetTechnicianField(data: Record<string, any>): boolean {
  // Work sheets have otherData section that should contain technician field
  return (
    typeof data === 'object' &&
    data !== null &&
    (data.otherData !== undefined || data.request !== undefined || data.displacement !== undefined)
  );
}

/**
 * Check if data has remote assistance technician field structure
 * 
 * Determines if the content data represents remote assistance that should
 * have technician assignment in the tecnicoResponsavel field.
 * 
 * @param data - The content data to check
 * @returns True if data has remote assistance structure with technician field
 */
function hasRemoteAssistanceTechnicianField(data: Record<string, any>): boolean {
  // Remote assistance has tecnicoResponsavel field at root level
  return (
    typeof data === 'object' &&
    data !== null &&
    (data.tecnicoResponsavel !== undefined ||
      data.tipoAssistencia !== undefined ||
      data.dataAssistencia !== undefined ||
      data.motivoPedido !== undefined)
  );
}

/**
 * Get display name from TechnicianUser object
 * 
 * Extracts a human-readable display name from a TechnicianUser object
 * for use in UI components and display logic.
 * 
 * @param technicianUser - The TechnicianUser object
 * @returns Display name string (firstName + lastName, or fallback to email)
 */
export function getTechnicianDisplayName(technicianUser: TechnicianUser): string {
  if (!technicianUser) {
    return 'Unknown Technician';
  }

  // Prefer first name + last name combination
  const firstName = technicianUser.firstName?.trim() || '';
  const lastName = technicianUser.lastName?.trim() || '';

  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }

  if (firstName) {
    return firstName;
  }

  if (lastName) {
    return lastName;
  }

  // Fallback to email if no name available
  if (technicianUser.email) {
    return technicianUser.email;
  }

  // Final fallback
  return 'Unknown Technician';
}

/**
 * Validate technician assignment in content data
 * 
 * Validates that technician fields in content data contain proper
 * TechnicianUser objects with required fields.
 * 
 * @param data - The content data to validate
 * @returns Validation result with errors if any
 */
export function validateTechnicianAssignment(data: Record<string, any>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    // Check work sheet technician assignment
    if (hasWorkSheetTechnicianField(data) && data.otherData?.technician) {
      const technicianErrors = validateTechnicianUser(data.otherData.technician, 'otherData.technician');
      errors.push(...technicianErrors);
    }

    // Check remote assistance technician assignment
    if (hasRemoteAssistanceTechnicianField(data) && data.tecnicoResponsavel) {
      const technicianErrors = validateTechnicianUser(data.tecnicoResponsavel, 'tecnicoResponsavel');
      errors.push(...technicianErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`],
    };
  }
}

/**
 * Validate TechnicianUser object structure
 * 
 * @param technician - The technician object to validate
 * @param fieldPath - The field path for error reporting
 * @returns Array of validation errors
 */
function validateTechnicianUser(technician: any, fieldPath: string): string[] {
  const errors: string[] = [];

  if (!technician || typeof technician !== 'object') {
    errors.push(`${fieldPath} must be a valid TechnicianUser object`);
    return errors;
  }

  if (!technician.userId || typeof technician.userId !== 'string') {
    errors.push(`${fieldPath}.userId is required and must be a string`);
  }

  if (technician.email !== undefined && typeof technician.email !== 'string') {
    errors.push(`${fieldPath}.email must be a string if provided`);
  }

  if (technician.firstName !== undefined && typeof technician.firstName !== 'string') {
    errors.push(`${fieldPath}.firstName must be a string if provided`);
  }

  if (technician.lastName !== undefined && typeof technician.lastName !== 'string') {
    errors.push(`${fieldPath}.lastName must be a string if provided`);
  }

  if (!technician.userType || !['Admin', 'User'].includes(technician.userType)) {
    errors.push(`${fieldPath}.userType must be either 'Admin' or 'User'`);
  }

  return errors;
}