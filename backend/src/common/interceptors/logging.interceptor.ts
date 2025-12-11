/**
 * Logging Interceptor for Fantasy Autobattler API.
 * Provides structured request/response logging with correlation IDs for tracing.
 * 
 * @fileoverview HTTP request logging interceptor with performance metrics,
 * correlation ID generation, and environment-aware log levels.
 */

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

/**
 * Extended request interface with correlation ID for tracing.
 */
interface RequestWithCorrelation {
  /** HTTP method (GET, POST, etc.) */
  method: string;
  /** Request URL path */
  url: string;
  /** Client IP address */
  ip: string;
  /** Unique correlation ID for request tracing */
  correlationId?: string;
  /** Get header value by name */
  get(name: string): string | undefined;
}

/**
 * HTTP response interface for setting headers.
 */
interface ResponseWithHeaders {
  /** HTTP status code */
  statusCode: number;
  /** Set response header */
  setHeader(name: string, value: string): void;
}

/**
 * HTTP request logging interceptor.
 * Logs all incoming requests and outgoing responses with performance metrics.
 * Generates correlation IDs for distributed tracing across services.
 * 
 * Features:
 * - Request/response logging with timing
 * - Correlation ID generation and propagation
 * - Environment-aware log levels (debug for dev, info for prod)
 * - Structured logging with consistent format
 * - Error context preservation
 * 
 * @example
 * // Register globally in main.ts
 * app.useGlobalInterceptors(new LoggingInterceptor());
 * 
 * // Or use on specific controllers
 * @UseInterceptors(LoggingInterceptor)
 * @Controller('api')
 * export class ApiController {}
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  /**
   * Intercepts HTTP requests to provide structured logging.
   * Generates correlation IDs and logs request/response details.
   * 
   * @param context - Execution context containing request/response
   * @param next - Call handler for continuing request processing
   * @returns Observable with logging side effects
   * @example
   * // Automatically called by NestJS for each HTTP request
   * // Logs: [LoggingInterceptor] POST /team 201 - 45ms [correlation-id-123]
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithCorrelation>();
    const response = context.switchToHttp().getResponse<ResponseWithHeaders>();
    
    // Generate correlation ID for request tracing
    const correlationId = this.generateCorrelationId();
    request.correlationId = correlationId;
    
    // Add correlation ID to response headers for client tracing
    response.setHeader('X-Correlation-ID', correlationId);

    const startTime = Date.now();
    const { method, url, ip } = request;
    const userAgent = request.get('User-Agent') || 'Unknown';

    // Log incoming request (debug level for development)
    this.logger.debug(`Incoming request`, {
      method,
      url,
      ip,
      userAgent,
      correlationId,
      timestamp: new Date().toISOString(),
    });

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          const { statusCode } = response;

          // Log successful response (info level for production)
          this.logger.log(`Request completed`, {
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            correlationId,
            responseSize: this.getResponseSize(data),
            timestamp: new Date().toISOString(),
          });
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          const statusCode = error.status || 500;

          // Log error response with full context
          this.logger.error(`Request failed`, {
            method,
            url,
            statusCode,
            duration: `${duration}ms`,
            correlationId,
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
          });
        },
      }),
    );
  }

  /**
   * Generates unique correlation ID for request tracing.
   * Uses UUID v4 for guaranteed uniqueness across distributed systems.
   * 
   * @returns Unique correlation ID string
   * @example
   * const id = this.generateCorrelationId();
   * // Returns: "550e8400-e29b-41d4-a716-446655440000"
   */
  private generateCorrelationId(): string {
    return uuidv4();
  }

  /**
   * Calculates response payload size for performance monitoring.
   * Handles different response types (objects, arrays, strings).
   * 
   * @param data - Response data to measure
   * @returns Response size in bytes or 'unknown' if unmeasurable
   * @example
   * const size = this.getResponseSize({ teams: [...] });
   * // Returns: "1.2KB" or "unknown"
   */
  private getResponseSize(data: unknown): string {
    try {
      if (data === null || data === undefined) {
        return '0B';
      }

      const jsonString = JSON.stringify(data);
      const bytes = Buffer.byteLength(jsonString, 'utf8');
      
      if (bytes < 1024) {
        return `${bytes}B`;
      } else if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(1)}KB`;
      } else {
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
      }
    } catch (error) {
      return 'unknown';
    }
  }
}

/**
 * Utility function to get correlation ID from request.
 * Used by services and other components for consistent logging.
 * 
 * @param request - HTTP request object
 * @returns Correlation ID or undefined if not available
 * @example
 * const correlationId = getCorrelationId(req);
 * this.logger.log('Processing team creation', { correlationId });
 */
export function getCorrelationId(request: RequestWithCorrelation | null | undefined): string | undefined {
  return request?.correlationId;
}