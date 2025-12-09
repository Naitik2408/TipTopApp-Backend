const AppError = require('../../../src/utils/AppError');

describe('AppError', () => {
  test('should create an error with message and statusCode', () => {
    const error = new AppError('Test error', 400);
    
    expect(error.message).toBe('Test error');
    expect(error.statusCode).toBe(400);
    expect(error.status).toBe('fail');
    expect(error.isOperational).toBe(true);
  });

  test('should set status to "error" for 5xx status codes', () => {
    const error = new AppError('Server error', 500);
    
    expect(error.status).toBe('error');
  });

  test('should set status to "fail" for 4xx status codes', () => {
    const error = new AppError('Client error', 404);
    
    expect(error.status).toBe('fail');
  });

  test('should capture stack trace', () => {
    const error = new AppError('Test error', 400);
    
    expect(error.stack).toBeDefined();
  });

  test('should be instance of Error', () => {
    const error = new AppError('Test error', 400);
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(AppError);
  });

  test('should have isOperational set to true', () => {
    const error = new AppError('Test error', 400);
    
    expect(error.isOperational).toBe(true);
  });

  test('should handle statusCode as undefined if not provided', () => {
    const error = new AppError('Test error');
    
    expect(error.statusCode).toBeUndefined();
    expect(error.message).toBe('Test error');
  });
});
