/**
 * APIFeatures class for advanced query operations
 * Provides filtering, sorting, field limiting, and pagination
 */
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  /**
   * Filter documents based on query parameters
   * Supports: exact match, greater than (gte), less than (lte), in, etc.
   * Example: ?price[gte]=100&price[lte]=500
   */
  filter() {
    // Create a shallow copy of queryString
    const queryObj = { ...this.queryString };

    // Remove special fields that should not be used for filtering
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'fuzzy'];
    excludedFields.forEach((field) => delete queryObj[field]);

    // Handle category filter specially (map category to categories array)
    if (queryObj.category) {
      queryObj.categories = queryObj.category;
      delete queryObj.category;
    }

    // Advanced filtering: replace gte, gt, lte, lt, in, nin with MongoDB operators
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in|nin)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  /**
   * Text search functionality with flexible matching
   * Handles partial matches and common typos
   * Example: ?search=chicken → matches "chicken", "Chicken Tikka", etc.
   *          ?search=chiken → matches "chicken" (typo tolerance)
   */
  search() {
    if (this.queryString.search) {
      const searchTerm = this.queryString.search.trim().toLowerCase();
      
      // Get current query conditions
      const currentConditions = this.query.getQuery();
      
      // Escape special regex characters
      const simplePattern = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // Common typo mappings (expand as needed)
      const typoMappings = {
        'panir': 'paneer',
        'paner': 'paneer',
        'chiken': 'chicken',
        'chikken': 'chicken',
        'kadhai': 'kadai',
        'kadai': 'kadhai',
        'biriyani': 'biryani',
        'briyani': 'biryani',
        'naan': 'nan',
        'nan': 'naan',
        'roti': 'rotti',
        'rotti': 'roti',
      };
      
      // Build search patterns
      const searchPatterns = [
        // 1. Direct substring match (most common case)
        { name: { $regex: simplePattern, $options: 'i' } },
        { description: { $regex: simplePattern, $options: 'i' } },
        { categories: { $regex: simplePattern, $options: 'i' } },
      ];
      
      // 2. Check for common typo corrections
      const correctedTerm = typoMappings[searchTerm];
      if (correctedTerm) {
        const correctedPattern = correctedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchPatterns.push(
          { name: { $regex: correctedPattern, $options: 'i' } },
          { description: { $regex: correctedPattern, $options: 'i' } }
        );
      }
      
      // 3. Flexible pattern for typo tolerance (allows 1-2 character differences)
      if (searchTerm.length >= 4) {
        // Create pattern with optional characters between each letter
        const chars = searchTerm.split('');
        const flexiblePattern = chars
          .map((char, i) => {
            const escaped = char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // For middle characters, allow optional extra char
            if (i < chars.length - 1) {
              return escaped + '.{0,1}';
            }
            return escaped;
          })
          .join('');
        
        searchPatterns.push(
          { name: { $regex: flexiblePattern, $options: 'i' } },
          { description: { $regex: flexiblePattern, $options: 'i' } }
        );
      }
      
      // 4. Word-by-word matching for multi-word queries
      const words = searchTerm.split(/\s+/).filter(w => w.length >= 3);
      words.forEach(word => {
        const wordRegex = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchPatterns.push(
          { name: { $regex: wordRegex, $options: 'i' } }
        );
      });
      
      // Build search filter using $or
      const searchFilter = { $or: searchPatterns };
      
      // Merge conditions with existing query
      if (Object.keys(currentConditions).length > 0) {
        if (currentConditions.$and) {
          currentConditions.$and.push(searchFilter);
          this.query.setQuery(currentConditions);
        } else {
          const mergedConditions = {
            $and: [currentConditions, searchFilter]
          };
          this.query.setQuery(mergedConditions);
        }
      } else {
        this.query.setQuery(searchFilter);
      }
    }

    return this;
  }

  /**
   * Sort documents based on query parameter
   * Example: ?sort=price,-rating (ascending price, descending rating)
   * Default: -createdAt (newest first)
   */
  sort() {
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default sort by creation date (newest first)
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  /**
   * Limit fields returned in response
   * Example: ?fields=name,price,image (only return these fields)
   * Default: exclude __v
   */
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // Exclude __v by default
      this.query = this.query.select('-__v');
    }

    return this;
  }

  /**
   * Paginate results
   * Example: ?page=2&limit=10
   * Default: page=1, limit=10
   */
  paginate() {
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  /**
   * Populate referenced documents
   * @param {string|object} populateOptions - Field(s) to populate
   */
  populate(populateOptions) {
    if (populateOptions) {
      this.query = this.query.populate(populateOptions);
    }

    return this;
  }

  /**
   * Execute the query and return results with metadata
   * @param {Mongoose.Model} Model - The model to count total documents
   * @returns {Promise<Object>} Results with pagination metadata
   */
  async execute(Model) {
    // Execute the query
    const docs = await this.query;

    // Get total count for pagination metadata
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;

    // Build the same filter for counting
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search', 'fuzzy'];
    excludedFields.forEach((field) => delete queryObj[field]);

    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt|in|nin)\b/g, (match) => `$${match}`);
    const filterObj = JSON.parse(queryStr);

    // Add search to filter if exists (use regex for consistency)
    if (this.queryString.search) {
      const searchTerm = this.queryString.search.trim();
      const searchRegex = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      filterObj.$or = [
        { name: { $regex: searchRegex, $options: 'i' } },
        { description: { $regex: searchRegex, $options: 'i' } },
        { categories: { $regex: searchRegex, $options: 'i' } },
      ];
    }

    const total = await Model.countDocuments(filterObj);
    const totalPages = Math.ceil(total / limit);

    return {
      data: docs,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}

module.exports = APIFeatures;
