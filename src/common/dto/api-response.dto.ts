export class ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode: number;
  timestamp: string;

  constructor(
    data: T,
    message: string = 'Success',
    success: boolean = true,
    statusCode: number = 200,
  ) {
    this.success = success;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
  }
}

export class PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  statusCode: number;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  timestamp: string;

  constructor(
    data: T[],
    total: number,
    limit: number,
    offset: number,
    message: string = 'Success',
    statusCode: number = 200,
  ) {
    this.success = true;
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
    this.pagination = {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
    this.timestamp = new Date().toISOString();
  }
}

