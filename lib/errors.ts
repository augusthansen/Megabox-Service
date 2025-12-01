import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * API Error Handling Utilities
 *
 * Provides consistent error responses across all API routes
 */

// Standard error codes
export const ErrorCodes = {
  BAD_REQUEST: "BAD_REQUEST",
  UNAUTHORIZED: "UNAUTHORIZED",
  FORBIDDEN: "FORBIDDEN",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// Error response structure
interface ApiErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

// Create standardized error response
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        ...(details && { details }),
      },
    },
    { status }
  );
}

// Common error responses
export const ApiErrors = {
  badRequest: (message: string, details?: Record<string, unknown>) =>
    createErrorResponse(ErrorCodes.BAD_REQUEST, message, 400, details),

  unauthorized: (message = "Authentication required") =>
    createErrorResponse(ErrorCodes.UNAUTHORIZED, message, 401),

  forbidden: (message = "Access denied") =>
    createErrorResponse(ErrorCodes.FORBIDDEN, message, 403),

  notFound: (resource = "Resource") =>
    createErrorResponse(ErrorCodes.NOT_FOUND, `${resource} not found`, 404),

  conflict: (message: string) =>
    createErrorResponse(ErrorCodes.CONFLICT, message, 409),

  validationError: (message: string, details?: Record<string, unknown>) =>
    createErrorResponse(ErrorCodes.VALIDATION_ERROR, message, 400, details),

  internalError: (message = "An unexpected error occurred") =>
    createErrorResponse(ErrorCodes.INTERNAL_ERROR, message, 500),

  serviceUnavailable: (message = "Service temporarily unavailable") =>
    createErrorResponse(ErrorCodes.SERVICE_UNAVAILABLE, message, 503),

  databaseUnavailable: () =>
    createErrorResponse(
      ErrorCodes.SERVICE_UNAVAILABLE,
      "Database connection unavailable",
      503
    ),
};

// Handle Zod validation errors
export function handleZodError(error: ZodError): NextResponse<ApiErrorResponse> {
  const firstError = error.errors[0];
  const details: Record<string, string[]> = {};

  for (const err of error.errors) {
    const path = err.path.join(".");
    if (!details[path]) {
      details[path] = [];
    }
    details[path].push(err.message);
  }

  return ApiErrors.validationError(firstError.message, { fields: details });
}

// Safe error handler wrapper for API routes
export async function withErrorHandler<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse<ApiErrorResponse>> {
  try {
    return await handler();
  } catch (error) {
    console.error("API Error:", error);

    if (error instanceof ZodError) {
      return handleZodError(error);
    }

    if (error instanceof Error) {
      // Check for known Prisma errors
      if (error.message.includes("Record to update not found")) {
        return ApiErrors.notFound();
      }
      if (error.message.includes("Unique constraint")) {
        return ApiErrors.conflict("A record with this value already exists");
      }
    }

    return ApiErrors.internalError();
  }
}

// Custom API Error class
export class ApiError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }

  toResponse(): NextResponse<ApiErrorResponse> {
    return createErrorResponse(this.code, this.message, this.status, this.details);
  }
}
