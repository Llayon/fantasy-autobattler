/**
 * Test suite for LoggingInterceptor.
 * Tests HTTP request logging, correlation ID generation, and performance metrics.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor, getCorrelationId } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockLogger: jest.Mocked<Logger>;

  // Helper function to safely get log call data
  const getLogCallData = (mockLogger: jest.Mocked<Logger>, callIndex = 0): any => {
    const logCalls = mockLogger.log.mock.calls;
    if (logCalls.length <= callIndex) {
      throw new Error(`Expected at least ${callIndex + 1} log calls, but got ${logCalls.length}`);
    }
    const logCall = logCalls[callIndex];
    if (!logCall || logCall.length < 2) {
      throw new Error('Log call not found or invalid structure');
    }
    return logCall[1];
  };

  // Mock request and response objects
  const mockRequest = {
    method: 'POST',
    url: '/team',
    ip: '127.0.0.1',
    get: jest.fn(),
    correlationId: undefined,
  };

  const mockResponse = {
    statusCode: 201,
    setHeader: jest.fn(),
  };

  const mockExecutionContext = {
    getType: jest.fn(),
    switchToHttp: jest.fn(),
  } as unknown as ExecutionContext;

  const mockCallHandler = {
    handle: jest.fn(),
  } as unknown as CallHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingInterceptor],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);
    
    // Mock the logger
    mockLogger = {
      debug: jest.fn(),
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      verbose: jest.fn(),
    } as any;

    // Replace the private logger with our mock
    (interceptor as any).logger = mockLogger;

    // Reset mocks
    jest.clearAllMocks();
    mockRequest.get.mockReturnValue('Test-Agent/1.0');
    mockRequest.correlationId = undefined;
    
    (mockExecutionContext.getType as jest.Mock).mockReturnValue('http');
    (mockExecutionContext.switchToHttp as jest.Mock).mockReturnValue({
      getRequest: () => mockRequest,
      getResponse: () => mockResponse,
    });
  });

  describe('intercept', () => {
    it('should skip non-HTTP contexts', (done) => {
      (mockExecutionContext.getType as jest.Mock).mockReturnValue('ws');
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of('test'));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockLogger.debug).not.toHaveBeenCalled();
        expect(mockLogger.log).not.toHaveBeenCalled();
        done();
      });
    });

    it('should generate correlation ID and add to request', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ success: true }));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockRequest.correlationId).toBeDefined();
        expect(typeof mockRequest.correlationId).toBe('string');
        expect(mockRequest.correlationId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        done();
      });
    });

    it('should add correlation ID to response headers', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ success: true }));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockResponse.setHeader).toHaveBeenCalledWith('X-Correlation-ID', expect.any(String));
        done();
      });
    });

    it('should log incoming request with debug level', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ success: true }));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockLogger.debug).toHaveBeenCalledWith('Incoming request', {
          method: 'POST',
          url: '/team',
          ip: '127.0.0.1',
          userAgent: 'Test-Agent/1.0',
          correlationId: expect.any(String),
          timestamp: expect.any(String),
        });
        done();
      });
    });

    it('should log successful response with info level', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ teams: ['team1', 'team2'] }));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockLogger.log).toHaveBeenCalledWith('Request completed', {
          method: 'POST',
          url: '/team',
          statusCode: 201,
          duration: expect.stringMatching(/^\d+ms$/),
          correlationId: expect.any(String),
          responseSize: expect.any(String),
          timestamp: expect.any(String),
        });
        done();
      });
    });

    it('should log error response with error level', (done) => {
      const testError = new Error('Test error');
      (testError as any).status = 400;
      (mockCallHandler.handle as jest.Mock).mockReturnValue(throwError(() => testError));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          expect(mockLogger.error).toHaveBeenCalledWith('Request failed', {
            method: 'POST',
            url: '/team',
            statusCode: 400,
            duration: expect.stringMatching(/^\d+ms$/),
            correlationId: expect.any(String),
            error: 'Test error',
            stack: expect.any(String),
            timestamp: expect.any(String),
          });
          done();
        },
      });
    });

    it('should handle error without status code', (done) => {
      const testError = new Error('Test error');
      (mockCallHandler.handle as jest.Mock).mockReturnValue(throwError(() => testError));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          expect(mockLogger.error).toHaveBeenCalledWith('Request failed', expect.objectContaining({
            statusCode: 500, // Default status code
          }));
          done();
        },
      });
    });

    it('should handle missing User-Agent header', (done) => {
      mockRequest.get.mockReturnValue(undefined);
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ success: true }));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockLogger.debug).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
          userAgent: 'Unknown',
        }));
        done();
      });
    });

    it('should measure request duration accurately', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ success: true }));

      const startTime = Date.now();
      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        const endTime = Date.now();
        expect(mockLogger.log).toHaveBeenCalled();
        const logData = getLogCallData(mockLogger);
        const duration = parseInt(logData.duration.replace('ms', ''));
        
        expect(duration).toBeGreaterThanOrEqual(0);
        expect(duration).toBeLessThan(endTime - startTime + 10); // Allow small margin
        done();
      });
    });
  });

  describe('getResponseSize', () => {
    it('should calculate size for small responses in bytes', (done) => {
      const smallData = { id: '123' };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(smallData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockLogger.log).toHaveBeenCalled();
        const logData = getLogCallData(mockLogger);
        expect(logData.responseSize).toMatch(/^\d+B$/);
        done();
      });
    });

    it('should calculate size for medium responses in KB', (done) => {
      const largeData = { data: 'x'.repeat(2000) };
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(largeData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockLogger.log).toHaveBeenCalled();
        const logData = getLogCallData(mockLogger);
        expect(logData.responseSize).toMatch(/^\d+\.\d+KB$/);
        done();
      });
    });

    it('should handle null response data', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(null));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockLogger.log).toHaveBeenCalled();
        const logData = getLogCallData(mockLogger);
        expect(logData.responseSize).toBe('0B');
        done();
      });
    });

    it('should handle undefined response data', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(undefined));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockLogger.log).toHaveBeenCalled();
        const logData = getLogCallData(mockLogger);
        expect(logData.responseSize).toBe('0B');
        done();
      });
    });

    it('should handle circular reference in response data', (done) => {
      const circularData: any = { name: 'test' };
      circularData.self = circularData;
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(circularData));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockLogger.log).toHaveBeenCalled();
        const logData = getLogCallData(mockLogger);
        expect(logData.responseSize).toBe('unknown');
        done();
      });
    });
  });

  describe('getCorrelationId utility', () => {
    it('should return correlation ID from request', () => {
      const testRequest = { correlationId: 'test-123' } as any;
      const result = getCorrelationId(testRequest);
      expect(result).toBe('test-123');
    });

    it('should return undefined if no correlation ID', () => {
      const testRequest = {} as any;
      const result = getCorrelationId(testRequest);
      expect(result).toBeUndefined();
    });

    it('should handle null request', () => {
      const result = getCorrelationId(null as any);
      expect(result).toBeUndefined();
    });
  });

  describe('correlation ID generation', () => {
    it('should generate unique correlation IDs', (done) => {
      const correlationIds = new Set<string>();
      let completedRequests = 0;
      const totalRequests = 5;

      for (let i = 0; i < totalRequests; i++) {
        (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ success: true }));
        
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
          correlationIds.add(mockRequest.correlationId!);
          completedRequests++;
          
          if (completedRequests === totalRequests) {
            expect(correlationIds.size).toBe(totalRequests);
            done();
          }
        });
      }
    });

    it('should generate valid UUID v4 format', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ success: true }));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        const correlationId = mockRequest.correlationId!;
        
        // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
        const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        expect(correlationId).toMatch(uuidV4Regex);
        done();
      });
    });
  });

  describe('performance and edge cases', () => {
    it('should handle very fast requests', (done) => {
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ success: true }));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockLogger.log).toHaveBeenCalled();
        const logData = getLogCallData(mockLogger);
        const duration = parseInt(logData.duration.replace('ms', ''));
        expect(duration).toBeGreaterThanOrEqual(0);
        done();
      });
    });

    it('should handle requests with special characters in URL', (done) => {
      mockRequest.url = '/team?name=тест&id=123';
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of({ success: true }));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockLogger.debug).toHaveBeenCalledWith('Incoming request', expect.objectContaining({
          url: '/team?name=тест&id=123',
        }));
        done();
      });
    });

    it('should handle very large response data', (done) => {
      const largeArray = Array(10000).fill({ id: 'test', data: 'x'.repeat(100) });
      (mockCallHandler.handle as jest.Mock).mockReturnValue(of(largeArray));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe(() => {
        expect(mockLogger.log).toHaveBeenCalled();
        const logData = getLogCallData(mockLogger);
        expect(logData.responseSize).toMatch(/^\d+\.\d+MB$/);
        done();
      });
    });
  });
});