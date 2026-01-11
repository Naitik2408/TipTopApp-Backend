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
      
      // Store search term for relevance sorting later
      this._searchTerm = searchTerm;
      
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
      
      // Build search patterns - default fields for menu items
      const searchPatterns = [
        // Menu item fields
        { name: { $regex: simplePattern, $options: 'i' } },
        { description: { $regex: simplePattern, $options: 'i' } },
        { categories: { $regex: simplePattern, $options: 'i' } },
        
        // User fields (nested)
        { 'name.first': { $regex: simplePattern, $options: 'i' } },
        { 'name.last': { $regex: simplePattern, $options: 'i' } },
        { 'email.address': { $regex: simplePattern, $options: 'i' } },
        { 'phone.number': { $regex: simplePattern, $options: 'i' } },
      ];
      
      // Check for common typo corrections
      const correctedTerm = typoMappings[searchTerm];
      if (correctedTerm) {
        const correctedPattern = correctedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchPatterns.push(
          { name: { $regex: correctedPattern, $options: 'i' } },
          { description: { $regex: correctedPattern, $options: 'i' } }
        );
      }
      
      // Flexible pattern for typo tolerance (allows 1-2 character differences)
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
          { description: { $regex: flexiblePattern, $options: 'i' } },
          { 'name.first': { $regex: flexiblePattern, $options: 'i' } },
          { 'name.last': { $regex: flexiblePattern, $options: 'i' } }
        );
      }
      
      // Word-by-word matching for multi-word queries
      const words = searchTerm.split(/\s+/).filter(w => w.length >= 3);
      words.forEach(word => {
        const wordRegex = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        searchPatterns.push(
          { name: { $regex: wordRegex, $options: 'i' } },
          { 'name.first': { $regex: wordRegex, $options: 'i' } },
          { 'name.last': { $regex: wordRegex, $options: 'i' } }
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
    // Get total count for pagination metadata FIRST
    const page = parseInt(this.queryString.page, 10) || 1;
    const limit = parseInt(this.queryString.limit, 10) || 10;
    
    // For search relevance, we need to get ALL matching documents before pagination
    if (this._searchTerm) {
      // Clone the query without skip/limit for relevance sorting
      const queryWithoutPagination = this.query.model.find(this.query.getQuery());
      let allDocs = await queryWithoutPagination.select('-__v').exec();
      
      if (allDocs.length > 0) {
        const searchTerm = this._searchTerm.toLowerCase();
        
        allDocs = allDocs.map(doc => {
          const docObj = doc.toObject ? doc.toObject() : doc;
          
          // Handle both MenuItem and User documents
          let searchableText = '';
          
          // For MenuItem
          if (docObj.name && typeof docObj.name === 'string') {
            searchableText = docObj.name.toLowerCase();
          }
          // For User
          else if (docObj.name && typeof docObj.name === 'object') {
            const firstName = docObj.name.first || '';
            const lastName = docObj.name.last || '';
            searchableText = `${firstName} ${lastName}`.toLowerCase().trim();
          }
          
          const description = (docObj.description || '').toLowerCase();
          const email = (docObj.email?.address || '').toLowerCase();
          const phone = (docObj.phone?.number || '').toLowerCase();
          
          let relevanceScore = 0;
          
          // Exact match in name (highest priority)
          if (searchableText === searchTerm) {
            relevanceScore = 1000;
          }
          // Exact match in email
          else if (email === searchTerm) {
            relevanceScore = 950;
          }
          // Starts with search term in name
          else if (searchableText.startsWith(searchTerm)) {
            relevanceScore = 900;
          }
          // Exact match in phone
          else if (phone.includes(searchTerm)) {
            relevanceScore = 850;
          }
          // Exact word match in name (e.g., "chicken korma" matches "chicken")
          else if (searchableText.split(/\s+/).includes(searchTerm)) {
            relevanceScore = 800;
          }
          // Contains search term in email
          else if (email.includes(searchTerm)) {
            relevanceScore = 750;
          }
          // Contains search term in name
          else if (searchableText.includes(searchTerm)) {
            // Higher score if match is closer to the start
            const position = searchableText.indexOf(searchTerm);
            relevanceScore = 700 - (position * 2);
          }
          // Match in description
          else if (description.includes(searchTerm)) {
            relevanceScore = 300;
          }
          // Fuzzy/partial matches
          else {
            relevanceScore = 100;
          }
          
          // Boost score based on rating and popularity (for MenuItems)
          if (docObj.rating) {
            relevanceScore += (docObj.rating || 0) * 10;
          }
          if (docObj.reviews) {
            relevanceScore += Math.min((docObj.reviews || 0), 50);
          }
          
          // Boost score for active users
          if (docObj.isActive !== undefined && docObj.isActive) {
            relevanceScore += 20;
          }
          
          return { doc, relevanceScore };
        });
        
        // Sort by relevance score (highest first)
        allDocs.sort((a, b) => b.relevanceScore - a.relevanceScore);
        
        // Extract just the documents
        allDocs = allDocs.map(item => item.doc);
        
        // Apply pagination AFTER sorting
        const skip = (page - 1) * limit;
        const docs = allDocs.slice(skip, skip + limit);
        const total = allDocs.length;
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
    
    // Execute the query normally (no search term or no results)
    const docs = await this.query;

    // Use the actual query conditions for counting instead of rebuilding
    const countQuery = this.query.model.find(this.query.getQuery());
    const total = await countQuery.countDocuments();
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
