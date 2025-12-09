const catchAsync = require('../../../src/utils/catchAsync');

describe('catchAsync', () => {
  test('should call the wrapped async function', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const wrappedFn = catchAsync(mockFn);
    
    const req = {};
    const res = {};
    const next = jest.fn();
    
    await wrappedFn(req, res, next);
    
    expect(mockFn).toHaveBeenCalledWith(req, res, next);
  });

  test('should pass error to next middleware on rejection', async () => {
    const error = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const wrappedFn = catchAsync(mockFn);
    
    const req = {};
    const res = {};
    const next = jest.fn();
    
    await wrappedFn(req, res, next);
    
    expect(next).toHaveBeenCalledWith(error);
  });

  test('should not call next if async function succeeds', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const wrappedFn = catchAsync(mockFn);
    
    const req = {};
    const res = {};
    const next = jest.fn();
    
    await wrappedFn(req, res, next);
    
    expect(next).not.toHaveBeenCalled();
  });

  test('should handle synchronous errors thrown in async function', async () => {
    const error = new Error('Sync error');
    const mockFn = jest.fn(async () => {
      throw error;
    });
    const wrappedFn = catchAsync(mockFn);
    
    const req = {};
    const res = {};
    const next = jest.fn();
    
    await wrappedFn(req, res, next);
    
    expect(next).toHaveBeenCalledWith(error);
  });

  test('should return a function', () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const wrappedFn = catchAsync(mockFn);
    
    expect(typeof wrappedFn).toBe('function');
  });
});
