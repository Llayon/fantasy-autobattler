/**
 * Test suite for HTTP Exception Filter.
 * Verifies unified error formatting, logging, and security features.
 */

import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, Logger } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { HttpExceptionFilter, ErrorResponse } from './http-exception.filter';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;
  let loggerSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);

    // Mock response object
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mock request object
    mockRequest = {
      url: '/test/endpoint',
      method: 'POST',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('test-user-agent'),
      player: { id: 'test-player-123' },
      correlationId: 'test-correlation-123',
    };

    // Mock ArgumentsHost
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;

    // Spy on logger methods
    loggerSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('catch', () => {
    it('should format error response correctly for string exception', () => {
      const exception = new HttpException('Test error message', HttpStatus.BAD_REQUEST);
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Test error message',
          error: 'Bad Request',
          timestamp: expect.any(String),
          path: '/test/endpoint',
        }),
      );
    });

    it('should format error response correctly for object exception', () => {
      const exceptionResponse = {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Resource not found',
        error: 'Not Found',
      };
      const exception = new HttpException(exceptionResponse, HttpStatus.NOT_FOUND);
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resource not found',
          error: 'Not Found',
          timestamp: expect.any(String),
          path: '/test/endpoint',
        }),
      );
    });

    it('should handle array messages correctly', () => {
      const exceptionResponse = {
        statusCode: HttpStatus.BAD_REQUEST,
        message: ['Field 1 is required', 'Field 2 is invalid'],
        error: 'Validation Error',
      };
      const exception = new HttpException(exceptionResponse, HttpStatus.BAD_REQUEST);
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Field 1 is required, Field 2 is invalid',
        }),
      );
    });

    it('should include stack trace in development environment', () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'development';

      const exception = new HttpException('Test error', HttpStatus.INTERNAL_SERVER_ERROR);
      
      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(responseCall.stack).toBeDefined();

      process.env['NODE_ENV'] = originalEnv;
    });

    it('should hide stack trace in production environment', () => {
      const originalEnv = process.env['NODE_ENV'];
      process.env['NODE_ENV'] = 'production';

      const exception = new HttpException('Test error', HttpStatus.INTERNAL_SERVER_ERROR);
      
      filter.catch(exception, mockArgumentsHost);

      const responseCall = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(responseCall.stack).toBeUndefined();

      process.env['NODE_ENV'] = originalEnv;
    });

    it('should log 5xx errors as error level', () => {
      const exception = new HttpException('Server error', HttpStatus.INTERNAL_SERVER_ERROR);
      
      filter.catch(exception, mockArgumentsHost);

      expect(loggerSpy).toHaveBeenCalledWith(
        'Internal server error occurred',
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          method: 'POST',
          url: '/test/endpoint',
          playerId: 'test-player-123',
          correlationId: 'test-correlation-123',
        }),
      );
    });

    it('should log 4xx errors as warn level', () => {
      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      const exception = new HttpException('Client error', HttpStatus.BAD_REQUEST);
      
      filter.catch(exception, mockArgumentsHost);

      expect(warnSpy).toHaveBeenCalledWith(
        'Client error occurred',
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          method: 'POST',
          url: '/test/endpoint',
          playerId: 'test-player-123',
          correlationId: 'test-correlation-123',
        }),
      );
    });

    it('should handle requests without player context', () => {
      mockRequest.player = undefined;
      mockRequest.correlationId = undefined;

      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Test error',
        }),
      );
    });

    it('should map common HTTP status codes to error names', () => {
      const testCases = [
        { status: HttpStatus.BAD_REQUEST, expectedError: 'Bad Request' },
        { status: HttpStatus.UNAUTHORIZED, expectedError: 'Unauthorized' },
        { status: HttpStatus.FORBIDDEN, expectedError: 'Forbidden' },
        { status: HttpStatus.NOT_FOUND, expectedError: 'Not Found' },
        { status: HttpStatus.CONFLICT, expectedError: 'Conflict' },
        { status: HttpStatus.UNPROCESSABLE_ENTITY, expectedError: 'Unprocessable Entity' },
        { status: HttpStatus.INTERNAL_SERVER_ERROR, expectedError: 'Internal Server Error' },
      ];

      testCases.forEach(({ status, expectedError }) => {
        const exception = new HttpException('Test message', status);
        
        filter.catch(exception, mockArgumentsHost);

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expectedError,
          }),
        );

        // Reset mocks for next iteration
        mockResponse.json.mockClear();
      });
    });

    it('should handle unknown status codes', () => {
      const exception = new HttpException('Test message', 418); // I'm a teapot
      
      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'HTTP Exception',
        }),
      );
    });

    it('should include comprehensive logging context', () => {
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);
      
      filter.catch(exception, mockArgumentsHost);

      const warnSpy = jest.spyOn(Logger.prototype, 'warn');
      expect(warnSpy).toHaveBeenCalledWith(
        'Client error occurred',
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          method: 'POST',
          url: '/test/endpoint',
          userAgent: 'test-user-agent',
          ip: '127.0.0.1',
          playerId: 'test-player-123',
          correlationId: 'test-correlation-123',
          error: 'Test error',
          stack: expect.any(String),
        }),
      );
    });
  });
});