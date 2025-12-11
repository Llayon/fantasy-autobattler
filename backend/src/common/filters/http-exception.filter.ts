/**
 * HTTP Exception Filter for Fantasy Autobattler.
 * Provides unified error response format and logging across all endpoints.
 * 
 * @fileoverview Global exception filter that catches all HTTP exceptions,
 * formats them consistently, logs errors with context, and hides sensitive
 * information in production environment.
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
/**
 * Interface for authenticated requests with player information.
 */
interface AuthenticatedRequest {
  /** Request URL */
  url: string;
  /** HTTP method */
  method: string;
  /** Client IP address */
  ip: string;
  /** Get header function */
  get: (header: string) => string | undefined;
  /** Player information from authentication */
  player?: {
    /** Player ID */
    id: string;
  };
  /** Correlation ID for request tracing */
  correlationId?: string;
}

/**
 * Interface for HTTP response object.
 */
interface HttpResponse {
  /** Set status code */
  status: (code: number) => HttpResponse;
  /** Send JSON response */
  json: (body: unknown) => HttpResponse;
}

/**
 * Standardized error response format.
 * Ensures consistent error structure across all API endpoints.
 */
export interface ErrorResponse {
  /** HTTP status code */
  statusCode: number;
  /** Error message describing what went wrong */
  message: string;
  /** Error type identifier */
  error: string;
  /** Timestamp when the error occurred */
  timestamp: string;
  /** API endpoint path where the error occurred */
  path: string;
  /** Stack trace (only in development) */
  stack?: string | undefined;
}

/**
 * Global HTTP exception filter that catches all exceptions.
 * Provides unified error formatting, logging, and security.
 * 
 * Features:
 * - Consistent error response format
 * - Structured logging with context
 * - Stack trace hiding in production
 * - Request correlation tracking
 * - Player context logging
 * 
 * @example
 * // Automatically applied to all controllers
 * // Returns standardized error format:
 * {
 *   "statusCode": 404,
 *   "message": "Team not found",
 *   "error": "Not Found",
 *   "timestamp": "2025-12-11T14:30:00.000Z",
 *   "path": "/team/invalid-id"
 * }
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  /**
   * Catches and processes HTTP exceptions.
   * Formats error response and logs with context.
   * 
   * @param exception - The caught HTTP exception
   * @param host - Arguments host containing request/response
   */
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<HttpResponse>();
    const request = ctx.getRequest<AuthenticatedRequest>();
    
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();
    
    // Extract error message and details
    const message = typeof exceptionResponse === 'string' 
      ? exceptionResponse 
      : (exceptionResponse as { message?: string })?.message || exception.message;
    
    const error = typeof exceptionResponse === 'string'
      ? this.getErrorNameFromStatus(status)
      : (exceptionResponse as { error?: string })?.error || this.getErrorNameFromStatus(status);

    // Create standardized error response
    const errorResponse: ErrorResponse = {
      statusCode: status,
      message: Array.isArray(message) ? message.join(', ') : message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Add stack trace in development environment
    if (process.env['NODE_ENV'] !== 'production') {
      errorResponse.stack = exception.stack;
    }

    // Log error with context for debugging and monitoring
    this.logError(exception, request, status);

    // Send formatted error response
    response.status(status).json(errorResponse);
  }

  /**
   * Logs error with comprehensive context information.
   * Includes player ID, correlation ID, and request details.
   * 
   * @param exception - The caught exception
   * @param request - The HTTP request object
   * @param status - HTTP status code
   */
  private logError(
    exception: HttpException,
    request: AuthenticatedRequest,
    status: number,
  ): void {
    const logContext = {
      statusCode: status,
      method: request.method,
      url: request.url,
      userAgent: request.get('User-Agent'),
      ip: request.ip,
      playerId: request.player?.id,
      correlationId: request.correlationId,
      error: exception.message,
      stack: exception.stack,
    };

    // Log as error for 5xx status codes, warn for 4xx
    if (status >= 500) {
      this.logger.error(`Internal server error occurred`, logContext);
    } else if (status >= 400) {
      this.logger.warn(`Client error occurred`, logContext);
    } else {
      this.logger.log(`HTTP exception occurred`, logContext);
    }
  }

  /**
   * Maps HTTP status codes to standard error names.
   * Provides consistent error type identification.
   * 
   * @param status - HTTP status code
   * @returns Standard error name
   */
  private getErrorNameFromStatus(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Unprocessable Entity';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error';
      case HttpStatus.BAD_GATEWAY:
        return 'Bad Gateway';
      case HttpStatus.SERVICE_UNAVAILABLE:
        return 'Service Unavailable';
      default:
        return 'HTTP Exception';
    }
  }
}