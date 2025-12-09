const APIFeatures = require('../../../src/utils/APIFeatures');

// Mock mongoose query
const createMockQuery = () => ({
  find: jest.fn().mockReturnThis(),
  sort: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  countDocuments: jest.fn().mockResolvedValue(100),
  exec: jest.fn().mockResolvedValue([]),
});

describe('APIFeatures', () => {
  describe('filter()', () => {
    test('should filter query correctly', () => {
      const mockQuery = createMockQuery();
      const queryString = { category: 'Pizza', page: 1, sort: 'name', limit: 10, fields: 'name,price' };
      
      const features = new APIFeatures(mockQuery, queryString);
      features.filter();
      
      // Query string should still have original properties
      expect(features.queryString).toHaveProperty('page');
      expect(mockQuery.find).toHaveBeenCalled();
    });

    test('should convert MongoDB operators', () => {
      const mockQuery = createMockQuery();
      const queryString = { price: { gte: 100, lt: 500 } };
      
      const features = new APIFeatures(mockQuery, queryString);
      features.filter();
      
      expect(mockQuery.find).toHaveBeenCalledWith({
        price: { $gte: 100, $lt: 500 }
      });
    });

    test('should handle lte and gt operators', () => {
      const mockQuery = createMockQuery();
      const queryString = { rating: { lte: 5, gt: 3 } };
      
      const features = new APIFeatures(mockQuery, queryString);
      features.filter();
      
      expect(mockQuery.find).toHaveBeenCalledWith({
        rating: { $lte: 5, $gt: 3 }
      });
    });
  });

  describe('sort()', () => {
    test('should sort by specified field', () => {
      const mockQuery = createMockQuery();
      const queryString = { sort: 'price' };
      
      const features = new APIFeatures(mockQuery, queryString);
      features.sort();
      
      expect(mockQuery.sort).toHaveBeenCalledWith('price');
    });

    test('should handle multiple sort fields', () => {
      const mockQuery = createMockQuery();
      const queryString = { sort: 'price,name' };
      
      const features = new APIFeatures(mockQuery, queryString);
      features.sort();
      
      expect(mockQuery.sort).toHaveBeenCalledWith('price name');
    });

    test('should default to sorting by -createdAt', () => {
      const mockQuery = createMockQuery();
      const queryString = {};
      
      const features = new APIFeatures(mockQuery, queryString);
      features.sort();
      
      expect(mockQuery.sort).toHaveBeenCalledWith('-createdAt');
    });
  });

  describe('limitFields()', () => {
    test('should select specified fields', () => {
      const mockQuery = createMockQuery();
      const queryString = { fields: 'name,price,category' };
      
      const features = new APIFeatures(mockQuery, queryString);
      features.limitFields();
      
      expect(mockQuery.select).toHaveBeenCalledWith('name price category');
    });

    test('should exclude __v field by default', () => {
      const mockQuery = createMockQuery();
      const queryString = {};
      
      const features = new APIFeatures(mockQuery, queryString);
      features.limitFields();
      
      expect(mockQuery.select).toHaveBeenCalledWith('-__v');
    });
  });

  describe('paginate()', () => {
    test('should skip and limit based on page and limit', () => {
      const mockQuery = createMockQuery();
      const queryString = { page: 3, limit: 20 };
      
      const features = new APIFeatures(mockQuery, queryString);
      features.paginate();
      
      expect(mockQuery.skip).toHaveBeenCalledWith(40); // (3-1) * 20
      expect(mockQuery.limit).toHaveBeenCalledWith(20);
    });

    test('should default to page 1 and limit 10', () => {
      const mockQuery = createMockQuery();
      const queryString = {};
      
      const features = new APIFeatures(mockQuery, queryString);
      features.paginate();
      
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
    });

    test('should handle string page and limit values', () => {
      const mockQuery = createMockQuery();
      const queryString = { page: '2', limit: '50' };
      
      const features = new APIFeatures(mockQuery, queryString);
      features.paginate();
      
      expect(mockQuery.skip).toHaveBeenCalledWith(50);
      expect(mockQuery.limit).toHaveBeenCalledWith(50);
    });
  });

  describe('search()', () => {
    test('should add text search to query', () => {
      const mockQuery = createMockQuery();
      const queryString = { search: 'pizza' };
      
      const features = new APIFeatures(mockQuery, queryString);
      features.search();
      
      expect(mockQuery.find).toHaveBeenCalledWith({
        $text: { $search: 'pizza' }
      });
    });

    test('should not add search if no search term provided', () => {
      const mockQuery = createMockQuery();
      const queryString = {};
      
      const features = new APIFeatures(mockQuery, queryString);
      features.search();
      
      expect(mockQuery.find).not.toHaveBeenCalled();
    });
  });

  describe('execute()', () => {
    test('should return data and pagination info', async () => {
      const mockQuery = createMockQuery();
      const mockData = [{ id: 1 }, { id: 2 }];
      
      // Mock the query to return data when awaited
      mockQuery.then = jest.fn((resolve) => {
        resolve(mockData);
        return Promise.resolve(mockData);
      });
      
      // Mock Model with countDocuments
      const MockModel = {
        countDocuments: jest.fn().mockResolvedValue(100),
      };
      
      const queryString = { page: 1, limit: 10 };
      const features = new APIFeatures(mockQuery, queryString);
      features.paginate();
      
      const result = await features.execute(MockModel);
      
      expect(result).toMatchObject({
        data: mockData,
        pagination: {
          page: 1,
          limit: 10,
          total: 100,
          pages: 10,
        }
      });
    });

    test('should calculate correct total pages', async () => {
      const mockQuery = createMockQuery();
      mockQuery.then = jest.fn((resolve) => {
        resolve([]);
        return Promise.resolve([]);
      });
      
      const MockModel = {
        countDocuments: jest.fn().mockResolvedValue(95),
      };
      
      const queryString = { page: 1, limit: 10 };
      const features = new APIFeatures(mockQuery, queryString);
      features.paginate();
      
      const result = await features.execute(MockModel);
      
      expect(result.pagination.pages).toBe(10); // Math.ceil(95/10)
    });
  });

  describe('Method chaining', () => {
    test('should allow method chaining', async () => {
      const mockQuery = createMockQuery();
      mockQuery.then = jest.fn((resolve) => {
        resolve([]);
        return Promise.resolve([]);
      });
      
      const MockModel = {
        countDocuments: jest.fn().mockResolvedValue(0),
      };
      
      const queryString = {
        price: { gte: 100 },
        sort: 'name',
        fields: 'name,price',
        page: 2,
        limit: 20,
        search: 'pizza'
      };
      
      const features = new APIFeatures(mockQuery, queryString);
      const result = await features
        .filter()
        .sort()
        .limitFields()
        .paginate()
        .search()
        .execute(MockModel);
      
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
    });
  });
});
