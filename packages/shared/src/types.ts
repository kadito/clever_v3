// Type definitions will be added in subsequent tasks
export interface BaseContent {
  uuid: string;
  contentType: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  version: number;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  data: Record<string, any>;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ListResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// Content type definitions
export type ContentType = 
  | 'clients'
  | 'contracts'
  | 'licenses'
  | 'work-sheets'
  | 'daily-records'
  | 'remote-assistance'
  | 'reminders'
  | 'pending';

// Request types
export type CreateContentRequest<T extends BaseContent> = Omit<
  T,
  | 'uuid'
  | 'createdAt'
  | 'createdBy'
  | 'updatedAt'
  | 'updatedBy'
  | 'version'
  | 'isDeleted'
>;

export type UpdateContentRequest<T extends BaseContent> = Partial<Pick<T, 'data'>>;
