import { describe, it, expect } from 'vitest';
import type {
  BaseContent,
  ApiResponse,
  ListResponse,
  ContentType,
  CreateContentRequest,
  UpdateContentRequest,
  UserContext,
  AuthenticatedContext,
  UserType,
} from './types.js';
import { USER_TYPE_DISPLAY_NAMES } from './types.js';

describe('BaseContent interface', () => {
  it('should have all required properties with correct types', () => {
    const mockBaseContent: BaseContent = {
      uuid: 'test-uuid-123',
      contentType: 'clients',
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-123',
      updatedAt: '2024-01-01T00:00:00Z',
      updatedBy: 'user-123',
      version: 1,
      isDeleted: false,
      data: { name: 'Test Content' },
    };

    // Type assertions to ensure structure is correct
    expect(typeof mockBaseContent.uuid).toBe('string');
    expect(typeof mockBaseContent.contentType).toBe('string');
    expect(typeof mockBaseContent.createdAt).toBe('string');
    expect(typeof mockBaseContent.createdBy).toBe('string');
    expect(typeof mockBaseContent.updatedAt).toBe('string');
    expect(typeof mockBaseContent.updatedBy).toBe('string');
    expect(typeof mockBaseContent.version).toBe('number');
    expect(typeof mockBaseContent.isDeleted).toBe('boolean');
    expect(typeof mockBaseContent.data).toBe('object');
  });

  it('should allow optional deletedAt and deletedBy properties', () => {
    const mockDeletedContent: BaseContent = {
      uuid: 'test-uuid-123',
      contentType: 'clients',
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-123',
      updatedAt: '2024-01-01T00:00:00Z',
      updatedBy: 'user-123',
      version: 1,
      isDeleted: true,
      deletedAt: '2024-01-02T00:00:00Z',
      deletedBy: 'admin-456',
      data: { name: 'Deleted Content' },
    };

    expect(mockDeletedContent.deletedAt).toBe('2024-01-02T00:00:00Z');
    expect(mockDeletedContent.deletedBy).toBe('admin-456');
  });

  it('should work without optional properties', () => {
    const mockContent: BaseContent = {
      uuid: 'test-uuid-123',
      contentType: 'contracts',
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-123',
      updatedAt: '2024-01-01T00:00:00Z',
      updatedBy: 'user-123',
      version: 1,
      isDeleted: false,
      data: { title: 'Test Contract' },
    };

    expect(mockContent.deletedAt).toBeUndefined();
    expect(mockContent.deletedBy).toBeUndefined();
  });
});

describe('ApiResponse interface', () => {
  it('should have correct structure for successful response', () => {
    const successResponse: ApiResponse<string> = {
      success: true,
      data: 'test data',
      timestamp: '2024-01-01T00:00:00Z',
    };

    expect(successResponse.success).toBe(true);
    expect(successResponse.data).toBe('test data');
    expect(typeof successResponse.timestamp).toBe('string');
    expect(successResponse.error).toBeUndefined();
  });

  it('should have correct structure for error response', () => {
    const errorResponse: ApiResponse<never> = {
      success: false,
      error: 'Something went wrong',
      timestamp: '2024-01-01T00:00:00Z',
    };

    expect(errorResponse.success).toBe(false);
    expect(errorResponse.error).toBe('Something went wrong');
    expect(typeof errorResponse.timestamp).toBe('string');
    expect(errorResponse.data).toBeUndefined();
  });

  it('should work with generic types', () => {
    interface TestData {
      id: number;
      name: string;
    }

    const typedResponse: ApiResponse<TestData> = {
      success: true,
      data: { id: 1, name: 'Test' },
      timestamp: '2024-01-01T00:00:00Z',
    };

    expect(typedResponse.data?.id).toBe(1);
    expect(typedResponse.data?.name).toBe('Test');
  });
});

describe('ListResponse interface', () => {
  it('should extend ApiResponse with pagination', () => {
    const listResponse: ListResponse<BaseContent> = {
      success: true,
      data: [
        {
          uuid: 'test-1',
          contentType: 'clients',
          createdAt: '2024-01-01T00:00:00Z',
          createdBy: 'user-123',
          updatedAt: '2024-01-01T00:00:00Z',
          updatedBy: 'user-123',
          version: 1,
          isDeleted: false,
          data: { name: 'Client 1' },
        },
      ],
      pagination: {
        page: 1,
        limit: 10,
        total: 1,
      },
      timestamp: '2024-01-01T00:00:00Z',
    };

    expect(Array.isArray(listResponse.data)).toBe(true);
    expect(listResponse.pagination.page).toBe(1);
    expect(listResponse.pagination.limit).toBe(10);
    expect(listResponse.pagination.total).toBe(1);
  });

  it('should work with empty data array', () => {
    const emptyListResponse: ListResponse<BaseContent> = {
      success: true,
      data: [],
      pagination: {
        page: 1,
        limit: 10,
        total: 0,
      },
      timestamp: '2024-01-01T00:00:00Z',
    };

    expect(emptyListResponse.data).toEqual([]);
    expect(emptyListResponse.pagination.total).toBe(0);
  });
});

describe('ContentType union type', () => {
  it('should include all expected content types', () => {
    const validTypes: ContentType[] = [
      'clients',
      'contracts',
      'licenses',
      'work-sheets',
      'daily-records',
      'remote-assistance',
      'reminders',
      'pending',
    ];

    // Test that each type is valid
    validTypes.forEach(type => {
      const testType: ContentType = type;
      expect(typeof testType).toBe('string');
    });
  });

  it('should be used in BaseContent contentType field', () => {
    const clientContent: BaseContent = {
      uuid: 'test-uuid',
      contentType: 'clients' as ContentType,
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'user-123',
      updatedAt: '2024-01-01T00:00:00Z',
      updatedBy: 'user-123',
      version: 1,
      isDeleted: false,
      data: {},
    };

    expect(clientContent.contentType).toBe('clients');
  });
});

describe('CreateContentRequest type', () => {
  it('should omit audit fields from BaseContent', () => {
    interface TestContent extends BaseContent {
      data: {
        name: string;
        description: string;
      };
    }

    const createRequest: CreateContentRequest<TestContent> = {
      contentType: 'clients',
      data: {
        name: 'New Client',
        description: 'A test client',
      },
    };

    // Should have contentType and data
    expect(createRequest.contentType).toBe('clients');
    expect(createRequest.data.name).toBe('New Client');
    expect(createRequest.data.description).toBe('A test client');

    // Should not have audit fields (TypeScript compilation ensures this)
    // These properties should not exist on the type
    const requestAsAny = createRequest as any;
    expect(requestAsAny.uuid).toBeUndefined();
    expect(requestAsAny.createdAt).toBeUndefined();
    expect(requestAsAny.createdBy).toBeUndefined();
    expect(requestAsAny.updatedAt).toBeUndefined();
    expect(requestAsAny.updatedBy).toBeUndefined();
    expect(requestAsAny.version).toBeUndefined();
    expect(requestAsAny.isDeleted).toBeUndefined();
  });
});

describe('UpdateContentRequest type', () => {
  it('should only include partial data field', () => {
    interface TestContent extends BaseContent {
      data: {
        name: string;
        description: string;
        status: string;
      };
    }

    const updateRequest: UpdateContentRequest<TestContent> = {
      data: {
        name: 'Updated Name',
        // description and status are optional due to Partial<>
      },
    };

    expect(updateRequest.data?.name).toBe('Updated Name');

    // Should not have other BaseContent fields
    const requestAsAny = updateRequest as any;
    expect(requestAsAny.uuid).toBeUndefined();
    expect(requestAsAny.contentType).toBeUndefined();
    expect(requestAsAny.createdAt).toBeUndefined();
  });

  it('should allow empty data object', () => {
    interface TestContent extends BaseContent {
      data: {
        name: string;
      };
    }

    const emptyUpdateRequest: UpdateContentRequest<TestContent> = {
      data: {},
    };

    expect(emptyUpdateRequest.data).toEqual({});
  });

  it('should allow undefined data', () => {
    interface TestContent extends BaseContent {
      data: {
        name: string;
      };
    }

    const undefinedUpdateRequest: UpdateContentRequest<TestContent> = {};

    expect(undefinedUpdateRequest.data).toBeUndefined();
  });
});

describe('Type exports', () => {
  it('should export all types correctly', () => {
    // This test ensures all types are properly exported and can be imported
    // The fact that we can import and use them in the tests above proves they're exported

    // Test that we can create instances of each type
    const baseContent: BaseContent = {
      uuid: 'test',
      contentType: 'clients',
      createdAt: '2024-01-01T00:00:00Z',
      createdBy: 'user',
      updatedAt: '2024-01-01T00:00:00Z',
      updatedBy: 'user',
      version: 1,
      isDeleted: false,
      data: {},
    };

    const apiResponse: ApiResponse<string> = {
      success: true,
      data: 'test',
      timestamp: '2024-01-01T00:00:00Z',
    };

    const listResponse: ListResponse<BaseContent> = {
      success: true,
      data: [baseContent],
      pagination: { page: 1, limit: 10, total: 1 },
      timestamp: '2024-01-01T00:00:00Z',
    };

    const contentType: ContentType = 'clients';

    expect(baseContent).toBeDefined();
    expect(apiResponse).toBeDefined();
    expect(listResponse).toBeDefined();
    expect(contentType).toBeDefined();
  });
});

describe('UserContext interface', () => {
  it('should have all required properties with correct types', () => {
    const mockUserContext: UserContext = {
      userId: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      userType: 'User',
      sessionId: 'session-123',
      isAuthenticated: true,
    };

    expect(typeof mockUserContext.userId).toBe('string');
    expect(typeof mockUserContext.email).toBe('string');
    expect(typeof mockUserContext.firstName).toBe('string');
    expect(typeof mockUserContext.lastName).toBe('string');
    expect(typeof mockUserContext.userType).toBe('string');
    expect(typeof mockUserContext.sessionId).toBe('string');
    expect(typeof mockUserContext.isAuthenticated).toBe('boolean');
  });

  it('should support Admin user type', () => {
    const adminUser: UserContext = {
      userId: 'admin-123',
      email: 'admin@example.com',
      firstName: 'Admin',
      lastName: 'User',
      userType: 'Admin',
      sessionId: 'session-123',
      isAuthenticated: true,
    };

    expect(adminUser.userType).toBe('Admin');
  });

  it('should support User user type', () => {
    const regularUser: UserContext = {
      userId: 'user-123',
      email: 'user@example.com',
      firstName: 'Regular',
      lastName: 'User',
      userType: 'User',
      sessionId: 'session-123',
      isAuthenticated: true,
    };

    expect(regularUser.userType).toBe('User');
  });
});

describe('AuthenticatedContext interface', () => {
  it('should contain user context and allow additional properties', () => {
    const mockUserContext: UserContext = {
      userId: 'user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      userType: 'User',
      sessionId: 'session-123',
      isAuthenticated: true,
    };

    const authContext: AuthenticatedContext = {
      user: mockUserContext,
      additionalProperty: 'test',
    };

    expect(authContext.user).toEqual(mockUserContext);
    expect(authContext.additionalProperty).toBe('test');
  });
});

describe('UserType type', () => {
  it('should include Admin and User types', () => {
    const adminType: UserType = 'Admin';
    const userType: UserType = 'User';

    expect(adminType).toBe('Admin');
    expect(userType).toBe('User');
  });
});

describe('USER_TYPE_DISPLAY_NAMES constant', () => {
  it('should provide Portuguese display names for user types', () => {
    expect(USER_TYPE_DISPLAY_NAMES.Admin).toBe('Administrador');
    expect(USER_TYPE_DISPLAY_NAMES.User).toBe('Utilizador');
  });

  it('should have entries for all user types', () => {
    const userTypes: UserType[] = ['Admin', 'User'];
    
    userTypes.forEach(type => {
      expect(USER_TYPE_DISPLAY_NAMES[type]).toBeDefined();
      expect(typeof USER_TYPE_DISPLAY_NAMES[type]).toBe('string');
    });
  });
});
